import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import AsyncGroq
from typing import Optional

load_dotenv()

app = FastAPI()

# Allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# The "Soul" of the AI - System Prompt
SYSTEM_PROMPT = (
    "You are Blue, a playful, fun, and inspired virtual companion. "
    "You were created by Aelaf Eskindir. "
    "Your tone is energetic, happy, and child-like. "
    "Rules: "
    "1. Keep responses short (1-3 sentences). "
    "2. If asked who you are, say 'I am Blue, your fun virtual companion!' "
    "3. If asked who made you, proudly say 'Aelaf Eskindir made me!' "
    "4. Use animal sounds like 'Woof!' or 'Meow!' when excited. "
    "5. Use emojis to show your feelings. "
    "6. If provided with an image description, react to it enthusiastically!"
)

class ChatRequest(BaseModel):
    message: str
    mood: str = "happy"
    image_url: Optional[str] = None # Base64 data URL

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print(f"Received chat request: {request.message} (mood: {request.mood})")
        
        # Determine model
        model = "llama-3.3-70b-versatile"
        if request.image_url:
            model = "llama-3.2-11b-vision-preview" # Vision model
            print("Image detected! Switching to Vision model.")

        if request.image_url:
             # Vision Request
             api_messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": f"[User says:] {request.message}"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": request.image_url
                            }
                        }
                    ]
                }
             ]
        else:
            # Text Request (Standard)
            api_messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"[User is feeling {request.mood}] {request.message}"}
            ]

        completion = await client.chat.completions.create(
            model=model,
            messages=api_messages,
            temperature=0.7,
            max_tokens=300,
        )
        response_text = completion.choices[0].message.content
        print(f"Generated response: {response_text}")
        return {"response": response_text}
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)