import React, { useState } from 'react';
import './App.css';
import Eyes from './Eyes';
import GestureManager from './GestureManager';

function App() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState("idle");
  const [showCamera, setShowCamera] = useState(false);

  const sendMessage = async (textOverride = null, moodOverride = "happy", imageSrc = null) => {
    const textToSend = textOverride || userInput;
    if (!textToSend.trim() && !imageSrc) return;

    if (!textOverride) {
        setUserInput('');
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
      
      const displayMessage = textOverride ? (imageSrc ? "👋 (Wave)" : "👋 (Wave)") : textToSend;
      setChatHistory(prev => [...prev, { user: displayMessage, ai: data.response }]);
      
      speak(data.response);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setChatHistory(prev => [...prev, { user: textToSend, ai: "Error: Could not connect to Blue." }]);
      setMood("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWave = (imageSrc) => {
    if (mood === "excited" || isLoading) return; 
    setMood("excited");
    sendMessage("[User waves at you!]", "excited", imageSrc);
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.5;
    utterance.rate = 1.1;

    utterance.onstart = () => {
        setMood(prev => prev === "excited" ? "excited" : "talking");
    };
    
    utterance.onend = () => setMood("idle");
    utterance.onerror = () => setMood("idle");
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="title-group">
            <h1>Blue</h1>
            <p className="subtitle">by Aelaf Eskindir</p>
        </div>
        <button 
            className={`camera-toggle ${showCamera ? 'active' : ''}`} 
            onClick={() => setShowCamera(!showCamera)}
            title="Toggle Camera"
        >
            📷
        </button>
      </header>
      
      <Eyes mood={mood} />
      
      <GestureManager onWave={handleWave} visible={showCamera} />
      
      <div className="chat-container">
        {chatHistory.map((msg, index) => (
          <div key={index} className="message-pair">
            <div className="user-message"><strong>You:</strong> {msg.user}</div>
            <div className="ai-message"><strong>Blue:</strong> {msg.ai}</div>
          </div>
        ))}
        {isLoading && <div className="loading">Blue is thinking...</div>}
      </div>
      <div className="input-area">
        <input 
          type="text" 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Talk to Blue..."
        />
        <button onClick={sendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
}

export default App;