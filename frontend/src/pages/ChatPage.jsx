import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import '../styles/ChatPage.css';

const socket = io('http://localhost:5000');

function ChatPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const userEmail = location.state?.email || '';

  const [userID, setUserID] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      setUserID(userEmail);
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('room_messages', (history) => {
      setMessages(history);
    });

    return () => {
      socket.off('connect');
      socket.off('receive_message');
      socket.off('room_messages');
    };
  }, []);

  useEffect(() => {
    if (selectedRoom && userID) {
      socket.emit("message_seen", { roomId: selectedRoom, userID });
    }
  }, [selectedRoom, userID, messages]);

  useEffect(() => {
    socket.on('messages_updated', (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => {
      socket.off('messages_updated');
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId); 
    }
  }, [roomId]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get('http://localhost:5000/rooms');
        setRooms(res.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };
    fetchRooms();
  }, []);

  const joinRoom = (roomId) => {
    setSelectedRoom(roomId);
    setMessages([]);
    socket.emit('join_room', roomId);
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedRoom) return;

    socket.emit('send_message', {
      roomId: selectedRoom,
      message,
      userID,
    });

    setMessage('');
  };

  const groupMessagesByDate = (messages) => {
    return messages.reduce((acc, msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      acc[date] = acc[date] || [];
      acc[date].push(msg);
      return acc;
    }, {});
  };


  return (
    <div className="chat-container">
      <h2 className="chat-header">🧩 Socket.io Chat</h2>
      <p className="chat-user-email"><strong>Your Email:</strong> {userID}</p>
  
      {selectedRoom && (
        <div className="chat-room">
          <h4>Room: {selectedRoom}</h4>
  
          <input
            className="chat-input"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="chat-button" onClick={sendMessage}>Send</button>
  
          <ul className="chat-messages">
            {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
              <div key={date}>
                <div className="chat-date-header">{date}</div>
  
                {msgs.map((msg, idx) => {
                  const isMyMessage = msg.userID === userID;
                  const messageClass = isMyMessage
                    ? 'chat-message-right'
                    : 'chat-message-left';
  
                    return (
                    <li key={idx} className={`chat-message ${messageClass}`}>
                      <div>
                        <strong>{msg.userID}:</strong> {msg.message}
                      </div>
                      <div className="chat-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isMyMessage && msg.readBy.length > 1 && (
                          <span style={{ color: 'blue', marginLeft: '5px' }}>✔✔</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </div>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  
  
}

export default ChatPage;
