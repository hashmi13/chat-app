import { useContext, useState, useEffect } from "react";
import { GroupContext } from "../../context/GroupContext";
import { ChatContext } from "../../context/Chatcontex";
import assets from "../assets/assets";
import toast from "react-hot-toast";

const CreateGroupModal = ({ show, onClose, onGroupCreated }) => {
  const { users } = useContext(ChatContext);
  const { createGroup } = useContext(GroupContext);
  
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setIsLoading(true);
    try {
      const newGroup = await createGroup({
        name: groupName.trim(),
        description: description.trim(),
        memberIds: selectedMembers
      });
      
      if (newGroup) {
        onGroupCreated && onGroupCreated(newGroup);
        handleClose();
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setSearchTerm("");
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-[#18122B] w-full max-w-md rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#18122B] z-10 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-white">Create New Group</h2>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white text-2xl md:text-3xl p-1"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm md:text-base"
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm md:text-base"
              placeholder="Enter group description"
              rows="3"
              maxLength={200}
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Members *
            </label>
            
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm md:text-base mb-3"
              placeholder="Search users..."
            />

            {/* Selected Members Count */}
            <p className="text-sm text-gray-400 mb-2">
              Selected: {selectedMembers.length} member(s)
            </p>

            {/* Members List */}
            <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-md cursor-pointer transition-colors ${
                      selectedMembers.includes(user._id)
                        ? "bg-violet-600/30 border border-violet-500"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => handleMemberToggle(user._id)}
                  >
                    <img
                      src={user.profilePic || assets.avatar_icon}
                      alt=""
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm md:text-base font-medium truncate">
                        {user.fullName}
                      </p>
                    </div>
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded border-2 flex-shrink-0 ${
                      selectedMembers.includes(user._id)
                        ? "bg-violet-500 border-violet-500"
                        : "border-gray-400"
                    }`}>
                      {selectedMembers.includes(user._id) && (
                        <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 md:gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 md:py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm md:text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 px-4 py-2 md:py-3 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium"
            >
              {isLoading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 