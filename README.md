# Twitter-recommendation-pipeline




# Table of Contents

- [Description](#Description)
- [Installation](#Installation)
- [Usage](#Usage)
  
## Description

The project is focused on creating a graph-based recommendation system tailored for Twitter/X-like users, delivering personalized follow recommendations. It integrates a front-end web application for user engagement, a Neo4j graph database for robust data storage, and NLP processing for sentiment analysis via Kafka Streams. The main objective is to establish an efficient data processing framework for tweet processing, graph database updates, and user interaction-based recommendations, all while ensuring streamlined data storage and real-time sentiment analysis. The solution encompasses the deployment of a Neo4j graph database, the design of a MongoDB schema for comprehensive user profile and tweet storage, and the incorporation of sentiment analysis using the TextBlob NLP library, seamlessly integrated with the chosen stream processing engine, Kafka Streams. The sentiment analysis results are channeled through the Kafka Message broker and recorded in the "SENTIMENT_TOPIC" Kafka topic, subsequently utilized to update the relevant nodes in the Neo4j graph database.


## Installation

- Install Neo4j
- Install Kafka



## Usage
Explain how to use your project, including any commands or steps required to run it.

Features: List the key features of your project.

Technologies Used: Mention the technologies, frameworks, and libraries used in your project.


## Contributing

Guidelines on how others can contribute to your project.
