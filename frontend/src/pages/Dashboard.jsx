import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user details from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h2>Welcome, {user.name}!</h2>
      <img
        src={`http://localhost:5000/uploads/${user.photo}`}
        alt="User profile"
        style={{
          width: "150px",
          height: "150px",
          objectFit: "cover",
          borderRadius: "50%",
          margin: "20px 0"
        }}
      />
      <p>Email: {user.email}</p>
    </div>
  );
};

export default Dashboard;
