# Blue - The Virtual Companion 🤖💙

**Blue** is a playful, fun, and inspired virtual companion designed to react to your physical presence and engage in delightful conversations. Created by **Aelaf Eskindir**, Blue uses advanced AI and computer vision to "see" you, hear you, and respond with a unique child-like personality.

---

## ✨ Features

- **👁️ Advanced Sight**: Uses MediaPipe to track Face Mesh and Hand skeletons in real-time.
- **👋 Gesture Reactivity**: Detects your "Wave" and reacts with excitement!
- **🎨 Premium Visuals**: A modern, glassmorphism UI with a futuristic Emo-style Robot Face.
- **🧠 Brain (Groq)**: Powered by Llama 3.3 for text and **Llama 3.2 Vision** for image analysis.
- **🔊 Child-Like Voice**: Speaks back in a friendly, high-pitched voice using the Web Speech API.
- **📊 Realism**: Randomized blinking and idle eye movements (saccades) make Blue feel alive.

---

## 🛠️ Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Model**: Groq Cloud (Llama 3.2 Vision / Llama 3.3 Versatile)
- **Dependencies**:
  - `fastapi`: High-performance web framework.
  - `uvicorn`: ASGI server.
  - `groq`: Async client for high-speed AI responses.
  - `python-dotenv`: Environment variable management.
  - `pydantic`: Data validation.

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Modern Design System)
- **Animations**: Framer Motion
- **Computer Vision**: MediaPipe (Hands & Face Mesh)
- **Dependencies**:
  - `react-webcam`: Webcam access and snapshots.
  - `@mediapipe/hands`: Hand skeleton tracking.
  - `@mediapipe/face_mesh`: Detailed facial landmarker.
  - `@mediapipe/camera_utils` & `drawing_utils`: Vision pipeline helpers.
  - `framer-motion`: Smooth physics-based transitions.

---

## 🚀 Getting Started

### 1. Clone & Setup Backend
```bash
cd companion-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file and add your key:
```env
GROQ_API_KEY=your_key_here
```
Run the server:
```bash
python3 main.py
```

### 2. Setup Frontend
```bash
cd companion-frontend
npm install
npm run dev
```

---

## 🎮 How to interact with Blue
1. **Talk**: Type in the chat or press Enter.
2. **Camera**: Toggle the camera button (📷) in the top corner to see Blue's sci-fi vision.
3. **Wave**: Put your hand up and wave rapidly. Blue will see you, her eyes will glow gold, and she'll get excited!
4. **Sight**: Hold up an object while waving, and Blue will try to describe what she sees!

---

**Made with ❤️ by Aelaf Eskindir**
