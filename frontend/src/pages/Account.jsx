import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import '../styles/Profile.css';

const Account = () => {
  const [user, setUser] = useState(null);
  const [friend, setFriend] = useState("");
  const [friends, setFriends] = useState([]);
  const [gfriend, setGfriend] = useState("");
  const [groupName, setGroupName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { email } = useParams();


    useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/profile/${email}`, {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/api/auth/addfriend",
        { email: friend },
        { withCredentials: true }
      );

      const roomName = [email, friend].sort().join("_");
      await axios.post("http://localhost:5000/create-room", {
        name: roomName,
        createdBy: email,
      });

      setFriend("");
      window.location.reload();
    } catch (error) {
      console.error("Adding error:", error.response?.data || error);
      alert(error.response?.data?.message || "Adding failed");
    }
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (gfriend.trim()) {
      setFriends([...friends, gfriend.trim()]);
      setGfriend("");
    }
  };

  const handleGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    try {
      const roomName = [...friends, email].sort().join("_");
      await axios.post(
        "http://localhost:5000/api/auth/createGroup",
        { friendsArray: friends, groupName, roomName, createdBy: email },
        { withCredentials: true }
      );
      setFriends([]);
      setGroupName("");
      window.location.reload();
    } catch (error) {
      console.error("Group creation error:", error.response?.data || error);
      alert(error.response?.data?.message || "Group creation failed");
    }
  };

  if (!user) return <p>Loading account...</p>;

  return (
    <div className="profile-page">
      <Link to={`/profile/${email}`} className="switch-link">← Back to Messages</Link>

      <img
        src={`http://localhost:5000/uploads/${user.photo}`}
        alt="Profile"
        className="profile-photo"
      />
      <div className="profile-overlay">
        <h2 className="profile-welcome">Welcome, {user.name}!</h2>
        <p className="profile-email">Email: {user.email}</p>

        <form onSubmit={handleSubmit} className="friend-form">
          <input
            placeholder="Enter friend's email"
            value={friend}
            onChange={(e) => setFriend(e.target.value)}
            className="friend-input"
          />
          <button type="submit" className="friend-button">Add Friend</button>
        </form>

        <form onSubmit={handleGroup} className="group-form">
          {!showForm ? (
            <button type="button" onClick={() => setShowForm(true)} className="create-group">
              Create Group
            </button>
          ) : (
            <>
              <input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="group-name-input"
              />
              <div className="friend-input-row">
                <input
                  placeholder="Enter friend's email"
                  value={gfriend}
                  onChange={(e) => setGfriend(e.target.value)}
                  className="friend-group-input"
                />
                <button type="button" onClick={handleAddFriend} className="add-friend-button">
                  Add
                </button>
              </div>
              <button type="submit" className="create-group">Create Group</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Account;
