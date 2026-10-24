"""
BehaviorIQ — reproducible clustering experiments.

Generates the synthetic customer base with its ground-truth behavioural
archetypes (used for evaluation only), runs the platform's feature-engineering
pipeline, and compares preprocessing variants x clustering algorithms x k.

Internal metrics : silhouette, Davies-Bouldin, Calinski-Harabasz, bootstrap stability (ARI)
External metrics : Adjusted Rand Index (ARI) and NMI against the generating archetypes

Run from the repository root:
    python -m experiments.run_experiments            # 5 seeds, writes experiments/results/
    python -m experiments.run_experiments --quick    # 1 seed
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import (adjusted_rand_score, calinski_harabasz_score,
                             davies_bouldin_score, normalized_mutual_info_score,
                             silhouette_score)
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import QuantileTransformer, StandardScaler

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.ml.data_processor import DataProcessor          # noqa: E402
from backend.ml.feature_engine import FeatureEngine          # noqa: E402
from backend.ml.synthetic_data import generate_synthetic_dataset  # noqa: E402

OUT = ROOT / "experiments" / "results"
K_RANGE = range(2, 11)
N_BOOT = 5


# ─── preprocessing variants ─────────────────────────────────────────────
def build_features(raw: pd.DataFrame, legacy: bool) -> pd.DataFrame:
    dp = DataProcessor()
    mapping = dp.detect_columns(raw.drop(columns=["archetype"]))
    if legacy:  # original repository behaviour: cap + z-score + encode BEFORE feature engineering
        clean = dp.clean_data(raw.drop(columns=["archetype"]), mapping, cap_outliers=True, scale=True, encode=True)
    else:
        clean = dp.clean_data(raw.drop(columns=["archetype"]), mapping)
    feats, _ = FeatureEngine().engineer_features(clean)
    X = feats.drop(columns=["customer_id"]).select_dtypes(include=[np.number])
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    # drop constant columns (e.g. product_diversity is 1 for every customer)
    return X.loc[:, X.std() > 0]


def log_skewed(X: pd.DataFrame, thresh: float = 1.0) -> pd.DataFrame:
    X = X.copy()
    for c in X.columns:
        if X[c].min() >= 0 and abs(X[c].skew()) > thresh:
            X[c] = np.log1p(X[c])
    return X


def variants(raw: pd.DataFrame):
    X_legacy = build_features(raw, legacy=True)
    X_raw = build_features(raw, legacy=False)
    Z_log = StandardScaler().fit_transform(log_skewed(X_raw))
    pca = PCA(n_components=0.95, random_state=42).fit(Z_log)
    return {
        "V0 Legacy (pre-scaled)": StandardScaler().fit_transform(X_legacy),
        "V1 Raw units + z-score": StandardScaler().fit_transform(X_raw),
        "V2 V1 + log1p(skewed)": Z_log,
        "V3 V2 + PCA(95%)": pca.transform(Z_log),
        "V4 Raw units + quantile-normal": QuantileTransformer(
            n_quantiles=min(1000, len(X_raw)), output_distribution="normal", random_state=42).fit_transform(X_raw),
    }, {"n_features": X_raw.shape[1], "pca_components": int(pca.n_components_),
        "feature_names": list(X_raw.columns)}


# ─── clustering ─────────────────────────────────────────────────────────
def fit(algo: str, X: np.ndarray, k: int, seed: int = 42) -> np.ndarray:
    if algo == "K-Means":
        return KMeans(n_clusters=k, n_init=10, random_state=seed).fit_predict(X)
    if algo == "Agglomerative (Ward)":
        return AgglomerativeClustering(n_clusters=k, linkage="ward").fit_predict(X)
    if algo == "GMM (diag)":
        return GaussianMixture(n_components=k, covariance_type="diag", random_state=seed).fit_predict(X)
    raise ValueError(algo)


def stability(algo: str, X: np.ndarray, k: int, full: np.ndarray, rng) -> float:
    n = len(X)
    scores = []
    for _ in range(N_BOOT):
        idx = rng.choice(n, int(0.8 * n), replace=False)
        scores.append(adjusted_rand_score(full[idx], fit(algo, X[idx], k)))
    return float(np.mean(scores))


def dbscan_runs(X: np.ndarray):
    out = []
    for ms in (5, 10, 15):
        d = np.sort(NearestNeighbors(n_neighbors=ms).fit(X).kneighbors(X)[0][:, -1])
        i = np.arange(len(d))
        v = np.array([i[-1], d[-1] - d[0]]); v = v / np.linalg.norm(v)
        eps = d[np.argmax(np.abs(i * v[1] - (d - d[0]) * v[0]))] or 0.5
        out.append((ms, float(eps), DBSCAN(eps=eps, min_samples=ms).fit_predict(X)))
    return out


def internal(X, labels):
    m = labels != -1
    if len(set(labels[m])) < 2:
        return np.nan, np.nan, np.nan
    return (silhouette_score(X[m], labels[m]), davies_bouldin_score(X[m], labels[m]),
            calinski_harabasz_score(X[m], labels[m]))


def composite_rank(df: pd.DataFrame) -> pd.Series:
    """The platform's model-selection rule: mean of min-max normalised sil, 1-DB, CH, stability."""
    def norm(s, hi=True):
        r = (s - s.min()) / (s.max() - s.min()) if s.max() > s.min() else s * 0 + 1
        return r if hi else 1 - r
    return (norm(df.silhouette) + norm(df.davies_bouldin, False) + norm(df.calinski_harabasz) + norm(df.stability)) / 4


# ─── main ───────────────────────────────────────────────────────────────
def run(seeds, n_customers):
    OUT.mkdir(parents=True, exist_ok=True)
    rows, meta = [], {}
    for seed in seeds:
        raw = generate_synthetic_dataset(n_customers=n_customers, seed=seed, include_archetype=True)
        y = raw["archetype"].values
        V, info = variants(raw)
        meta = info
        rng = np.random.default_rng(seed)
        for vname, X in V.items():
            t0 = time.time()
            for algo in ("K-Means", "Agglomerative (Ward)", "GMM (diag)"):
                for k in K_RANGE:
                    lab = fit(algo, X, k)
                    sil, db, ch = internal(X, lab)
                    bic = (GaussianMixture(n_components=k, covariance_type="diag", random_state=42).fit(X).bic(X)
                           if algo == "GMM (diag)" else np.nan)
                    rows.append(dict(seed=seed, variant=vname, algorithm=algo, k=k, silhouette=sil,
                                     davies_bouldin=db, calinski_harabasz=ch,
                                     stability=stability(algo, X, k, lab, rng),
                                     ari=adjusted_rand_score(y, lab), nmi=normalized_mutual_info_score(y, lab),
                                     noise_frac=0.0, bic=bic))
            for ms, eps, lab in dbscan_runs(X):
                k = len(set(lab) - {-1})
                sil, db, ch = internal(X, lab)
                rows.append(dict(seed=seed, variant=vname, algorithm="DBSCAN", k=k, silhouette=sil,
                                 davies_bouldin=db, calinski_harabasz=ch, stability=np.nan,
                                 ari=adjusted_rand_score(y, lab), nmi=normalized_mutual_info_score(y, lab),
                                 noise_frac=float((lab == -1).mean()), min_samples=ms, eps=eps))
            print(f"seed {seed} | {vname:26s} | {time.time() - t0:5.1f}s", flush=True)

    res = pd.DataFrame(rows)
    res.to_csv(OUT / "all_runs.csv", index=False)

    # model selection per (seed, variant): composite rule vs silhouette-only, partitioning algorithms k>=2
    sel = []
    for (seed, vname), g in res[res.algorithm != "DBSCAN"].groupby(["seed", "variant"]):
        g = g.copy()
        g["composite"] = composite_rank(g)
        ge4 = g[g.k >= 4]
        gmm = g[g.algorithm == "GMM (diag)"]
        for rule, idx in (("composite", g.composite.idxmax()), ("silhouette", g.silhouette.idxmax()),
                          ("composite, k>=4", ge4.composite.idxmax()),
                          ("silhouette, k>=4", ge4.silhouette.idxmax()),
                          ("GMM BIC", gmm.bic.idxmin()),
                          ("oracle k=8 best ARI", g[g.k == 8].ari.idxmax())):
            r = g.loc[idx]
            sel.append(dict(seed=seed, variant=vname, rule=rule, algorithm=r.algorithm, k=int(r.k),
                            ari=r.ari, nmi=r.nmi, silhouette=r.silhouette))
    pd.DataFrame(sel).to_csv(OUT / "selection.csv", index=False)
    json.dump({"seeds": list(seeds), "n_customers": n_customers, **meta}, open(OUT / "meta.json", "w"), indent=2)
    print("wrote", OUT)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--n", type=int, default=1500)
    a = ap.parse_args()
    run([42] if a.quick else [42, 7, 123, 2024, 99], a.n)
