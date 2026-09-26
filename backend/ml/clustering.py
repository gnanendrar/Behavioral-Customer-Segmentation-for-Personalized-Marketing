import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors
from typing import Optional, List, Dict, Any

from backend.ml.evaluation import ClusterEvaluator

class ClusteringEngine:
    def __init__(self):
        self.results: Dict[str, Any] = {}
        self.best_algorithm: str = ""
        self.best_k: int = 0
        self.labels: np.ndarray = np.array([])
        self.pca_2d: np.ndarray = np.array([])
        self.pca_3d: np.ndarray = np.array([])
        self.evaluator = ClusterEvaluator()
        self.all_configs: List[Dict[str, Any]] = []

    def fit(self, features_df: pd.DataFrame, exclude_cols: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Fit multiple clustering algorithms and select the best one.
        """
        if exclude_cols is None:
            exclude_cols = []
        if 'customer_id' not in exclude_cols:
            exclude_cols.append('customer_id')

        # 1. Select numeric columns and exclude specified
        numeric_df = features_df.select_dtypes(include=[np.number])
        cols_to_use = [c for c in numeric_df.columns if c not in exclude_cols]
        X_df = numeric_df[cols_to_use].copy()

        # 2. Handle NaN/inf
        X_df = X_df.replace([np.inf, -np.inf], np.nan).fillna(0)
        X = X_df.values
        
        if X.shape[0] < 2:
            return {"error": "Not enough samples to cluster"}

        # 3. Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # 4. Run PCA
        pca2 = PCA(n_components=min(2, X_scaled.shape[1]))
        pca_2d_raw = pca2.fit_transform(X_scaled)
        self.pca_2d = np.pad(pca_2d_raw, ((0, 0), (0, max(0, 2 - pca_2d_raw.shape[1]))), 'constant')
        
        pca3 = PCA(n_components=min(3, X_scaled.shape[1]))
        pca_3d_raw = pca3.fit_transform(X_scaled)
        self.pca_3d = np.pad(pca_3d_raw, ((0, 0), (0, max(0, 3 - pca_3d_raw.shape[1]))), 'constant')

        # 5. Run algorithms
        self.results = {}
        self.all_configs = []

        self._run_kmeans(X_scaled)
        if X_scaled.shape[0] <= 3000:
            self._run_agglomerative(X_scaled)
        self._run_dbscan(X_scaled)
        self._run_gmm(X_scaled)

        # 6. Evaluate and rank
        ranked_configs = self.evaluator.rank_configurations(self.all_configs)
        
        # 7. Select best
        if ranked_configs:
            best = ranked_configs[0]
            self.best_algorithm = best['algorithm']
            self.best_k = best.get('k', -1)
            
            # 8. Store best labels
            algo_key = f"{self.best_algorithm}_{self.best_k}" if self.best_k != -1 else self.best_algorithm
            if self.best_algorithm == 'dbscan':
                best_dbscan = max([c for c in self.all_configs if c['algorithm'] == 'dbscan'], key=lambda x: x.get('composite_score', 0), default=None)
                if best_dbscan:
                    algo_key = f"dbscan_eps{best_dbscan.get('eps', 'auto')}_ms{best_dbscan.get('min_samples', 5)}"
                    
            self.labels = self.results.get(algo_key, {}).get('labels', np.zeros(X.shape[0]))
        else:
            self.labels = np.zeros(X.shape[0])

        # 9. Return comprehensive results
        return {
            'best_algorithm': self.best_algorithm,
            'best_k': self.best_k,
            'ranked_configurations': ranked_configs,
            'results_summary': {k: {'n_clusters': len(set(v['labels']) - {-1})} for k, v in self.results.items()}
        }

    def _run_kmeans(self, X: np.ndarray):
        for k in range(2, 11):
            if k >= X.shape[0]:
                continue
            model = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42)
            labels = model.fit_predict(X)
            metrics = self.evaluator.evaluate(X, labels)
            stability = self.evaluator.evaluate_stability(X, 'kmeans', k)
            
            self.results[f'kmeans_{k}'] = {'labels': labels, 'model': model}
            self.all_configs.append({
                'algorithm': 'kmeans',
                'k': k,
                'silhouette': metrics['silhouette_score'],
                'davies_bouldin': metrics['davies_bouldin_score'],
                'calinski_harabasz': metrics['calinski_harabasz_score'],
                'stability': stability
            })

    def _run_agglomerative(self, X: np.ndarray):
        for k in range(2, 11):
            if k >= X.shape[0]:
                continue
            model = AgglomerativeClustering(n_clusters=k, linkage='ward')
            labels = model.fit_predict(X)
            metrics = self.evaluator.evaluate(X, labels)
            stability = self.evaluator.evaluate_stability(X, 'agglomerative', k)
            
            self.results[f'agglomerative_{k}'] = {'labels': labels, 'model': model}
            self.all_configs.append({
                'algorithm': 'agglomerative',
                'k': k,
                'silhouette': metrics['silhouette_score'],
                'davies_bouldin': metrics['davies_bouldin_score'],
                'calinski_harabasz': metrics['calinski_harabasz_score'],
                'stability': stability
            })

    def _run_dbscan(self, X: np.ndarray):
        min_samples_list = [5, 10, 15]
        
        for min_samples in min_samples_list:
            if min_samples > X.shape[0]:
                continue
            nn = NearestNeighbors(n_neighbors=min_samples)
            nn.fit(X)
            distances, _ = nn.kneighbors(X)
            distances = np.sort(distances[:, -1], axis=0)
            
            x_idx = np.arange(len(distances))
            if len(x_idx) < 2:
                continue
            line_vec = np.array([x_idx[-1] - x_idx[0], distances[-1] - distances[0]])
            line_vec_norm = line_vec / (np.linalg.norm(line_vec) + 1e-10)
            
            vecs = np.column_stack((x_idx - x_idx[0], distances - distances[0]))
            dists_from_line = np.abs(vecs[:, 0]*line_vec_norm[1] - vecs[:, 1]*line_vec_norm[0])
            knee_idx = np.argmax(dists_from_line)
            optimal_eps = distances[knee_idx]
            
            if optimal_eps == 0:
                optimal_eps = 0.5
                
            model = DBSCAN(eps=optimal_eps, min_samples=min_samples)
            labels = model.fit_predict(X)
            n_clusters = len(set(labels) - {-1})
            
            if 3 <= n_clusters <= 10:
                metrics = self.evaluator.evaluate(X, labels)
                stability = 0.5 
                
                key = f'dbscan_eps{optimal_eps}_ms{min_samples}'
                self.results[key] = {'labels': labels, 'model': model}
                self.all_configs.append({
                    'algorithm': 'dbscan',
                    'k': n_clusters,
                    'eps': optimal_eps,
                    'min_samples': min_samples,
                    'silhouette': metrics['silhouette_score'],
                    'davies_bouldin': metrics['davies_bouldin_score'],
                    'calinski_harabasz': metrics['calinski_harabasz_score'],
                    'stability': stability
                })

    def _run_gmm(self, X: np.ndarray):
        for k in range(2, 11):
            if k >= X.shape[0]:
                continue
            model = GaussianMixture(n_components=k, covariance_type='diag', random_state=42)
            labels = model.fit_predict(X)
            metrics = self.evaluator.evaluate(X, labels)
            stability = self.evaluator.evaluate_stability(X, 'gmm', k)
            
            self.results[f'gmm_{k}'] = {'labels': labels, 'model': model, 'bic': model.bic(X), 'aic': model.aic(X)}
            self.all_configs.append({
                'algorithm': 'gmm',
                'k': k,
                'silhouette': metrics['silhouette_score'],
                'davies_bouldin': metrics['davies_bouldin_score'],
                'calinski_harabasz': metrics['calinski_harabasz_score'],
                'stability': stability
            })

    def get_labels(self, algorithm: Optional[str] = None, k: Optional[int] = None) -> np.ndarray:
        if algorithm is None:
            return self.labels
        
        if algorithm == 'dbscan':
            for key in self.results:
                if key.startswith('dbscan'):
                    return self.results[key]['labels']
            return self.labels
            
        key = f"{algorithm}_{k}" if k is not None else algorithm
        return self.results.get(key, {}).get('labels', self.labels)

    def get_visualization_data(self) -> Dict[str, Any]:
        return {
            'pca_2d': self.pca_2d.tolist(),
            'pca_3d': self.pca_3d.tolist(),
            'labels': self.labels.tolist()
        }

    def get_algorithm_comparison(self) -> List[Dict[str, Any]]:
        comparison = []
        for config in self.all_configs:
            comparison.append({
                'algorithm': config['algorithm'],
                'k': config.get('k', -1),
                'silhouette': config.get('silhouette', 0.0),
                'davies_bouldin': config.get('davies_bouldin', 0.0),
                'calinski_harabasz': config.get('calinski_harabasz', 0.0),
                'stability': config.get('stability', 0.0)
            })
        return comparison
