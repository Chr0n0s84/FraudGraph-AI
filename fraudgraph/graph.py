
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

        amount = float(row["amount"])
        transaction = {
            "transaction_id": row["transaction_id"],
            "amount": amount,
            "channel": row["channel"],
            "timestamp": row["timestamp"]
        }

        if graph.has_edge(sender, receiver):
            edge = graph[sender][receiver]
            edge["transaction_count"] += 1
            edge["total_amount"] += amount
            edge["amount"] = edge["total_amount"]
            edge["transactions"].append(transaction)
        else:
            graph.add_edge(
                sender,
                receiver,
                transaction_id=row["transaction_id"],
                amount=amount,
                total_amount=amount,
                transaction_count=1,
                channel=row["channel"],
                timestamp=row["timestamp"],
                transactions=[transaction]
            )

    return graph


def get_graph_summary(graph):

    return {
        "total_accounts": graph.number_of_nodes(),
        "total_connections": graph.number_of_edges(),
        "accounts": list(graph.nodes()),
        "connections": list(graph.edges())
    }
