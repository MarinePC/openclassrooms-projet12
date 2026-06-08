"""
export_model.py
---------------
Script d'export du modèle ML ZenAssist.

Ce script :
1. Charge et prépare le dataset
2. Entraîne un Pipeline TF-IDF + Logistic Regression
3. Évalue le modèle sur le jeu de test
4. Sauvegarde le pipeline et le LabelEncoder en .pkl
5. Génère un fichier metrics.json avec les performances

Usage :
    python export_model.py

Fichiers générés :
    model.pkl         — pipeline complet (TF-IDF + LR)
    label_encoder.pkl — encodeur des classes (chiffres → noms)
    metrics.json      — métriques et métadonnées du modèle
"""

import json
import pickle
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

# ──────────────────────────────────────────────
# 0. Configuration
# ─────────────────────────────F─────────────────

DATA_PATH    = Path(__file__).parent.parent / "data" / "dataset.csv"
OUTPUT_DIR   = Path(__file__).parent

MODEL_PATH   = OUTPUT_DIR / "model.pkl"
ENCODER_PATH = OUTPUT_DIR / "label_encoder.pkl"
METRICS_PATH = OUTPUT_DIR / "metrics.json"

RANDOM_STATE = 42
TEST_SIZE    = 0.2
TEXT_COLUMN  = "Consumer Claim"
LABEL_COLUMN = "Tag"


# ──────────────────────────────────────────────
# 1. Chargement et préparation des données
# ──────────────────────────────────────────────

print("=" * 55)
print("  ZenAssist — Export du modèle ML")
print("=" * 55)

print(f"\n[1/5] Chargement du dataset : {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"      {df.shape[0]:,} lignes, {df.shape[1]} colonnes chargées")

df = df[[TEXT_COLUMN, LABEL_COLUMN]].dropna(subset=[TEXT_COLUMN])

# Fusion des anciennes classes vers les classes actuelles (identique au notebook)
fusion_map = {
    "Credit reporting"  : "Credit reporting, credit repair services, or other personal consumer reports",
    "Payday loan"       : "Payday loan, title loan, or personal loan",
    "Money transfers"   : "Money transfer, virtual currency, or money service",
    "Prepaid card"      : "Credit card or prepaid card",
    "Virtual currency"  : "Money transfer, virtual currency, or money service",
}
df[LABEL_COLUMN] = df[LABEL_COLUMN].replace(fusion_map)
print(f"      {df[LABEL_COLUMN].nunique()} classes après fusion")


# Fusion des anciennes classes vers les classes actuelles (identique au notebook)
fusion_map = {
    "Credit reporting"  : "Credit reporting, credit repair services, or other personal consumer reports",
    "Payday loan"       : "Payday loan, title loan, or personal loan",
    "Money transfers"   : "Money transfer, virtual currency, or money service",
    "Prepaid card"      : "Credit card or prepaid card",
    "Virtual currency"  : "Money transfer, virtual currency, or money service",
}
df[LABEL_COLUMN] = df[LABEL_COLUMN].replace(fusion_map)
print(f"      {df[LABEL_COLUMN].nunique()} classes après fusion")
print(f"      {len(df):,} lignes après suppression des valeurs manquantes")


# ──────────────────────────────────────────────
# 2. Split train / test
# ──────────────────────────────────────────────

X = df[TEXT_COLUMN]
y = df[LABEL_COLUMN]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y
)

print(f"\n[2/5] Split train/test ({int((1-TEST_SIZE)*100)}/{int(TEST_SIZE*100)})")
print(f"      Train : {len(X_train):,} exemples")
print(f"      Test  : {len(X_test):,} exemples")


# ──────────────────────────────────────────────
# 3. Encodage des labels — AVANT d'entraîner le Pipeline
# ──────────────────────────────────────────────

# Identique au notebook : on encode les labels en entiers (0-12)
# avant de passer à la LR, ce qui reproduit exactement les mêmes
# conditions d'entraînement et donc les mêmes métriques.
le = LabelEncoder()
y_train_enc = le.fit_transform(y_train)
y_test_enc  = le.transform(y_test)

print(f"\n      {len(le.classes_)} classes encodées :")
for i, cls in enumerate(le.classes_):
    print(f"        {i:2d} → {cls}")


# ──────────────────────────────────────────────
# 4. Entraînement du Pipeline sur y_train_enc
# ──────────────────────────────────────────────

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=5,
        strip_accents="unicode",
        analyzer="word"
    )),
    ("clf", LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=RANDOM_STATE
    ))
])

print(f"\n[3/5] Entraînement du Pipeline (TF-IDF + Logistic Regression)...")
t_start = time.time()
pipeline.fit(X_train, y_train_enc)  # labels encodés comme dans le notebook
train_duration = time.time() - t_start
print(f"      Entraînement terminé en {train_duration:.1f}s")


# ──────────────────────────────────────────────
# 5. Évaluation
# ──────────────────────────────────────────────

print(f"\n[4/5] Évaluation sur le jeu de test...")
t_start    = time.time()
y_pred     = pipeline.predict(X_test)
infer_time = (time.time() - t_start) / len(X_test) * 1000

f1       = f1_score(y_test_enc, y_pred, average="macro")
accuracy = accuracy_score(y_test_enc, y_pred)

print(f"      F1 macro  : {f1:.4f}  ({f1*100:.2f}%)")
print(f"      Accuracy  : {accuracy:.4f}  ({accuracy*100:.2f}%)")
print(f"      Latence   : {infer_time:.4f} ms/réclamation")


# ──────────────────────────────────────────────
# 6. Sauvegarde des fichiers
# ──────────────────────────────────────────────

print(f"\n[5/5] Sauvegarde des fichiers...")

with open(MODEL_PATH, "wb") as f:
    pickle.dump(pipeline, f)
print(f"      ✅ {MODEL_PATH.name} ({MODEL_PATH.stat().st_size / 1024 / 1024:.1f} Mo)")

with open(ENCODER_PATH, "wb") as f:
    pickle.dump(le, f)
print(f"      ✅ {ENCODER_PATH.name} ({ENCODER_PATH.stat().st_size / 1024:.0f} Ko)")

metrics = {
    "model"           : "TF-IDF + Logistic Regression",
    "trained_at"      : datetime.now().isoformat(),
    "dataset_rows"    : len(df),
    "train_size"      : len(X_train),
    "test_size"       : len(X_test),
    "f1_macro"        : round(f1, 4),
    "accuracy"        : round(accuracy, 4),
    "latency_ms"      : round(infer_time, 4),
    "train_duration_s": round(train_duration, 1),
    "num_classes"     : len(le.classes_),
    "classes"         : list(le.classes_)
}
with open(METRICS_PATH, "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2, ensure_ascii=False)
print(f"      ✅ {METRICS_PATH.name}")

print(f"\n{'=' * 55}")
print(f"  Export terminé avec succès !")
print(f"  F1 macro : {f1*100:.2f}% | Accuracy : {accuracy*100:.2f}%")
print(f"{'=' * 55}\n")
