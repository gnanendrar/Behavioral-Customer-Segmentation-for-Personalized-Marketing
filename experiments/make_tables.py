"""Write LaTeX tables for the paper straight from experiments/results/*.csv."""
import json
from pathlib import Path

import pandas as pd

RES = Path(__file__).resolve().parent / "results"
OUT = Path(__file__).resolve().parent / "tables"
OUT.mkdir(exist_ok=True)

VSHORT = {"V0 Legacy (pre-scaled)": "V0", "V1 Raw units + z-score": "V1", "V2 V1 + log1p(skewed)": "V2",
          "V3 V2 + PCA(95%)": "V3", "V4 Raw units + quantile-normal": "V4"}

# Table: model-selection rules
sel = pd.read_csv(RES / "table_selection.csv")
rules = [("silhouette", "Silhouette, $k\\in[2,10]$"), ("composite", "Composite, $k\\in[2,10]$"),
         ("silhouette, k>=4", "Silhouette, $k\\in[4,10]$"), ("composite, k>=4", "Composite, $k\\in[4,10]$"),
         ("GMM BIC", "GMM--BIC$^\\dagger$")]
lines = []
for rule, label in rules:
    cells = []
    for v in ["V0 Legacy (pre-scaled)", "V1 Raw units + z-score", "V2 V1 + log1p(skewed)", "V3 V2 + PCA(95%)"]:
        r = sel[(sel.variant == v) & (sel.rule == rule)].iloc[0]
        cells.append(f"{r.ari:.2f} ({r.k_mean:.1f})")
    lines.append(label + " & " + " & ".join(cells) + r" \\")
(OUT / "selection_rows.tex").write_text("\n".join(lines) + "\n")

# Table: k = 8 comparison for V1/V2
k8 = pd.read_csv(RES / "table_k8.csv")
lines = []
for v in ["V1 Raw units + z-score", "V2 V1 + log1p(skewed)"]:
    for algo, short in [("K-Means", "K-Means"), ("Agglomerative (Ward)", "Ward"), ("GMM (diag)", "GMM")]:
        r = k8[(k8.variant == v) & (k8.algorithm == algo)].iloc[0]
        lines.append(f"{VSHORT[v]} & {short} & {r.ari:.3f}$\\pm${r.ari_sd:.3f} & {r.nmi:.3f} & {r.sil:.3f} & {r.db:.2f} & {r.stab:.2f} \\\\")
db = pd.read_csv(RES / "table_dbscan.csv")
r = db[db.variant == "V2 V1 + log1p(skewed)"].iloc[0]
lines.append(f"V2 & DBSCAN$^\\ast$ & {r.ari:.3f} & -- & -- & -- & -- \\\\")
(OUT / "k8_rows.tex").write_text("\n".join(lines) + "\n")

# Table: segments from the platform run
seg = pd.read_csv(RES / "table_segments.csv")
lines = []
for _, r in seg.iterrows():
    name = (r.segment.replace(" Customers", "").replace("Occasional Shoppers", "Occas.").replace("Discount Use", "Disc.")
            .replace("Value Tier", "tier").replace("&", "\\&"))
    strat = str(r.strategy).replace("_", " ")
    lines.append(f"{name} & {r.share_pct:.1f} & {r.revenue_share_pct:.1f} & {r.value} & {r.engagement} & {r.churn_risk} & {strat} \\\\")
(OUT / "segment_rows.tex").write_text("\n".join(lines) + "\n")

json.dump(json.load(open(RES / "platform_run.json")), open(OUT / "platform_run.json", "w"), indent=1)
print((OUT / "selection_rows.tex").read_text()); print((OUT / "k8_rows.tex").read_text()); print((OUT / "segment_rows.tex").read_text())
