import numpy as np
import pandas as pd
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
    adjusted_rand_score,
)
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from collections import Counter


class ClusterEvaluator:
    def evaluate(self, X: np.ndarray, labels: np.ndarray) -> dict:
        """
        Calculate cluster evaluation metrics.
        """
        unique_labels = np.unique(labels)
        n_clusters = len(set(labels) - {-1})
        cluster_sizes = dict(Counter(labels))

        if n_clusters < 2 or len(unique_labels) == 1 or n_clusters >= len(X):
            return {
                "silhouette_score": -1.0,
                "davies_bouldin_score": float('inf'),
                "calinski_harabasz_score": 0.0,
                "n_clusters": n_clusters,
                "cluster_sizes": cluster_sizes,
            }

        non_noise_mask = labels != -1
        if sum(non_noise_mask) < 2 or len(np.unique(labels[non_noise_mask])) < 2:
            return {
                "silhouette_score": -1.0,
                "davies_bouldin_score": float('inf'),
                "calinski_harabasz_score": 0.0,
                "n_clusters": n_clusters,
                "cluster_sizes": cluster_sizes,
            }
        
        X_eval = X[non_noise_mask]
        labels_eval = labels[non_noise_mask]

        return {
            "silhouette_score": silhouette_score(X_eval, labels_eval, sample_size=min(2000, len(X_eval))),
            "davies_bouldin_score": davies_bouldin_score(X_eval, labels_eval),
            "calinski_harabasz_score": calinski_harabasz_score(X_eval, labels_eval),
            "n_clusters": n_clusters,
            "cluster_sizes": cluster_sizes,
        }

    def evaluate_stability(self, X: np.ndarray, algorithm: str, k: int, n_iterations: int = 2) -> float:
        """
        Calculate bootstrap stability of a clustering algorithm.
        """
        if k < 2:
            return 0.0
            
        n_samples = X.shape[0]
        sample_size = int(0.8 * n_samples)
        ari_scores = []

        # Get full data labels
        full_labels = self._run_clustering(X, algorithm, k)
        if len(np.unique(full_labels)) < 2:
            return 0.0

        for _ in range(n_iterations):
            indices = np.random.choice(n_samples, sample_size, replace=False)
            X_sample = X[indices]
            
            sample_labels = self._run_clustering(X_sample, algorithm, k)
            
            # Predict full labels on the sample
            full_labels_on_sample = full_labels[indices]
            
            ari = adjusted_rand_score(full_labels_on_sample, sample_labels)
            ari_scores.append(ari)

        return float(np.mean(ari_scores))

    def _run_clustering(self, X: np.ndarray, algorithm: str, k: int) -> np.ndarray:
        if algorithm == 'kmeans':
            model = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42)
            return model.fit_predict(X)
        elif algorithm == 'agglomerative':
            model = AgglomerativeClustering(n_clusters=k, linkage='ward')
            return model.fit_predict(X)
        elif algorithm == 'gmm':
            model = GaussianMixture(n_components=k, covariance_type='full', random_state=42)
            return model.fit_predict(X)
        return np.zeros(X.shape[0])

    def find_optimal_k(self, X: np.ndarray, algorithm: str, k_range: range) -> dict:
        """
        Evaluate multiple k values to find the optimal one.
        """
        all_metrics = []
        elbow_data = []
        silhouette_data = []

        for k in k_range:
            labels = self._run_clustering(X, algorithm, k)
            metrics = self.evaluate(X, labels)
            stability = self.evaluate_stability(X, algorithm, k)
            
            # For elbow, we would typically use inertia for kmeans, but we'll use a placeholder or derived metric
            if algorithm == 'kmeans':
                model = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42).fit(X)
                elbow_data.append({'k': k, 'value': model.inertia_})
            
            silhouette_data.append({'k': k, 'value': metrics['silhouette_score']})
            all_metrics.append({
                'k': k,
                'algorithm': algorithm,
                'silhouette': metrics['silhouette_score'],
                'davies_bouldin': metrics['davies_bouldin_score'],
                'calinski_harabasz': metrics['calinski_harabasz_score'],
                'stability': stability
            })

        optimal_k = max(all_metrics, key=lambda x: x['silhouette'])['k'] if all_metrics else k_range[0]

        return {
            'optimal_k': optimal_k,
            'elbow_data': elbow_data,
            'silhouette_data': silhouette_data,
            'all_metrics': all_metrics
        }

    def rank_configurations(self, all_results: list[dict]) -> list[dict]:
        """
        Rank all algorithm+k configurations by composite score.
        """
        if not all_results:
            return []

        df = pd.DataFrame(all_results)
        
        # Normalize metrics to 0-1
        def normalize(series, higher_is_better=True):
            if series.max() == series.min():
                return pd.Series(np.ones(len(series)))
            val = (series - series.min()) / (series.max() - series.min())
            if not higher_is_better:
                val = 1 - val
            return val

        # Handle potential inf values in davies_bouldin
        if 'davies_bouldin' in df.columns:
            df['davies_bouldin'] = df['davies_bouldin'].replace([np.inf, -np.inf], np.nan)
            max_db = df['davies_bouldin'].max()
            df['davies_bouldin'] = df['davies_bouldin'].fillna(max_db if pd.notna(max_db) else 10)

        if 'silhouette' in df.columns:
            df['norm_sil'] = normalize(df['silhouette'], True)
        if 'davies_bouldin' in df.columns:
            df['norm_db'] = normalize(df['davies_bouldin'], False)
        if 'calinski_harabasz' in df.columns:
            df['norm_ch'] = normalize(df['calinski_harabasz'], True)
        if 'stability' in df.columns:
            df['norm_stab'] = normalize(df['stability'], True)

        cols_to_mean = [c for c in ['norm_sil', 'norm_db', 'norm_ch', 'norm_stab'] if c in df.columns]
        if cols_to_mean:
            df['composite_score'] = df[cols_to_mean].mean(axis=1)
        else:
            df['composite_score'] = 0.0
            
        df = df.sort_values('composite_score', ascending=False).reset_index(drop=True)
        df['rank'] = df.index + 1

        drop_cols = [c for c in ['norm_sil', 'norm_db', 'norm_ch', 'norm_stab'] if c in df.columns]
        result = df.drop(columns=drop_cols).to_dict('records')
        return result
