"""
api.py
------
API FastAPI ZenAssist — classification ML des réclamations.

Cette API expose une route POST /tags qui prédit le tag
d'une réclamation client à partir du modèle ML entraîné.

Usage :
    uvicorn api:app --reload --port 8000

Documentation interactive :
    http://localhost:8000/docs
"""

import pickle
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ──────────────────────────────────────────────
# 1. Chargement du modèle au démarrage du serveur
# ──────────────────────────────────────────────

# On charge les fichiers pickle une seule fois au démarrage,
# pas à chaque requête — sinon l'API serait très lente.
MODEL_DIR    = Path(__file__).parent
MODEL_PATH   = MODEL_DIR / "model.pkl"
ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Fichier introuvable : {MODEL_PATH}\n"
        "Lance d'abord : python export_model.py"
    )

with open(MODEL_PATH, "rb") as f:
    pipeline = pickle.load(f)

with open(ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)

print(f"✅ Modèle chargé ({len(label_encoder.classes_)} classes)")


# ──────────────────────────────────────────────
# 2. Initialisation de l'application FastAPI
# ──────────────────────────────────────────────

app = FastAPI(
    title="ZenAssist ML API",
    description="API de classification automatique des réclamations client",
    version="1.0.0"
)

# CORS — autorise Next.js (port 3000) à appeler l'API (port 8000)
# Sans ça, le navigateur bloquerait les requêtes cross-origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


# ──────────────────────────────────────────────
# 3. Schéma de la requête et de la réponse
# ──────────────────────────────────────────────

# Pydantic valide automatiquement le body de la requête.
# Si "user_claim" est absent ou vide, FastAPI renvoie une
# erreur 422 automatiquement, sans code supplémentaire.
class ClaimRequest(BaseModel):
    user_claim: str

class TagResponse(BaseModel):
    tag: str


# ──────────────────────────────────────────────
# 4. Route POST /tags
# ──────────────────────────────────────────────

@app.post("/tags", response_model=TagResponse)
def predict_tag(request: ClaimRequest) -> TagResponse:
    """
    Prédit le tag d'une réclamation client.

    - **user_claim** : texte de la réclamation (string)
    - **tag** : catégorie prédite par le modèle ML
    """
    # Vérifie que la réclamation n'est pas vide
    if not request.user_claim.strip():
        raise HTTPException(
            status_code=400,
            detail="Le champ user_claim ne peut pas être vide."
        )

    # pipeline.predict() attend une liste de strings
    # et retourne une liste d'entiers (ex: [5])
    predicted_encoded = pipeline.predict([request.user_claim])

    # label_encoder.inverse_transform() convertit l'entier
    # en nom de classe lisible (ex: "Credit reporting...")
    predicted_tag = label_encoder.inverse_transform(predicted_encoded)[0]

    return TagResponse(tag=predicted_tag)


# ──────────────────────────────────────────────
# 5. Route GET / — vérification que l'API tourne
# ──────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "model": "TF-IDF + Logistic Regression",
        "classes": list(label_encoder.classes_)
    }