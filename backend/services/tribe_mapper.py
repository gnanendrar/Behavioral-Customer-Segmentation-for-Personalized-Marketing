import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import random
from typing import Dict, Any

class TribeMapper:
    """Behavioral Tribe Network generator."""
    
    def __init__(self):
        pass
        
    def build_network(self, features_df: pd.DataFrame, scores_df: pd.DataFrame, labels: np.ndarray, max_nodes: int = 500) -> Dict[str, Any]:
        """
        Builds a network graph of behaviorally similar customers.
        """
        if len(features_df) == 0:
            return {"nodes": [], "edges": [], "stats": {}}
            
        # Combine data to allow sampling by cluster
        df = features_df.copy()
        df['cluster_label'] = labels
        # Add scores
        for col in scores_df.columns:
            df[col] = scores_df[col]
            
        if 'customer_id' not in df.columns:
            if df.index.name == 'customer_id':
                df = df.reset_index()
            else:
                df['customer_id'] = [f"CUST_{i}" for i in range(len(df))]
        
        # 1. Sample if needed
        if len(df) > max_nodes:
            # Stratified sampling
            sampled_dfs = []
            for label, group in df.groupby('cluster_label'):
                frac = len(group) / len(df)
                n_samples = max(1, int(max_nodes * frac))
                sampled_dfs.append(group.sample(n=min(len(group), n_samples), random_state=42))
            df_sampled = pd.concat(sampled_dfs)
            # Just in case we exceed due to rounding, sample down strictly
            if len(df_sampled) > max_nodes:
                df_sampled = df_sampled.sample(n=max_nodes, random_state=42)
        else:
            df_sampled = df.copy()
            
        df_sampled = df_sampled.reset_index(drop=True)
        
        # 2. Key behavioral features
        key_features = [
            'engagement_score', 'value_score', 'loyalty_score', 
            'churn_risk_score', 'discount_sensitivity_score', 
            'purchase_frequency', 'avg_order_value', 'recency_days'
        ]
        
        # Filter available features
        available_features = [f for f in key_features if f in df_sampled.columns]
        if not available_features:
            # Fallback to numeric columns
            available_features = df_sampled.select_dtypes(include=[np.number]).columns.tolist()
            available_features = [c for c in available_features if c not in ['customer_id', 'cluster_label']]
            
        features_to_scale = df_sampled[available_features].fillna(0)
        
        # 3. Scale features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features_to_scale)
        
        # 4. Compute similarity
        sim_matrix = cosine_similarity(scaled_features)
        
        # 5 & 6. Edges
        nodes = []
        edges = []
        
        # For stats
        within_cluster = 0
        between_cluster = 0
        connection_counts = {i: 0 for i in range(len(df_sampled))}
        
        for i in range(len(df_sampled)):
            cust_i = df_sampled.iloc[i]
            val_score = cust_i.get('value_score', 50)
            eng_score = cust_i.get('engagement_score', 50)
            
            node = {
                "id": str(i),
                "customer_id": str(cust_i['customer_id']),
                "segment_id": int(cust_i['cluster_label']),
                "segment_name": f"Segment {cust_i['cluster_label']}",
                "value_score": float(val_score),
                "engagement_score": float(eng_score),
                "x": random.uniform(0, 100),
                "y": random.uniform(0, 100),
                "size": max(10.0, float(val_score) / 2.0)
            }
            nodes.append(node)
            
            # Find connections
            sim_scores = list(enumerate(sim_matrix[i]))
            # Sort descending, skip self (index i)
            sim_scores.sort(key=lambda x: x[1], reverse=True)
            
            top_edges = 0
            for j, score in sim_scores:
                if i == j:
                    continue
                if score > 0.7:
                    if top_edges < 5:
                        edges.append({
                            "source": str(i),
                            "target": str(j),
                            "similarity": float(score)
                        })
                        top_edges += 1
                        connection_counts[i] += 1
                        connection_counts[j] += 1
                        
                        if cust_i['cluster_label'] == df_sampled.iloc[j]['cluster_label']:
                            within_cluster += 1
                        else:
                            between_cluster += 1
                    else:
                        break
        
        # Calculate stats
        total_nodes = len(nodes)
        total_edges = len(edges)
        avg_connections = total_edges / total_nodes if total_nodes > 0 else 0
        
        most_connected_idx = max(connection_counts.items(), key=lambda x: x[1])[0] if connection_counts else 0
        most_connected_customer = str(df_sampled.iloc[most_connected_idx]['customer_id']) if total_nodes > 0 else ""
        
        sep_score = (within_cluster / between_cluster) if between_cluster > 0 else (float(within_cluster) if within_cluster > 0 else 0.0)
        
        stats = {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "avg_connections": float(avg_connections),
            "most_connected_customer": most_connected_customer,
            "cluster_separation_score": float(sep_score)
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats
        }
