from neo4j import GraphDatabase
from pymongo import MongoClient
from datetime import datetime

# Neo4j connection details
neo_uri = "bolt://localhost:7687"
neo_username = "neo4j"
neo_password = "twittertwitter"

# MongoDB connection details
mongo_uri = "mongodb+srv://Diza:Diza@cluster0.rsncthd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo_client = MongoClient(mongo_uri)
mongo_db = mongo_client["test"]
mongo_collection = mongo_db["Post"]
mongo_collection_users = mongo_db["User"]

# Connect to Neo4j
print("Connecting to Neo4j...")
neo_driver = GraphDatabase.driver(neo_uri, auth=(neo_username, neo_password))
print("Connected to Neo4j.")

# Define function to execute Neo4j query and insert into MongoDB
def insert_tweet_entries():
    with neo_driver.session() as neo_session:
        # Cypher query to retrieve tweet data from Neo4j
        print("Executing Cypher query in Neo4j...")
        neo_query = """
        MATCH (u:User)-[:POSTS]-(t:Tweet)
        RETURN t.text AS text, u.screen_name AS screen_name;
        """
        result = neo_session.run(neo_query)
        print("Cypher query executed.")

        # Iterate over result and insert into MongoDB
        print("Inserting tweet entries into MongoDB...")
        for record in result:
            text = record["text"]
            screen_name = record["screen_name"]

            # Find the user in MongoDB using the screen_name
            user = mongo_collection_users.find_one({"username": screen_name})

            if user:
                print("USER FOUND!!!")
                # Insert tweet entry into MongoDB
                tweet_dict = {
                    "body": text,
                    "userId": user["_id"],  # Use the MongoDB ID of the user
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                }
                mongo_collection.insert_one(tweet_dict)
        print("Tweet entries inserted into MongoDB.")

# Execute the function
print("Executing tweet data insertion process...")
insert_tweet_entries()
print("Tweet data insertion process completed.")