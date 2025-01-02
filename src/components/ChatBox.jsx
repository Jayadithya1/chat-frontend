import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { Picker } from '@emoji-mart/react';
import data from '@emoji-mart/data'; // Required emoji data

const ChatBox = () => {
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingStatus, setTypingStatus] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
      showNotification(msg);
    });

    socket.on('typing', (data) => {
      setTypingStatus(`${data.username} is typing...`);
      setTimeout(() => setTypingStatus(''), 3000); // Clear after 3 seconds
    });

    socket.on('status update', (users) => {
      setUsers(Object.values(users));
    });

    return () => {
      socket.off('chat message');
      socket.off('typing');
      socket.off('status update');
    };
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (msg) => {
    if (document.hidden && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: `${msg.username}: ${msg.text}`,
      });
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      socket.emit('set status', { username, status: 'Online' });
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const formattedMessage = {
        username,
        text: message,
        type: 'text',
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit('chat message', formattedMessage);
      setMessage('');
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value) {
      socket.emit('typing', { username });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const fileMessage = {
          username,
          text: data.fileUrl,
          type: 'file',
          timestamp: new Date().toLocaleTimeString(),
        };
        socket.emit('chat message', fileMessage);
      });
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="chat-container">
      {!isUsernameSet ? (
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
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.username}:</strong>{' '}
                {msg.type === 'file' ? (
                  <a href={msg.text} target="_blank" rel="noopener noreferrer">
                    View File
                  </a>
                ) : (
                  msg.text
                )}{' '}
                <span>({msg.timestamp})</span>
              </li>
            ))}
          </ul>
          {typingStatus && <p>{typingStatus}</p>}
          <ul>
            {users.map((user) => (
              <li key={user.username}>
                {user.username} - {user.status}
              </li>
            ))}
          </ul>
          <form onSubmit={handleMessageSubmit} className="form-container">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message..."
            />
            <button type="submit">Send</button>
            <input type="file" onChange={handleFileUpload} />
            <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)}>
              😀
            </button>
          </form>
          {showEmojiPicker && (
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          )}
        </>
      )}
    </div>
  );
};

export default ChatBox;
