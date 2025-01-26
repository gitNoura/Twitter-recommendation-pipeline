import { NextApiRequest, NextApiResponse } from 'next';
import neo4j, { Driver } from 'neo4j-driver';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';


const prisma = new PrismaClient();

const neo_uri = 'bolt://localhost:7687';
const neo_username = 'neo4j';
const neo_password = 'twittertwitter';


let driver: Driver | null = null;

const getDriver = () => {
  if (!driver) {
    driver = neo4j.driver(neo_uri, neo4j.auth.basic(neo_username, neo_password));
  }
  return driver;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    throw new Error('Not signed in');
  } 

  const currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    }
  });
  const username = currentUser?.username;

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const session = getDriver().session();

    const result = await session.run(`
      MATCH (u:User {screen_name : $name})-[:POSTS]->(Tweet)-[:TAGS]->(h:Hashtag)<-[:TAGS]-(t:Tweet)<-[:POSTS]-(recommended_user:User)
      WHERE u <> recommended_user AND NOT (u)-[:FOLLOWS]->(recommended_user)
      WITH DISTINCT recommended_user
      RETURN recommended_user

      UNION

      MATCH (recommended_user:User)-[:POSTS]->(t:Tweet)-[:MENTIONS]->(u:User {screen_name : $name})
      WHERE u <> recommended_user AND NOT (u)-[:FOLLOWS]->(recommended_user)
      WITH DISTINCT recommended_user
      RETURN recommended_user

      UNION

      MATCH (recommended_user:User)-[:POSTS]->(t:Tweet)-[:MENTIONS]->(c:User)<-[:MENTIONS]-(t2:Tweet)<-[:POSTS]-(u:User {screen_name : $name})
      WHERE u <> recommended_user AND NOT (u)-[:FOLLOWS]->(recommended_user)
      WITH DISTINCT recommended_user
      RETURN recommended_user
    `,{ name : username });

    const recommendations = [];
    for (const record of result.records) {
      const userProperties = record.get('recommended_user').properties;
      const existingUser = await prisma.user.findUnique({
        where: {
          username: userProperties.screen_name,
        },
      });

      if (existingUser) {
        recommendations.push({
          _id: existingUser.id,
          name: userProperties.name,
          username: userProperties.screen_name,
          bio: userProperties.location,
        });
      }
    }

    await session.close();

    return res.status(200).json(recommendations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch recommended users' });
  } finally {
    await prisma.$disconnect();
  }
}
