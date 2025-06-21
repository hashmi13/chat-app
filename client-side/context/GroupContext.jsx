import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [unseenGroupMessages, setUnseenGroupMessages] = useState({});

  const { socket, authUser } = useContext(AuthContext);

  // Get all groups for the user
  const getUserGroups = async () => {
    try {
      const { data } = await axios.get("/api/group/user-groups");
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Get groups error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch groups');
    }
  };

  // Get messages for selected group
  const getGroupMessages = async (groupId) => {
    try {
      const { data } = await axios.get(`/api/group/${groupId}/messages`);
      if (data.success) {
        setGroupMessages(data.messages);
      }
    } catch (error) {
      console.error('Get group messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch group messages');
    }
  };

  // Send message to group
  const sendGroupMessage = async (msgData) => {
    try {
      const { data } = await axios.post(`/api/group/${selectedGroup._id}/send`, msgData);
      if (data.success) {
        setGroupMessages((prev) => [...prev, data.newMessage]);
      }
    } catch (error) {
      console.error('Send group message error:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  // Create a new group
  const createGroup = async (groupData) => {
    try {
      const { data } = await axios.post("/api/group/create", groupData);
      if (data.success) {
        setGroups((prev) => [data.group, ...prev]);
        toast.success('Group created successfully!');
        return data.group;
      }
    } catch (error) {
      console.error('Create group error:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
      throw error;
    }
  };

  // Add members to group
  const addGroupMembers = async (groupId, memberIds) => {
    try {
      const { data } = await axios.post(`/api/group/${groupId}/add-members`, { memberIds });
      if (data.success) {
        setGroups((prev) => 
          prev.map(group => 
            group._id === groupId ? data.group : group
          )
        );
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data.group);
        }
        toast.success('Members added successfully!');
      }
    } catch (error) {
      console.error('Add group members error:', error);
      toast.error(error.response?.data?.message || 'Failed to add members');
    }
  };

  // Remove member from group
  const removeGroupMember = async (groupId, memberId) => {
    try {
      const { data } = await axios.delete(`/api/group/${groupId}/members/${memberId}`);
      if (data.success) {
        setGroups((prev) => 
          prev.map(group => 
            group._id === groupId ? data.group : group
          )
        );
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data.group);
        }
        toast.success('Member removed successfully!');
      }
    } catch (error) {
      console.error('Remove group member error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  // Leave group
  const leaveGroup = async (groupId) => {
    try {
      const { data } = await axios.delete(`/api/group/${groupId}/leave`);
      if (data.success) {
        // Remove group from list
        setGroups((prev) => prev.filter(group => group._id !== groupId));
        
        // Clear selected group if it's the one we left
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(null);
          setGroupMessages([]);
        }
        
        // Clear unseen messages for this group
        setUnseenGroupMessages((prev) => {
          const newState = { ...prev };
          delete newState[groupId];
          return newState;
        });
        
        toast.success('Left group successfully!');
      }
    } catch (error) {
      console.error('Leave group error:', error);
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  // Listen to new group messages via socket
  const subscribeGroupMessages = () => {
    if (!socket) return;

    socket.on("newGroupMessage", (newMessage) => {
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        setGroupMessages((prev) => [...prev, newMessage]);
        // Mark as seen
        axios.put(`/api/group/${selectedGroup._id}/messages/${newMessage._id}/seen`);
      } else {
        // Update unseen count
        setUnseenGroupMessages((prev) => ({
          ...prev,
          [newMessage.groupId]: (prev[newMessage.groupId] || 0) + 1,
        }));
      }
    });

    // Listen for group updates (member added/removed, group deleted)
    socket.on("groupUpdated", (updatedGroup) => {
      setGroups((prev) => 
        prev.map(group => 
          group._id === updatedGroup._id ? updatedGroup : group
        )
      );
      
      if (selectedGroup && selectedGroup._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
      }
    });

    // Listen for group deletion
    socket.on("groupDeleted", (groupId) => {
      setGroups((prev) => prev.filter(group => group._id !== groupId));
      
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(null);
        setGroupMessages([]);
      }
      
      // Clear unseen messages for this group
      setUnseenGroupMessages((prev) => {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      });
    });

    // Listen for user removed from group
    socket.on("userRemovedFromGroup", (data) => {
      if (data.userId === authUser._id) {
        setGroups((prev) => prev.filter(group => group._id !== data.groupId));
        
        if (selectedGroup && selectedGroup._id === data.groupId) {
          setSelectedGroup(null);
          setGroupMessages([]);
        }
        
        // Clear unseen messages for this group
        setUnseenGroupMessages((prev) => {
          const newState = { ...prev };
          delete newState[data.groupId];
          return newState;
        });
        
        toast.error('You have been removed from the group');
      }
    });
  };

  // Unsubscribe from group messages
  const unsubscribeGroupMessages = () => {
    if (socket) {
      socket.off("newGroupMessage");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("userRemovedFromGroup");
    }
  };

  useEffect(() => {
    if (authUser) {
      getUserGroups();
    }
  }, [authUser]);

  useEffect(() => {
    subscribeGroupMessages();
    return () => unsubscribeGroupMessages();
  }, [socket, selectedGroup, authUser]);

  const value = {
    groups,
    selectedGroup,
    groupMessages,
    unseenGroupMessages,
    getUserGroups,
    getGroupMessages,
    sendGroupMessage,
    createGroup,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    setSelectedGroup,
    setUnseenGroupMessages,
    setGroups,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}; 