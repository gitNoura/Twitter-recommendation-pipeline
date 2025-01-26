from confluent_kafka import Producer, Consumer, KafkaException, KafkaError
from textblob import TextBlob
from neo4j import GraphDatabase
import json
import subprocess
import sys

# Kafka broker details
KAFKA_BROKER = "localhost:9092"
RAW_TWEETS_TOPIC = "RAW_TWEETS_TOPIC"
SENTIMENT_TOPIC = "SENTIMENT_TOPIC"

# Neo4j connection details
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "twittertwitter"

# Configure Kafka producer
producer = Producer({"bootstrap.servers": KAFKA_BROKER})

# Configure Neo4j driver
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def fetch_tweet(tweet_id):
    with driver.session() as session:
        result = session.run(
            "MATCH (tweet:Tweet {id_str: $tweetId}) RETURN tweet",
            tweetId=tweet_id
        )
        tweets = [node_to_dict(record['tweet']) for record in result]
        print("Fetched successfully!", tweet_id)
        return tweets

def node_to_dict(node):
    return {
        'id': node['id'],
        'text': node['text']
    }

def publish_tweet(tweet):
    producer.produce(RAW_TWEETS_TOPIC, key=None, value=json.dumps(tweet))
    producer.flush()

def process_tweet(tweet_id):
    tweet = fetch_tweet(tweet_id)
    if tweet:
        publish_tweet(tweet[0])
        print("Published tweet:", tweet_id)
    else:
        print("Tweet not found:", tweet_id)

def start_processing(tweet_id):
    process_tweet(tweet_id)

def kafka_consumer():
    consumer_conf = {
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "sentiment-analysis-group",
        "auto.offset.reset": "earliest"
    }
    consumer = Consumer(consumer_conf)
    consumer.subscribe([RAW_TWEETS_TOPIC])
    try:
        running = True
        while running:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                running = False
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print("End of partition")
                    continue
                else:
                    raise KafkaException(msg.error())
            tweet_data_str = msg.value().decode("utf-8")
            try:
                tweet_data = json.loads(tweet_data_str)
            except json.JSONDecodeError:
                print("Failed to decode JSON:", tweet_data_str)
                continue
            tweet_id = tweet_data.get("id")
            print("Received tweet id: ", tweet_id)
            tweet_text = tweet_data.get("text")
            if tweet_id is not None and tweet_text is not None:
                print("Starting sentiment analysis...")
                # Perform sentiment analysis
                blob = TextBlob(tweet_text)
                sentiment = blob.sentiment.polarity
                data = {"id": tweet_id, "sentiment": sentiment}
                # Produce sentiment result into SENTIMENT_TOPIC
                producer.produce(SENTIMENT_TOPIC, key=None, value=json.dumps(data).encode('utf-8'))
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()
        producer.flush()

def sentiment():
    consumer_conf = {
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "sentiment-analysis-group",
        "auto.offset.reset": "earliest"
    }
    consumer = Consumer(consumer_conf)
    consumer.subscribe([SENTIMENT_TOPIC])

    try:
        running = True
        while running:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                running = False
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print("End of partition")
                    continue
                else:
                    raise KafkaException(msg.error())
            tweet_data_str = msg.value().decode("utf-8")
            try:
                tweet_data = json.loads(tweet_data_str)
            except json.JSONDecodeError:
                print("Failed to decode JSON:", tweet_data_str)
                continue
            tweet_id = tweet_data.get("id")
            print("Received tweet id: ", tweet_id)
            tweet_sentiment = tweet_data.get("sentiment")
            if tweet_id is not None and tweet_sentiment is not None:
                print("Inserting into neo4j")
                with driver.session() as session:
                    print("Tweet id:", tweet_id)
                    print("Tweet sentiment:", tweet_sentiment)
                    res = session.run(
                        "MATCH (tweet:Tweet { id: $tweetId }) SET tweet.sentiment = $sentiment",
                        tweetId=tweet_id, sentiment=tweet_sentiment
                    )
                    print("Sentiment done!")

    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()
        driver.close()
        print("Consumer and Neo4j driver closed")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python start.py <tweet_id>")
        sys.exit(1)
    tweet_id = sys.argv[1]
    start_processing(tweet_id)
    kafka_consumer()
    sentiment()