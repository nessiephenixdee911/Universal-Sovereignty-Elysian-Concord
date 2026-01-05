from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import hashlib
import os
from supabase import create_client, Client

app = FastAPI(title="USEC Secure Verification API")

# === CONFIGURATION ===
# Set these in environment variables (never hardcode in production!)
GROK_API_KEY = os.getenv("GROK_API_KEY")  # Your xAI Grok key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Allow frontend origin (change to your domain)
origins = [
    "http://localhost:8000",
    "https://yourdomain.com",
    "https://universalsovereigntyelysianconcord.top"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VoteRequest(BaseModel):
    choice: str  # "Sovereignty" or "Slavery"
    proof_hash: str  # First 12 chars of image hash

@app.post("/verify-id")
async def verify_id(name: str = Form(...), id_file: UploadFile = File(...)):
    if not GROK_API_KEY:
        raise HTTPException(500, "Server configuration error")

    # Read and encode image
    contents = await id_file.read()
    if len(contents) > 10_000_000:  # 10MB limit
        raise HTTPException(400, "File too large")

    # Hash image for deduplication
    image_hash = hashlib.sha256(contents).hexdigest()

    # Check if already voted
    existing = supabase.table("votes").select("proof").eq("proof", image_hash[:12]).execute()
    if existing.data:
        raise HTTPException(403, "This ID has already voted")

    # Call Grok (server-side — key safe)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROK_API_KEY}"},
            json={
                "model": "grok-beta",
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Is this a REAL government-issued ID (passport, driver's license, national ID card)? Does the exact name match '{name}'? Not fake or edited? Answer only YES or NO."},
                        {"type": "image_url", "image_url": {"url": f"data:{id_file.content_type};base64,{contents.hex()[:1000000]}"}}  # Truncate if too large
                    ]
                }]
            },
            timeout=30.0
        )

    if response.status_code != 200:
        raise HTTPException(500, "Verification service error")

    answer = response.json()["choices"][0]["message"]["content"].strip().upper()

    if answer != "YES":
        raise HTTPException(403, "ID verification failed")

    return {
        "verified": True,
        "proof_hash": image_hash[:12],  # Short proof for ledger
        "message": "ID verified — you may now vote"
    }

@app.post("/record-vote")
async def record_vote(request: VoteRequest):
    # Optional: extra server-side check
    supabase.table("votes").insert({
        "choice": request.choice,
        "timestamp": "now()",
        "proof": request.proof_hash
    }).execute()
    return {"status": "Vote recorded permanently"}