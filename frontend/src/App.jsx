import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Account from "./pages/Account"; 
import ChatPage from "./pages/ChatPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile/:email" element={<Profile />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/account/:email" element={<Account />} /> 
      </Routes>
    </Router>
  );
};

export default App;
