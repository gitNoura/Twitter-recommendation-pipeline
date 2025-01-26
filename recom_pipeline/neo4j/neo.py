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
mongo_collection = mongo_db["User"]

# Connect to Neo4j
print("Connecting to Neo4j...")
neo_driver = GraphDatabase.driver(neo_uri, auth=(neo_username, neo_password))
print("Connected to Neo4j.")

# Define function to execute Neo4j query and insert into MongoDB
def insert_user_entries():
    with neo_driver.session() as neo_session:
        # Cypher query to retrieve user data from Neo4j
        print("Executing Cypher query in Neo4j...")
        neo_query = "MATCH (u2:User) RETURN u2;"
        result = neo_session.run(neo_query)
        print("Cypher query executed.")

        # Iterate over result and insert into MongoDB
        print("Inserting user entries into MongoDB...")
        for record in result:
            user_data = record["u2"]
            # Convert Neo4j node properties to a dictionary
            user_dict = {
                "name": user_data.get("name"),
                "username": user_data.get("screen_name"),
                "email": user_data.get("screen_name") + "@gmail.com",  # Email based on username
                "hashedPassword": "123",  # Default password
                "createdAt": datetime.now(),
                "updatedAt": datetime.now(),
                "followers": user_data.get("followers"),
                "following": user_data.get("following"),
                "bio": user_data.get("location")
            }
            # Insert user entry into MongoDB
            mongo_collection.insert_one(user_dict)
        print("User entries inserted into MongoDB.")

# Execute the function
print("Executing data insertion process...")
insert_user_entries()
print("Data insertion process completed.")

# Close connections
print("Closing connections...")
neo_driver.close()
mongo_client.close()
print("Connections closed.")