import React, { useContext, useMemo } from 'react';
import assets from "../assets/assets";
import { ChatContext } from '../../context/Chatcontex';

const UserProfileModal = ({ show, user, onClose }) => {
  const { messages } = useContext(ChatContext);
  const userImages = useMemo(() => {
    if (!user) return [];
    return messages.filter(
      (msg) => msg.image && (msg.senderId === user._id || msg.receiverId === user._id)
    ).map((msg) => msg.image);
  }, [messages, user]);

  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-lg mb-14 bg-black rounded-lg shadow-lg flex flex-col items-center overflow-y-auto md:overflow-y-scroll max-h-full text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl z-10">&times;</button>
        <div className="w-full flex flex-col items-center pt-10 pb-6 px-6">
          <img
            src={user.profilePic || assets.avatar_icon}
            alt="User"
            className="w-40 h-40 rounded-full object-cover border-4 border-violet-600 shadow-lg mb-4"
          />
          <h2 className="text-3xl font-bold mb-2 text-center">{user.fullName}</h2>
          <p className="text-base text-gray-400 mb-4 text-center">{user.bio}</p>
        </div>
        {userImages.length > 0 && (
          <div className="w-full px-6 pb-8">
            <h3 className="text-lg font-semibold mb-2">Shared Media</h3>
            <div className="grid grid-cols-3 gap-3">
              {userImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Shared media ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-md cursor-pointer hover:scale-105 transition"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal; 