import networkx as nx
from typing import List, Dict, Any
from datetime import datetime

# Constants for scoring
SCORE_DIVERSITY = 50
SCORE_INTEREST = 10
SCORE_SAME_SECTION = -20
SCORE_HISTORY = -1000

def calculate_compatibility_score(user1: Dict[str, Any], user2: Dict[str, Any], history: List[tuple]) -> float:
    score = 0.0
    
    # Diversity: Different Program
    if user1['program'] != user2['program']:
        score += SCORE_DIVERSITY
        
    # Interests: Shared tags
    interests1 = set(user1.get('interests', []))
    interests2 = set(user2.get('interests', []))
    shared_interests = interests1.intersection(interests2)
    score += len(shared_interests) * SCORE_INTEREST
    
    # Section: Avoid same section
    if user1['section'] == user2['section']:
        score += SCORE_SAME_SECTION
        
    # History: Avoid previous matches
    # Assuming history is a list of tuples (user_id_a, user_id_b)
    pair = tuple(sorted((user1['id'], user2['id'])))
    if pair in history:
        score += SCORE_HISTORY
        
    return score

def run_matching_algorithm(users: List[Dict[str, Any]], history: List[tuple]) -> List[tuple]:
    """
    Runs Maximum Weight Matching on the given users.
    Returns a list of matched pairs (user1, user2, score).
    """
    G = nx.Graph()
    
    # Add nodes
    for user in users:
        G.add_node(user['id'], **user)
    
    # Add edges with weights
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            u1 = users[i]
            u2 = users[j]
            score = calculate_compatibility_score(u1, u2, history)
            
            # Only add edge if score is positive (or set a threshold)
            # For this MVP, we'll add all edges but let the algorithm pick the best
            # Ideally we might want a minimum threshold to avoid bad matches
            G.add_edge(u1['id'], u2['id'], weight=score)
            
    # Max Weight Matching
    matching = nx.max_weight_matching(G, maxcardinality=True)
    
    results = []
    for u1_id, u2_id in matching:
        # Find user objects
        u1 = next(u for u in users if u['id'] == u1_id)
        u2 = next(u for u in users if u['id'] == u2_id)
        
        # Recalculate score for reporting
        score = calculate_compatibility_score(u1, u2, history)
        results.append((u1, u2, score))
        
    return results
