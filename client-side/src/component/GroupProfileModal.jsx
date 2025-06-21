import React, { useContext, useState, useRef } from 'react';
import { GroupContext } from '../../context/GroupContext';
import { AuthContext } from '../../context/AuthContext';
import assets from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

const GroupProfileModal = ({ show, group, onClose }) => {
  const { authUser } = useContext(AuthContext);
  const { groups, setGroups, selectedGroup, setSelectedGroup } = useContext(GroupContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Check if current user is admin
  const isAdmin = group?.admins?.some(admin => admin._id === authUser._id);
  const isCreator = group?.createdBy?._id === authUser._id;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('groupPic', file);

      const { data } = await axios.put(`/api/group/${group._id}/update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        // Update groups list
        setGroups(prev => 
          prev.map(g => g._id === group._id ? data.group : g)
        );
        
        // Update selected group if it's the current one
        if (selectedGroup && selectedGroup._id === group._id) {
          setSelectedGroup(data.group);
        }
        
        toast.success('Group profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      const { data } = await axios.put(`/api/group/${group._id}/update`, {
        name: groupName.trim(),
        description: description.trim(),
      });

      if (data.success) {
        // Update groups list
        setGroups(prev => 
          prev.map(g => g._id === group._id ? data.group : g)
        );
        
        // Update selected group if it's the current one
        if (selectedGroup && selectedGroup._id === group._id) {
          setSelectedGroup(data.group);
        }
        
        setIsEditing(false);
        toast.success('Group details updated successfully!');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update group details');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!isAdmin) return;

    if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      try {
        const { data } = await axios.delete(`/api/group/${group._id}/members/${memberId}`);
        if (data.success) {
          // Update groups list
          setGroups(prev => 
            prev.map(g => g._id === group._id ? data.group : g)
          );
          
          // Update selected group if it's the current one
          if (selectedGroup && selectedGroup._id === group._id) {
            setSelectedGroup(data.group);
          }
          
          toast.success('Member removed successfully!');
        }
      } catch (error) {
        console.error('Remove member error:', error);
        toast.error(error.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  if (!show || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-[#18122B] w-full max-w-md rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#18122B] z-10 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-white">Group Profile</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl md:text-3xl p-1"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Group Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={group.groupPic || assets.avatar_icon}
                alt="Group"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-violet-600 shadow-lg"
              />
              {isAdmin && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 bg-violet-600 hover:bg-violet-700 text-white p-2 md:p-3 rounded-full shadow-lg transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Group Details */}
          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Group Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm md:text-base"
                  placeholder="Enter group name"
                  maxLength={50}
                />
              ) : (
                <p className="text-white font-medium text-sm md:text-base">{group.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm md:text-base"
                  placeholder="Enter group description"
                  rows="3"
                  maxLength={200}
                />
              ) : (
                <p className="text-gray-300 text-sm md:text-base">{group.description || "No description"}</p>
              )}
            </div>

            {/* Group Stats */}
            <div className="bg-gray-800 rounded-lg p-3 md:p-4">
              <div className="space-y-2 text-sm md:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-400">Members:</span>
                  <span className="text-white font-medium">{group.members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created by:</span>
                  <span className="text-white font-medium truncate ml-2">{group.createdBy?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Admins:</span>
                  <span className="text-white font-medium">{group.admins.length}</span>
                </div>
              </div>
            </div>

            {/* Edit/Save Buttons */}
            {isAdmin && (
              <div className="flex gap-2 md:gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 px-4 py-2 md:py-3 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors text-sm md:text-base font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setGroupName(group.name);
                        setDescription(group.description);
                      }}
                      className="flex-1 px-4 py-2 md:py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm md:text-base font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 md:py-3 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors text-sm md:text-base font-medium"
                  >
                    Edit Group
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="mt-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3">Members ({group.members.length})</h3>
            <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 md:p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <img
                      src={member.profilePic || assets.avatar_icon}
                      alt=""
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm md:text-base font-medium truncate">{member.fullName}</p>
                      <div className="flex items-center gap-1 md:gap-2 mt-1">
                        {group.admins.some(admin => admin._id === member._id) && (
                          <span className="text-xs bg-violet-600 text-white px-2 py-1 rounded">Admin</span>
                        )}
                        {group.createdBy?._id === member._id && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Creator</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && member._id !== authUser._id && member._id !== group.createdBy?._id && (
                    <button
                      onClick={() => handleRemoveMember(member._id, member.fullName)}
                      className="text-red-400 hover:text-red-300 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 rounded hover:bg-red-900/20 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupProfileModal; 