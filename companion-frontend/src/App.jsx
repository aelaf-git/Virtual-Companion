import React, { useState } from 'react';
import './App.css';
import Eyes from './Eyes';
import GestureManager from './GestureManager';

function App() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState("idle");

  const sendMessage = async (textOverride = null, moodOverride = "happy", imageSrc = null) => {
    const textToSend = textOverride || userInput;
    // Allow empty text if we have an image (Vision request)
    if (!textToSend.trim() && !imageSrc) return;

    if (!textOverride) {
        setUserInput(''); // Clear input if it's a manual message
        setMood("thinking");
    }
    
    setIsLoading(true);

    try {
      const payload = { 
        message: textToSend,
        mood: moodOverride 
      };
      
      if (imageSrc) {
        payload.image_url = imageSrc;
      }

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      const displayMessage = textOverride ? (imageSrc ? "👋 (Wave & Vision)" : "👋 (Waved)") : textToSend;
      setChatHistory(prev => [...prev, { user: displayMessage, ai: data.response }]);
      
      // Trigger Voice
      speak(data.response);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setChatHistory(prev => [...prev, { user: textToSend, ai: "Error: Could not connect to companion." }]);
      setMood("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWave = (imageSrc) => {
    if (mood === "excited" || isLoading) return; 
    console.log("Wave detected! Sending vision request...");
    setMood("excited");
    
    // Trigger backend interaction with VISION
    // We send a generic prompt but include the image
    sendMessage("Describe what you see! I am waving at you!", "excited", imageSrc);
  };

  const speak = (text) => {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.5; // High pitch for child voice
    utterance.rate = 1.1;

    utterance.onstart = () => {
        // Keep "excited" mood if we are excited, otherwise talking
        setMood(prev => prev === "excited" ? "excited" : "talking");
    };
    
    utterance.onend = () => setMood("idle");
    utterance.onerror = () => setMood("idle");

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      <h1>Virtual Companion</h1>
      
      <Eyes mood={mood} />
      
      {/* Gesture Manager runs in background and handles Capture */}
      <GestureManager onWave={handleWave} />
      
      <div className="chat-container">
        {chatHistory.map((msg, index) => (
          <div key={index} className="message-pair">
            <div className="user-message"><strong>You:</strong> {msg.user}</div>
            <div className="ai-message"><strong>Companion:</strong> {msg.ai}</div>
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
      </div>
      <div className="input-area">
        <input 
          type="text" 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Talk to your companion..."
        />
        <button onClick={sendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
}

export default App;