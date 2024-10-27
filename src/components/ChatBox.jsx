import React, { useState, useEffect } from 'react';
import socket from '../socket';  // Import the socket connection


const ChatBox = () => {
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);  // New state to check if username is set
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Listen for incoming messages from the server
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);

  // Handle username submission
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true); // Mark the username as set
    }
  };

  // Handle message submission
  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const formattedMessage = {
        username,
        text: message,
        timestamp: new Date().toLocaleTimeString()
      };
      socket.emit('chat message', formattedMessage);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      {!isUsernameSet ? (  // Only show the username input if not set
        <form onSubmit={handleUsernameSubmit}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Join Chat</button>
        </form>
      ) : (
        <>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.username}:</strong> {msg.text} <span>({msg.timestamp})</span>
              </li>
            ))}
          </ul>
          <form onSubmit={handleMessageSubmit} className="form-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;
