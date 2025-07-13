import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

function App() {
  const [userID, setUserID] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      setUserID(socket.id);
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
    const fetchRooms = async () => {
      const res = await axios.get('http://localhost:3001/rooms');
      setRooms(res.data);
    };
    fetchRooms();
  }, [newRoomName]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    const res = await axios.post('http://localhost:3001/create-room', {
      name: newRoomName,
      createdBy: userID,
    });
    setNewRoomName('');
    joinRoom(res.data.roomId);
  };

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
    });
    setMessage('');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🧩 Socket.io Chat</h2>
      <p><strong>Your ID:</strong> {userID}</p>

      {/* Create Room */}
      <div>
        <input
          placeholder="New Room Name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button onClick={createRoom}>Create Room</button>
      </div>

      {/* Room List */}
      <div style={{ marginTop: '1rem' }}>
        <h3>Available Rooms:</h3>
        {rooms.map((room) => (
          <button
            key={room.roomId}
            onClick={() => joinRoom(room.roomId)}
            style={{
              margin: '5px',
              background: room.roomId === selectedRoom ? '#d3d3d3' : '',
            }}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      {selectedRoom && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Room: {selectedRoom}</h4>
          <input
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>

          <ul>
            {messages.map((msg, idx) => (
              <li key={idx}>
                <strong>{msg.userID}:</strong> {msg.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
