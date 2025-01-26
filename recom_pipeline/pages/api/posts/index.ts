import { NextApiRequest, NextApiResponse } from "next";
import { spawn } from 'child_process';
import { exec } from 'child_process';

import serverAuth from "@/libs/serverAuth";
import prisma from "@/libs/prismadb";
import neo4j from 'neo4j-driver';

// Neo4j connection details
const neoUri = 'bolt://localhost:7687';
const neoUsername = 'neo4j';
const neoPassword = 'twittertwitter';

const neoDriver = neo4j.driver(neoUri, neo4j.auth.basic(neoUsername, neoPassword));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    
    if (req.method === 'POST') {
      const { currentUser } = await serverAuth(req, res);
      const { body } = req.body;

      // Extract mentions and hashtags from the tweet body
      const mentions = extractMentions(body);
      const hashtags = extractHashtags(body);

      // Neo4j query to create a tweet node and its relationships
      const session = neoDriver.session();
      const generateRandomId = (length: number): { integerId: number, stringId: string } => {
        const stringId = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
        return { integerId: parseInt(stringId, 10), stringId };
      };
      const { integerId, stringId } = generateRandomId(19);
      await session.run(
        'MATCH (user:User { screen_name: $name }) ' +
        'CREATE (user)-[:POSTS]->(tweet:Tweet { id: $integerId, id_str: $stringId, text: $body, createdAt: $createdAt }) ' +
        'FOREACH (mention in $mentions | ' +
        '  MERGE (mentionedUser:User { screen_name: mention }) ' +
        '  MERGE (tweet)-[:MENTIONS]->(mentionedUser) ' +
        ') ' +
        'FOREACH (hashtag in $hashtags | ' +
        '  MERGE (tag:Hashtag { name: hashtag }) ' +
        '  MERGE (tweet)-[:TAGS]->(tag) ' +
        ')',
        { name: currentUser.username, integerId, stringId, body, createdAt: new Date().toISOString(), mentions, hashtags }
      );
      await session.close();

      // Call start.py with the tweet ID as an argument
      exec(`python pages/api/posts/try/start.py ${stringId}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });

      const post = await prisma.post.create({
        data: {
          body,
          userId: currentUser.id
        }
      });

      return res.status(200).json(post);
    }

    if (req.method === 'GET') {
      const { userId } = req.query;

      console.log({ userId })

      let posts;

      if (userId && typeof userId === 'string') {
        posts = await prisma.post.findMany({
          where: {
            userId
          },
          include: {
            user: true,
            comments: true
          },
          orderBy: {
            createdAt: 'desc'
          },
        });
      } else {
        posts = await prisma.post.findMany({
          include: {
            user: true,
            comments: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      return res.status(200).json(posts);
    }
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}

// Helper function to extract mentions from tweet body
function extractMentions(body: string): string[] {
  const regex = /@(\w+)/g;
  const matches = body.match(regex);
  return matches ? matches.map(match => match.substring(1)) : [];
}

// Helper function to extract hashtags from tweet body
function extractHashtags(body: string): string[] {
  const regex = /#(\w+)/g;
  const matches = body.match(regex);
  return matches ? matches.map(match => match.substring(1)) : [];
}