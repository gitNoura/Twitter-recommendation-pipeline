import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from "next";

import prisma from '@/libs/prismadb';
import neo4j from 'neo4j-driver';

// Neo4j connection details
const neoUri = 'bolt://localhost:7687';
const neoUsername = 'neo4j';
const neoPassword = 'twittertwitter';

const neoDriver = neo4j.driver(neoUri, neo4j.auth.basic(neoUsername, neoPassword));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { email, username, name, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        hashedPassword,
      }
    });

    // Neo4j query to insert the user
    const session = neoDriver.session();
    await session.run(
      'CREATE (u:User { screen_name: $username, name: $name })',
      { username, name }
    );
    await session.close();

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
}