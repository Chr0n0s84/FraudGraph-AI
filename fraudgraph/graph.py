
import networkx as nx


def build_transaction_graph(transactions):
    """
    Build a directed graph of financial transactions.
    """

    graph = nx.DiGraph()

    for _, row in transactions.iterrows():

        sender = row["sender_id"]
        receiver = row["receiver_id"]

        graph.add_node(sender, account_id=sender)
        graph.add_node(receiver, account_id=receiver)

        graph.add_edge(
            sender,
            receiver,
            transaction_id=row["transaction_id"],
            amount=float(row["amount"]),
            channel=row["channel"],
            timestamp=row["timestamp"]
        )

    return graph


def get_graph_summary(graph):

    return {
        "total_accounts": graph.number_of_nodes(),
        "total_connections": graph.number_of_edges(),
        "accounts": list(graph.nodes()),
        "connections": list(graph.edges())
    }
