import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [unseenMsg, setUnseenMsg] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  const { socket, authUser } = useContext(AuthContext);

  // Get all users for sidebar
  const getUser = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMsg(data.unSeenMessage || {});
      }
    } catch (error) {
      console.error('Get users error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  // Get messages for selected user
  const getMessage = async (userId) => {
    try {
      const { data } = await axios.get(`/api/message/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Get messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch messages');
    }
  };

  // Send message to selected user
  const sendMessage = async (msgData) => {
    try {
      const { data } = await axios.post(`/api/message/send/${selectedUser._id}`, msgData);
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  // Listen to new messages via socket
  const subscribeMessage = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
      } else {
        setUnseenMsg((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  };

  // Unsubscribe from messages
  const unsubscribeMessage = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    if (authUser) {
      getUser();
    }
  }, [authUser]);

  useEffect(() => {
    subscribeMessage();
    return () => unsubscribeMessage();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUser,
    getMessage,
    sendMessage,
    unseenMsg,
    setSelectedUser,
    setUnseenMsg,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
