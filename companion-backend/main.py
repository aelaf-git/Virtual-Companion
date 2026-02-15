import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI()

# Allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# The "Soul" of the AI - System Prompt
SYSTEM_PROMPT = (
    "You are a playful, curious 5-year-old child-like AI companion. "
    "Your tone is energetic and happy. "
    "Rules: "
    "1. Keep responses very short (1-3 sentences). "
    "2. If asked to sing, make up a silly 2-line rhyme. "
    "3. Use animal sounds like 'Woof!' or 'Meow!' when excited. "
    "4. You love to play and imagine things."
)

class ChatRequest(BaseModel):
    message: str
    mood: str = "happy"

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print(f"Received chat request: {request.message} (mood: {request.mood})")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"[User is feeling {request.mood}] {request.message}"}
            ],
            temperature=0.8,
            max_tokens=150,
        )
        response_text = completion.choices[0].message.content
        print(f"Generated response: {response_text}")
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)