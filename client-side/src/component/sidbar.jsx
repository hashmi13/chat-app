import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/Chatcontex";
import { GroupContext } from "../../context/GroupContext";
import assets from "../assets/assets";

const Sidebar = ({ onEditProfile, onUserClick, onGroupClick, onCreateGroup }) => {
  const {
    getUser,
    users,
    selectedUser,
    setSelectedUser,
    unseenMsg,
    setUnseenMsg,
  } = useContext(ChatContext);

  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    unseenGroupMessages,
    setUnseenGroupMessages,
    getUserGroups,
  } = useContext(GroupContext);

  const { logout, onlineUser } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  const filteredGroups = input
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(input.toLowerCase())
      )
    : groups;

  useEffect(() => {
    getUser();
  }, [onlineUser]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleUserSelect = (user) => {
    setSelectedGroup(null);
    if (typeof onUserClick === 'function') {
      onUserClick(user);
    } else {
      setSelectedUser(user);
      setUnseenMsg((prev) => ({ ...prev, [user._id]: 0 }));
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedUser(null);
    if (typeof onGroupClick === 'function') {
      onGroupClick(group);
    } else {
      setSelectedGroup(group);
      setUnseenGroupMessages((prev) => ({ ...prev, [group._id]: 0 }));
    }
  };

  // Refresh groups when component mounts or when groups change
  useEffect(() => {
    if (activeTab === "groups") {
      getUserGroups();
    }
  }, [activeTab, getUserGroups]);

  return (
    <div className={`bg-black h-full p-5 rounded-r-xl flex flex-col text-white ${selectedUser || selectedGroup ? "max-md:hidden" : ""}`}>
      <div className="pb-5 flex-1 overflow-y-scroll">
        {/* Header */}
        <div className="flex justify-between gap-2 items-center">
          <img src={assets.logo} alt="LOGO" className="max-w-32 md:max-w-32" />
          <div className="relative z-30" ref={menuRef}>
            <button
              aria-label="Open menu"
              className="p-2 md:p-2.5  focus:outline-none  transition"
              style={{ minWidth: 44, minHeight: 44 }}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg
                width="28" height="28"
                className="w-7 h-7 md:w-7 md:h-7 sm:w-8 sm:h-8"
                fill="none" viewBox="0 0 28 28" stroke="white"
              >
                <circle cx="14" cy="7" r="2" />
                <circle cx="14" cy="14" r="2" />
                <circle cx="14" cy="21" r="2" />
              </svg>
            </button>
           
           <div
  className={`
    absolute top-full right-5 z-50
    w-28 sm:w-32 
    text-center rounded-xl 
    bg-[#282142] border border-gray-600 
    text-gray-100 shadow-2xl 
    transition-all duration-200 origin-top-right 
    ${menuOpen 
      ? 'scale-100 opacity-100' 
      : 'scale-95 opacity-0 pointer-events-none'
    }
  `}
>
  <button
    onClick={() => {
      setMenuOpen(false);
      onEditProfile?.(); 
    }}
    className="w-full px-4 py-3 r md:text-sm hover:bg-violet-600 hover:text-white rounded-t-xl transition"
  >
    Edit Profile
  </button>
  
  <hr className="border-t border-gray-500 mx-2" />
  
  <button
    onClick={() => {
      setMenuOpen(false);
      setShowSettings(true);
    }}
    className="w-full px-4 py-3 md:text-sm hover:bg-violet-600 hover:text-white rounded-b-xl transition"
  >
    Settings
  </button>
</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-5 bg-[#282142] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-violet-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "groups"
                ? "bg-violet-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Groups
          </button>
        </div>

        {/* Create Group Button (only for groups tab) */}
        {activeTab === "groups" && (
          <button
            onClick={() => onCreateGroup && onCreateGroup()}
            className="w-full mt-3 py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Group
          </button>
        )}

        {/* Search Input */}
        <div className="bg-[#282142] mt-3 rounded-full flex items-center gap-2 py-3 px-4">
          <img src={assets.search_icon} alt="search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder={activeTab === "users" ? "Search user" : "Search group"}
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
          />
        </div>

        {/* Users List */}
        {activeTab === "users" && (
          <div className="flex flex-col mt-3">
            {filteredUsers.map((user) => (
              <div
                onClick={() => handleUserSelect(user)}
                key={user._id}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
                  selectedUser?._id === user._id ? "bg-[#282142]/50" : ""
                }`}
              >
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt="avatar"
                  className="w-[40px] h-8 aspect-square rounded-full"
                />
                <div className="flex flex-col leading-5">
                  <p>{user.fullName}</p>
                  {onlineUser.includes(user._id) ? (
                    <span className="text-green-400  text-xs">Active now</span>
                  ) : (
                    <span className="text-neutral-400 text-xs">offline</span>
                  )}
                </div>
                {unseenMsg[user._id] > 0 && (
                  <p className="absolute  top-7 right-3 text-xs h-4 w-4 flex justify-center items-center rounded-full bg-violet-600">
                    {unseenMsg[user._id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Groups List */}
        {activeTab === "groups" && (
          <div className="flex flex-col mt-3">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div
                  onClick={() => handleGroupSelect(group)}
                  key={group._id}
                  className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
                    selectedGroup?._id === group._id ? "bg-[#282142]/50" : ""
                  }`}
                >
                  <img
                    src={group?.groupPic || assets.avatar_icon}
                    alt="group"
                    className="w-[40px] h-8 aspect-square rounded-full"
                  />
                  <div className="flex flex-col leading-5">
                    <p className="font-medium">{group.name}</p>
                    <span className="text-neutral-400 text-xs">
                      {group.members.length} members
                    </span>
                  </div>
                  {unseenGroupMessages[group._id] > 0 && (
                    <p className="absolute  top-7 right-3 text-xs h-4 w-4 flex justify-center items-center rounded-full bg-violet-600">
                      {unseenGroupMessages[group._id]}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No groups found</p>
                <p className="text-xs mt-1">Create a group to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Settings Modal with logout */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#18122B] w-80 max-w-full p-6 rounded-lg shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
            <button onClick={logout} className="mt-8 px-4 py-2 bg-gradient-to-r from-purple-600 via-violet-800 to-purple-900 text-white rounded-full w-full font-semibold hover:bg-violet-800 transition">Logout</button>
            <button onClick={() => setShowSettings(false)} className="mt-4 px-4 py-2 bg-violet-700 text-white rounded hover:bg-violet-800">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;