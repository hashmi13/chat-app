import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authUser, setauthUser] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      if (!token) {
        setauthUser(null);
        return;
      }

      const { data } = await axios.get("/api/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (data.success) {
        setauthUser(data.user);
        connectSocket(data.user);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      toast.error(err.response?.data?.message || err.message);
      logout();
    }
  };

  const login = async (state, credentials) => {
    try {
      // Add default bio for signup if not provided
      if (state === 'signup' && !credentials.bio) {
        credentials.bio = "Hi, I'm using QuickChat!";
      }
     
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setauthUser(data.userData);
        connectSocket(data.userData);
        const newToken = data.token;
        setToken(newToken);
        localStorage.setItem("token", newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setauthUser(null);
    setOnlineUser([]);
    delete axios.defaults.headers.common['Authorization'];
    if (socket) socket.disconnect();
    toast.success('Logged out successfully');
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put('/api/auth/update-profile', body, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (data.success) {
        setauthUser(data.user);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      }
    });
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUser(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setauthUser(null);
    }
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUser,
    socket,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
