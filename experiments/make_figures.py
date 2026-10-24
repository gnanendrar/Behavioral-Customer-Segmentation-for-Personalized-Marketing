"""
Figures and tables for the paper, built from experiments/results/*.csv plus one
end-to-end platform run (seed 42). Run from the repo root:
    python -m experiments.make_figures
"""
import json
import sys
import time
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
RES = ROOT / "experiments" / "results"
FIG = ROOT / "experiments" / "figures"
FIG.mkdir(parents=True, exist_ok=True)

plt.rcParams.update({"font.family": "serif", "font.size": 8, "axes.titlesize": 8, "axes.labelsize": 8,
                     "legend.fontsize": 7, "xtick.labelsize": 7, "ytick.labelsize": 7,
                     "axes.spines.top": False, "axes.spines.right": False, "savefig.dpi": 300})
COL = 3.45  # IEEE single-column width (in)
ALGO_STYLE = {"K-Means": ("#1f4e79", "o"), "Agglomerative (Ward)": ("#c55a11", "s"), "GMM (diag)": ("#548235", "^")}

runs = pd.read_csv(RES / "all_runs.csv")
sel = pd.read_csv(RES / "selection.csv")
meta = json.load(open(RES / "meta.json"))
part = runs[runs.algorithm != "DBSCAN"]
tables = {}

# ── Fig 2: ARI and silhouette vs k (V2) ─────────────────────────────────
v2 = part[part.variant.str.startswith("V2")]
fig, axes = plt.subplots(2, 1, figsize=(COL, 3.3), sharex=True)
for algo, (c, m) in ALGO_STYLE.items():
    g = v2[v2.algorithm == algo].groupby("k")
    for ax, metric in zip(axes, ("ari", "silhouette")):
        mu, sd = g[metric].mean(), g[metric].std()
        ax.errorbar(mu.index, mu.values, yerr=sd.values, color=c, marker=m, ms=3.5, lw=1, capsize=2, label=algo)
axes[0].axvline(8, color="grey", ls=":", lw=0.8)
axes[0].text(7.9, 0.17, "8 generating\narchetypes", fontsize=6.3, color="grey", ha="right")
axes[0].set_ylabel("ARI vs. ground truth")
axes[1].set_ylabel("Silhouette")
axes[1].set_xlabel("Number of segments k")
axes[0].legend(frameon=False, loc="upper left")
for ax in axes:
    ax.grid(alpha=0.25, lw=0.5)
fig.tight_layout()
fig.savefig(FIG / "fig2_ari_vs_k.png")
plt.close(fig)

# ── Fig 3: preprocessing ablation (best attainable ARI) ─────────────────
best = part.groupby(["seed", "variant", "algorithm"]).ari.max().reset_index()
agg = best.groupby(["variant", "algorithm"]).ari.agg(["mean", "std"]).reset_index()
variants = sorted(agg.variant.unique())
short = {v: v.split(" ", 1)[0] for v in variants}
fig, ax = plt.subplots(figsize=(COL, 1.9))
w = 0.26
for i, (algo, (c, _)) in enumerate(ALGO_STYLE.items()):
    a = agg[agg.algorithm == algo].set_index("variant").loc[variants]
    ax.bar(np.arange(len(variants)) + (i - 1) * w, a["mean"], w, yerr=a["std"], color=c, capsize=1.5,
           label=algo, error_kw={"lw": 0.6})
ax.set_xticks(np.arange(len(variants)))
ax.set_xticklabels([short[v] for v in variants])
ax.set_ylabel("Best ARI over k")
ax.set_ylim(0, 0.8)
ax.legend(["K-Means", "Ward", "GMM"], frameon=False, ncol=3, loc="upper center", bbox_to_anchor=(0.5, 1.16), fontsize=6.5)
ax.grid(axis="y", alpha=0.25, lw=0.5)
fig.tight_layout()
fig.savefig(FIG / "fig3_preprocessing.png")
plt.close(fig)

# ── Tables from experiments ─────────────────────────────────────────────
t_sel = (sel.groupby(["variant", "rule"])
         .agg(k_mean=("k", "mean"), k_min=("k", "min"), k_max=("k", "max"), ari=("ari", "mean"),
              ari_sd=("ari", "std"), nmi=("nmi", "mean")).round(3).reset_index())
t_sel.to_csv(RES / "table_selection.csv", index=False)

t_k8 = (part[part.k == 8].groupby(["variant", "algorithm"])
        .agg(ari=("ari", "mean"), ari_sd=("ari", "std"), nmi=("nmi", "mean"), sil=("silhouette", "mean"),
             db=("davies_bouldin", "mean"), stab=("stability", "mean")).round(3).reset_index())
t_k8.to_csv(RES / "table_k8.csv", index=False)

t_db = (runs[runs.algorithm == "DBSCAN"].groupby("variant")
        .agg(k=("k", "mean"), ari=("ari", "mean"), noise=("noise_frac", "mean")).round(3).reset_index())
t_db.to_csv(RES / "table_dbscan.csv", index=False)

# ── End-to-end platform run (seed 42) ───────────────────────────────────
from backend.ml.synthetic_data import generate_synthetic_dataset  # noqa: E402
from backend.ml.data_processor import DataProcessor  # noqa: E402
from backend.ml.feature_engine import FeatureEngine  # noqa: E402
from backend.ml.scoring import ScoringEngine  # noqa: E402
from backend.ml.clustering import ClusteringEngine  # noqa: E402
from backend.ml.segment_profiler import SegmentProfiler  # noqa: E402
from backend.services.marketing_engine import MarketingEngine  # noqa: E402
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score  # noqa: E402


def platform_run(n, seed=42):
    raw = generate_synthetic_dataset(n_customers=n, seed=seed, include_archetype=True)
    y = raw.pop("archetype")
    t = {}
    t0 = time.perf_counter()
    dp = DataProcessor()
    clean = dp.clean_data(raw, dp.detect_columns(raw)); t["clean"] = time.perf_counter() - t0
    t1 = time.perf_counter(); feats, _ = FeatureEngine().engineer_features(clean); t["features"] = time.perf_counter() - t1
    t1 = time.perf_counter(); scores = ScoringEngine().calculate_scores(feats); t["scoring"] = time.perf_counter() - t1
    t1 = time.perf_counter(); ce = ClusteringEngine(); res = ce.fit(feats); t["clustering"] = time.perf_counter() - t1
    t1 = time.perf_counter(); prof = SegmentProfiler().profile_segments(feats, scores, ce.labels); t["profiling"] = time.perf_counter() - t1
    t1 = time.perf_counter(); acts = MarketingEngine().generate_actions(prof); t["actions"] = time.perf_counter() - t1
    t["total"] = time.perf_counter() - t0
    return raw, y, feats, scores, ce, res, prof, acts, t


raw, y, feats, scores, ce, res, prof, acts, timing = platform_run(1500)
labels = ce.labels
e2e = {"algorithm": res["algorithm"], "k": int(res["k"]), "silhouette": float(res["silhouette_score"]),
       "davies_bouldin": float(res["davies_bouldin_score"]), "calinski_harabasz": float(res["calinski_harabasz_score"]),
       "stability": float(res["stability"]), "ari": float(adjusted_rand_score(y, labels)),
       "nmi": float(normalized_mutual_info_score(y, labels)), "n_features": int(res["feature_count"]),
       "timing_s": {k: round(v, 3) for k, v in timing.items()},
       "configs_evaluated": len(res["ranked_configurations"])}

# Scalability (agglomerative is skipped above 3,000 rows by the engine)
scal = []
for n in (1500, 5000, 10000):
    *_, tt = platform_run(n, seed=7)
    scal.append({"n_customers": n, **{k: round(v, 2) for k, v in tt.items()}})
e2e["scalability"] = scal

# Segment table
act_by = {a["segment_id"]: a for a in acts}
rows = []
for p in sorted(prof, key=lambda p: -p["revenue_contribution"]):
    a = act_by.get(p["segment_id"], {})
    rows.append({"segment": p["segment_name"], "customers": p["customer_count"], "share_pct": round(p["percentage"], 1),
                 "revenue_share_pct": round(p["revenue_contribution"], 1), "value": round(p["avg_value_score"]),
                 "engagement": round(p["avg_engagement_score"]), "loyalty": round(p["avg_loyalty_score"]),
                 "churn_risk": round(p["avg_churn_risk"]), "discount_sens": round(p["avg_discount_sensitivity"]),
                 "strategy": a.get("strategy", ""), "channels": ", ".join(a.get("channel", [])) if isinstance(a.get("channel"), list) else a.get("channel", ""),
                 "offer": a.get("offer", ""), "frequency": a.get("frequency", "")})
seg_tab = pd.DataFrame(rows)
seg_tab.to_csv(RES / "table_segments.csv", index=False)
json.dump(e2e, open(RES / "platform_run.json", "w"), indent=2)

# ── Fig 4: segment behaviour heatmap + archetype contingency ────────────
order = [p["segment_id"] for p in sorted(prof, key=lambda p: -p["revenue_contribution"])]
names = {p["segment_id"]: p["segment_name"] for p in prof}
cols = [("avg_value_score", "Value"), ("avg_engagement_score", "Engage."), ("avg_loyalty_score", "Loyalty"),
        ("avg_churn_risk", "Churn risk"), ("avg_discount_sensitivity", "Discount")]
M = np.array([[next(p for p in prof if p["segment_id"] == s)[c] for c, _ in cols] for s in order])
M_disp = M.copy(); M_disp[:, 3] = 100 - M_disp[:, 3]  # colour churn so that green = good
ct = pd.crosstab(pd.Series(labels, name="seg"), y.reset_index(drop=True)).reindex(order)
ct = ct.div(ct.sum(axis=1), axis=0)

fig, axes = plt.subplots(1, 2, figsize=(7.16, 2.9), gridspec_kw={"width_ratios": [1, 1.45]})
im = axes[0].imshow(M_disp, cmap="RdYlGn", vmin=0, vmax=100, aspect="auto")
axes[0].set_xticks(range(len(cols))); axes[0].set_xticklabels([n for _, n in cols], rotation=30, ha="right")
ylab = [names[s].replace("Customers ", "").replace(" Shoppers", "").replace("Occasional", "Occas.") for s in order]
axes[0].set_yticks(range(len(order))); axes[0].set_yticklabels(ylab)
for i in range(M.shape[0]):
    for j in range(M.shape[1]):
        axes[0].text(j, i, f"{M[i, j]:.0f}", ha="center", va="center", fontsize=6)
axes[0].set_title("(a) Mean scores (0-100; green = favourable)", fontsize=7.5)
im2 = axes[1].imshow(ct.values, cmap="Blues", vmin=0, vmax=1, aspect="auto")
axes[1].set_xticks(range(ct.shape[1])); axes[1].set_xticklabels(ct.columns, rotation=35, ha="right")
axes[1].set_yticks(range(len(order))); axes[1].set_yticklabels([])
for i in range(ct.shape[0]):
    for j in range(ct.shape[1]):
        v = ct.values[i, j]
        if v >= 0.05:
            axes[1].text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=6, color="white" if v > 0.6 else "black")
axes[1].set_title("(b) Composition of each segment by true archetype", fontsize=7.5)
fig.tight_layout()
fig.savefig(FIG / "fig4_segments.png")
plt.close(fig)

# ── Fig 1: architecture ─────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(7.16, 1.75))
ax.set_xlim(0, 100); ax.set_ylim(0, 24); ax.axis("off")
stages = [("Ingestion &\nquality audit", "CSV/Excel upload,\ncolumn detection,\nmissing values"),
          ("Feature\nengineering", "31 behavioural\nfeatures: RFM,\nengagement,\nchurn signals"),
          ("Behaviour\nscoring", "7 percentile\nscores + PCA\ncomposite"),
          ("Segmentation\n& selection", "log1p + z-score;\nK-Means, Ward,\nGMM, DBSCAN;\nk in [4, 10]"),
          ("Profiling &\nexplanation", "auto-naming,\nfeature\nimportance,\nmicro-segments"),
          ("Action layer", "strategy, channel,\noffer, rescue\nqueue, campaign\ncopy")]
w, gap = 14.2, 2.6
for i, (t, d) in enumerate(stages):
    x = 1 + i * (w + gap)
    ax.add_patch(plt.Rectangle((x, 9), w, 13, fc="#dbe7f3" if i % 2 == 0 else "#e8f0e0", ec="#333", lw=0.7))
    ax.text(x + w / 2, 18.6, t, ha="center", va="center", fontsize=7, weight="bold")
    ax.text(x + w / 2, 12.6, d, ha="center", va="center", fontsize=5.0)
    if i < len(stages) - 1:
        ax.annotate("", xy=(x + w + gap - 0.2, 15.5), xytext=(x + w + 0.2, 15.5),
                    arrowprops=dict(arrowstyle="->", lw=0.8))
ax.add_patch(plt.Rectangle((1, 1), 98, 6, fc="#f4f4f4", ec="#999", lw=0.6, ls="--"))
ax.text(50, 4, "FastAPI service (9 routers)  |  React + TypeScript dashboard (18 views)  |  optional LLM copilot with rule-based fallback",
        ha="center", va="center", fontsize=6.3)
fig.savefig(FIG / "fig1_architecture.png", bbox_inches="tight")
plt.close(fig)

print(json.dumps(e2e, indent=1))
print(seg_tab.to_string())
