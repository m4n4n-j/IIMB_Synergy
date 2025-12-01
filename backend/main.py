from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
from supabase import create_client, Client
from matching import run_matching_algorithm
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Synapse Lite Matching Engine")

# CORS configuration
origins = [
    "http://localhost:3000",
    "https://iimb-synergy.vercel.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

class MatchRequest(BaseModel):
    time_slot: str # e.g., "Wednesday 13:00:00"
    activity_type: str # e.g., "Lunch"

@app.get("/")
def read_root():
    return {"message": "Synapse Lite Matching Engine is running"}

@app.post("/run-match")
def run_match(request: MatchRequest = Body(...)):
    # 1. Fetch Open slots for the specific time block
    # Note: This is a simplified query. In production, handle date/time parsing carefully.
    # Assuming time_slot matches the format in DB or we filter by day/time.
    
    # For MVP, let's assume we pass a specific day and time, or just fetch all OPEN slots for a specific activity
    # to demonstrate the logic.
    
    try:
        # Fetch slots
        response = supabase.table("availability_slots") \
            .select("*, users(*)") \
            .eq("status", "Open") \
            .eq("activity_type", request.activity_type) \
            .execute()
            
        slots = response.data
        
        if not slots:
            return {"message": "No open slots found for this criteria", "matches": []}
            
        # Extract users from slots
        # We need to map user_id back to slot_id to update them later
        users = []
        user_slot_map = {}
        
        for slot in slots:
            user = slot['users']
            # Flatten user data if needed or just pass the dict
            # Ensure 'interests' is a list
            if user:
                users.append(user)
                user_slot_map[user['id']] = slot['id']
        
        if len(users) < 2:
             return {"message": "Not enough users to match", "matches": []}

        # 2. Fetch History (previous matches)
        # Simplified: fetch all matches
        history_response = supabase.table("matches").select("user_1_id, user_2_id").execute()
        history = []
        for row in history_response.data:
            pair = tuple(sorted((row['user_1_id'], row['user_2_id'])))
            history.append(pair)
            
        # 3. Run Matching Algorithm
        matches = run_matching_algorithm(users, history)
        
        # 4. Save Matches and Update Slots
        results = []
        for u1, u2, score in matches:
            # Create match record
            match_data = {
                "user_1_id": u1['id'],
                "user_2_id": u2['id'],
                "activity_type": request.activity_type,
                "scheduled_time": datetime.now().isoformat(), # Placeholder: use actual slot time
                "location": "Mess" if request.activity_type == "Lunch" else "CCD", # Simple logic
            }
            
            match_res = supabase.table("matches").insert(match_data).execute()
            
            # Update slots to 'Matched'
            slot1_id = user_slot_map[u1['id']]
            slot2_id = user_slot_map[u2['id']]
            
            supabase.table("availability_slots").update({"status": "Matched"}).in_("id", [slot1_id, slot2_id]).execute()
            
            results.append({
                "user_1": u1['full_name'],
                "user_2": u2['full_name'],
                "score": score,
                "location": match_data['location']
            })
            
        return {"message": "Matching run successfully", "matches_count": len(results), "matches": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
