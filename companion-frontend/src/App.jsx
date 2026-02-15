import React, { useState } from 'react';
import './App.css';

function App() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const currentMessage = userInput;
    setUserInput(''); // Clear input immediately
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentMessage,
          mood: "happy" 
        }),
      });

      const data = await response.json();
      setChatHistory(prev => [...prev, { user: currentMessage, ai: data.response }]);
      
      // Trigger Voice
      speak(data.response);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setChatHistory(prev => [...prev, { user: currentMessage, ai: "Error: Could not connect to companion." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.5; // High pitch for child voice
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      <h1>Virtual Companion</h1>
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