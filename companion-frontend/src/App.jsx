import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  return (
    <div className="container">
      <h1>Virtual Companion</h1>

      <input
        type="text"
        placeholder="Say something..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={() => alert(message)}>
        Send
      </button>
    </div>
  );
}

export default App;
