# Twitter-recommendation-pipeline

<div align="center">
  <img src="https://github.com/gitNoura/Twitter-recommendation-pipeline/assets/159318078/04ba2272-7004-4a2c-994b-f0e6ab2bebb7" alt="Image Description">
</div>


# Table of Contents

- [Description](#Description)
- [Video](#Video)
- [Usage & Prerequisites](#Usage--Prerequisites)
  
## Description

The project is focused on creating a graph-based recommendation system tailored for **Twitter/X-like** users, delivering personalized follow recommendations. It integrates a front-end web application for user engagement, a Neo4j graph database for robust data storage, and NLP processing for sentiment analysis via Kafka Streams. The main objective is to establish an efficient data processing framework for tweet processing, graph database updates, and user interaction-based recommendations, all while ensuring streamlined data storage and real-time sentiment analysis. The solution encompasses the deployment of a Neo4j graph database, the design of a MongoDB schema for comprehensive user profile and tweet storage, and the incorporation of sentiment analysis using the TextBlob NLP library, seamlessly integrated with the chosen stream processing engine, Kafka Streams. The sentiment analysis results are channeled through the Kafka Message broker and recorded in the "SENTIMENT_TOPIC" Kafka topic, subsequently utilized to update the relevant nodes in the Neo4j graph database.

## Video

> [[Recommendation Pipeline](https://www.youtube.com/watch?v=4Cxi3a4jylY)]

## Usage & Prerequisites

* ### Interface
#### Install packages

```shell
npm i
```

#### Setup .env file


```js
DATABASE_URL=
NEXTAUTH_JWT_SECRET=
NEXTAUTH_SECRET=
```


* ### Neo4j (Node version 14.x)
   Set up and configure Neo4j to facilitate efficient data storage and retrieval within the project. Refer to the provided vyoutube ideo for detailed installation instructions. [[link](https://youtu.be/qAFivl3z8jo)]
  > In our case we created a new local database and clone a sample of data from neo4j-graph-examples/twitter-v2 database to facilitate testing and development. Please refer to the video provided to create a local DBMS [[link](https://youtu.be/xwObLzLcMJ0)] and to clone a sample of the data refer to neocreate.py under twitter-clone.
  > 
  > In the code, you will only need to replace the password with the password of the new database that you created in Neo4j and run the code.

* ### MongoDB
   To ensure the efficient storage and retrieval of user-centric and tweet-related data, it's crucial to be connected to MongoDB. In MongoDB, a well-defined schema is employed to store user profiles and tweets. The schema, designed in Prisma, is structured to accommodate the diverse attributes associated with user profiles, such as user information and social interactions. Similarly, the schema for tweets encompasses relevant metadata and content. 
  > This schema design, which can be referred to in prisma/schema.prisma, plays a crucial role in contributing to the overall effectiveness of the recommendation system.
  > The code in neo4j/neo.py is used to load users from Neo4j to MongoDB, and the code in neo4j/tweet.py is for tweets. Please replace the password in line 8 with your own database password, replace the uri in line 11 with the link you will find in MongoDB, and the collection in line 13 and 14 with your own collection's name.

* ### Kafka message broker (3.7.0)
  This component streams raw tweets for sentiment analysis and efficiently updates the graph database with sentiment information.
  >Install kafka by following the instruction in this video [https://youtu.be/BwYFuhVhshI].

#### Start the app

```shell
npm run dev
```
