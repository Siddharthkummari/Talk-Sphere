import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestMessages, setLatestMessages] = useState({});
  const { email } = useParams();
  const navigate = useNavigate();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/profile/${email}`, {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  // Fetch latest messages and unread counts for friends
  useEffect(() => {
    const fetchFriendMessages = async () => {
     
      try {
        const res = await axios.get("http://localhost:5000/rooms");
        const roomMap = {};
        const promises = [];

        user?.friends?.forEach((friendEmail) => {
          const roomName = [email, friendEmail].sort().join("_");
          const room = res.data.find((r) => r.name === roomName);
          
          if (room) {
            const latestMsgPromise = axios.get(
              `http://localhost:5000/api/auth/messages/latest/${room.roomId}`
            );
            const unreadCountPromise = axios.get(
              `http://localhost:5000/api/auth/messages/unread/${room.roomId}/${email}`
            );
            
            
            promises.push(
              Promise.all([latestMsgPromise, unreadCountPromise])
                .then(([latestRes, unreadRes]) => {
                  const { message, userID } = latestRes.data;
                  
                  const unreadCount = unreadRes.data.count;
                  roomMap[roomName] = { message, sender: userID, unreadCount };
                })
                .catch((err) => {
                  console.error("Error fetching friend messages:", err);
                })
            );
          }
        });

        await Promise.all(promises);
        setLatestMessages((prev) => ({ ...prev, ...roomMap }));
        
      } catch (error) {
        console.error("Failed to fetch friend message data", error);
      }
    };

    if (user?.friends?.length > 0) {
      fetchFriendMessages();
    }
  }, [user, email]);

  // Fetch latest messages and unread counts for groups
  useEffect(() => {
    
   
    const fetchGroupMessages = async () => {
      
      
  
      try {
        if (!user?.groups?.length) {
          console.log("No groups to fetch");
          return;
        }
        console.log(user?.groups?.length);
        const res = await axios.get("http://localhost:5000/rooms");
        const roomMap = {};
        const promises = [];
  
        user.groups.forEach((group) => {
         
          const roomId = group.roomId;
          const room = res.data.find((r) => r.roomId  === roomId);
          
        
          if (room) {
            const latestMsgPromise = axios.get(
              `http://localhost:5000/api/auth/messages/latest/${room.roomId}`
            );
            const unreadCountPromise = axios.get(
              `http://localhost:5000/api/auth/messages/unread/${room.roomId}/${email}`
            );
  
            promises.push(
              Promise.all([latestMsgPromise, unreadCountPromise])
                .then(([latestRes, unreadRes]) => {
                  const message = latestRes.data.message || "No message yet";
                  const sender = latestRes.data.userID || "Unknown";
                  const unreadCount = unreadRes.data.count;
                  console.log(message)
                  roomMap[roomId] = { message, sender , unreadCount };
                })
                .catch((err) => {
                  console.error("Error fetching group messages:", err);
                })
            );
          }
        });
  
        await Promise.all(promises);
        setLatestMessages((prev) => ({ ...prev, ...roomMap }));
       
      } catch (error) {
        console.error("Failed to fetch group message data", error);
      }
    };
  
    fetchGroupMessages(); // Always call it — the condition is inside
  }, [user, email]);
  
  // Message handlers
  const handleMessage = async (friendEmail) => {
    const roomName = [email, friendEmail].sort().join("_");
    try {
      const res = await axios.get("http://localhost:5000/rooms");
      const room = res.data.find((r) => r.name === roomName);

      if (room) {
        navigate(`/chat/${room.roomId}`, { state: { email: user.email } });
      } else {
        alert("Room not found!");
      }
    } catch (err) {
      console.error("Error fetching room:", err);
      alert("Something went wrong while finding the room.");
    }
  };

  const handleGroupMessage = async (groupId) => {
    try {
      const res = await axios.get("http://localhost:5000/groups", {
        withCredentials: true,
      });
      const group = res.data.find((g) => g._id === groupId);

      if (group) {
        navigate(`/chat/${group.roomId}`, { state: { email: user.email } });
      } else {
        alert("Group not found!");
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      alert("Something went wrong while finding the group.");
    }
  };

  if (loading) return <p>Loading user data...</p>;
  if (!user) return <p>User not found. Please log in.</p>;

  return (
    <div className="profile-page">
      <Link to={`/account/${email}`} className="switch-link">
        Go to Account
      </Link>

      <div className="profile-overlay">
        {/* Friends Section */}
        <div className="friend-list-section">
          <h3>Your Friends:</h3>
          {user.friends?.length > 0 ? (
            <ul className="friend-list">
              {user.friends.map((friendEmail, index) => {
                const roomName = [email, friendEmail].sort().join("_");
                const lastMsg = latestMessages[roomName];
                const message = lastMsg?.message || "No message yet";
                const sender = lastMsg?.sender || "Unknown";

                return (
                  <li key={index} className="friend-item">
                    <div className="friend-info">
                      <strong>{friendEmail}</strong>
                      <p>
                        Last message: <strong>{message}</strong> <br />
                        Sent by: <em>{sender}</em> <br />
                        {lastMsg?.unreadCount > 0 && (
                          <span style={{ color: "red", fontWeight: "bold" }}>
                            🔔 {lastMsg.unreadCount} unread
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMessage(friendEmail)}
                      className="message-button"
                    >
                      Message
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No friends added yet 😞</p>
          )}
        </div>

        {/* Groups Section */}
        <div className="group-list-section">
          <h3>Your Groups:</h3>
          {user.groups?.length > 0 ? (
            <ul className="group-list">
              {user.groups.map((group, index) => {
                const roomId = group.roomId;
                const lastMsg = latestMessages[roomId];
                const message = lastMsg?.message || "No message yet";
                const sender = lastMsg?.sender || "Unknown";

                return (
                  <li key={index} className="group-item">
                    <strong>{group.name}</strong>
                    <p>
                      Last message: <strong>{message}</strong> <br />
                      Sent by: <em>{sender}</em> <br />
                      {lastMsg?.unreadCount > 0 && (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          🔔 {lastMsg.unreadCount} unread
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleGroupMessage(group._id)}
                      className="message-button"
                    >
                      Message
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No groups joined yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
