import { NextApiRequest, NextApiResponse } from "next";

import prisma from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";
import neo4j from 'neo4j-driver';

// Neo4j connection details
const neoUri = 'bolt://localhost:7687';
const neoUsername = 'neo4j';
const neoPassword = 'twittertwitter';

const neoDriver = neo4j.driver(neoUri, neo4j.auth.basic(neoUsername, neoPassword));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).end();
  }

  try {
    const { userId } = req.body;

    const { currentUser } = await serverAuth(req, res);

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid ID');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new Error('Invalid ID');
    }

    let updatedFollowingIds = [...(user.followingIds || [])];

    if (req.method === 'POST') {
      updatedFollowingIds.push(userId);

      // Neo4j query to create a FOLLOWS relationship
      const session = neoDriver.session();
      // Check if the FOLLOWS relationship already exists
      const result = await session.run(
        'MATCH (follower:User { screen_name: $followerScreenName })-[r:FOLLOWS]->(followed:User { screen_name: $followedScreenName }) ' +
        'RETURN r',
        { followerScreenName: currentUser.username, followedScreenName: user.username }
      );

      if (!result.records.length) {
        // FOLLOWS relationship does not exist, so create it
        await session.run(
          'MATCH (follower:User { screen_name: $followerScreenName }), (followed:User { screen_name: $followedScreenName }) ' +
          'CREATE (follower)-[:FOLLOWS]->(followed)',
          { followerScreenName: currentUser.username, followedScreenName: user.username }
        );
      }

      await session.close();

      // NOTIFICATION PART START
      try {
        await prisma.notification.create({
          data: {
            body: 'Someone followed you!',
            userId,
          },
        });

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            hasNotification: true,
          }
        });
      } catch (error) {
        console.log(error);
      }
      // NOTIFICATION PART END
      
    }

    if (req.method === 'DELETE') {
      updatedFollowingIds = updatedFollowingIds.filter((followingId) => followingId !== userId);
      // Neo4j query to create a FOLLOWS relationship
      const session = neoDriver.session();
      await session.run(
        'MATCH (follower:User { screen_name: $followerScreenName })-[r:FOLLOWS]->(followed:User { screen_name: $followedScreenName }) ' +
        'DELETE r',
        { followerScreenName: currentUser.username, followedScreenName: user.username }
      );
      await session.close();
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id
      },
      data: {
        followingIds: updatedFollowingIds
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}