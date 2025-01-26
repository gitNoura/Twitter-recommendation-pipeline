from neo4j import GraphDatabase

# Old Neo4j connection details
OLD_NEO4J_URI = "bolt+s://demo.neo4jlabs.com:7687"
OLD_NEO4J_USER = "twitter"
OLD_NEO4J_PASSWORD = "twitter"

# New Neo4j connection details
NEW_NEO4J_URI = "bolt://localhost:7687"
NEW_NEO4J_USER = "neo4j"
NEW_NEO4J_PASSWORD = "twittertwitter"

# Configure Neo4j drivers
old_driver = GraphDatabase.driver(OLD_NEO4J_URI, auth=(OLD_NEO4J_USER, OLD_NEO4J_PASSWORD))
new_driver = GraphDatabase.driver(NEW_NEO4J_URI, auth=(NEW_NEO4J_USER, NEW_NEO4J_PASSWORD))

def clone_sample_nodes_and_relationships():
    with old_driver.session() as old_session, new_driver.session() as new_session:
        # Get all nodes from the old database
        nodes_result = old_session.run("MATCH (n) RETURN n LIMIT")

        # Dictionary to keep track of created nodes and their IDs
        created_nodes = {}

        # Batch create nodes in the new database
        for record in nodes_result:
            node = record['n']
            labels = ":".join(node.labels)
            props = node._properties

            # Create the node in the new database
            result = new_session.run("CREATE (n:%s) SET n += $props RETURN id(n) as node_id" % labels, props=props)
            node_id = result.single()["node_id"]
            created_nodes[node.id] = node_id

        # Batch create relationships between nodes
        for node_id, new_node_id in created_nodes.items():
            for other_node_id, other_new_node_id in created_nodes.items():
                if node_id != other_node_id:
                    relationships = get_relationships_to_create(node_id, other_node_id, old_session)
                    for rel in relationships:
                        new_session.run("MATCH (start),(end) WHERE ID(start) = $start_id AND ID(end) = $end_id CREATE (start)-[r:%s]->(end)" % rel["rel_type"], start_id=new_node_id, end_id=other_new_node_id)

def get_relationships_to_create(start_id, end_id, old_session):
    relationships = []
    result = old_session.run("MATCH (n)-[r]->(end) WHERE ID(n) = $start_id AND ID(end) = $end_id RETURN type(r) as rel_type", start_id=start_id, end_id=end_id)
    for record in result:
        relationships.append({"start_id": start_id, "end_id": end_id, "rel_type": record["rel_type"]})
    return relationships

if __name__ == "__main__":
    clone_sample_nodes_and_relationships()
    print("CLONED SUCCESSFULLY!!!!")