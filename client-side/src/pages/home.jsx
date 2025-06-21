import { useContext, useState } from 'react';
import SideBar from '../component/sidbar';
import ChatContainer from '../component/chatContainer';
import GroupChatContainer from '../component/GroupChatContainer';
import CreateGroupModal from '../component/CreateGroupModal';
import GroupProfileModal from '../component/GroupProfileModal';
import { ChatContext } from '../../context/Chatcontex';
import { GroupContext } from '../../context/GroupContext';
import ProfileModal from './profilePage';
import UserProfileModal from '../component/UserProfileModal';
import logo from '../assets/assets';
import assets from '../assets/assets';

const Home = () => {
  const { selectedUser } = useContext(ChatContext);
  const { selectedGroup } = useContext(GroupContext);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupProfileModal, setShowGroupProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [groupProfile, setGroupProfile] = useState(null);

  // Handler for showing user profile modal from chat header only//////
  const handleUserClick = (user) => {
    setUserProfile(user);
    setShowUserProfileModal(true);
  };

  // Handler for showing group profile modal/////
  const handleGroupClick = (group) => {
    setGroupProfile(group);
    setShowGroupProfileModal(true);
  };

 
  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  
  const handleGroupCreated = (newGroup) => {
   
    console.log('Group created:', newGroup);
  };

  return (
    <div className="min-h-screen bg-black  text-white">
      <div className=" w-full h-screen sm:px-[10%] sm:py-[3%]">
        <div className="h-full w-full md:flex md:gap-4 md:rounded-xl rounded-none border md:border-gray-500  overflow-hidden relative">
          
          <div className={`${selectedUser || selectedGroup ? 'hidden' : 'block'} md:block h-full md:w-1/4 xl:w-1/5 `}>
            <SideBar 
              onEditProfile={() => setShowProfileModal(true)} 
              onCreateGroup={handleCreateGroup}
            />
          </div>
         
          <div className={`${selectedUser || selectedGroup ? 'block' : 'hidden'} md:block h-full flex-1 bg-black`}> 
            {selectedUser ? (
              <ChatContainer onUserProfileClick={handleUserClick} />
            ) : selectedGroup ? (
              <GroupChatContainer onGroupProfileClick={handleGroupClick} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-black/80">
                <img src={assets.logo_icon} alt="Logo" className="w-52 mb-3 font-mono" />
              </div>
            )}
          </div>
          <ProfileModal show={showProfileModal} onClose={() => setShowProfileModal(false)} />
          <UserProfileModal show={showUserProfileModal} user={userProfile} onClose={() => setShowUserProfileModal(false)} />
          <CreateGroupModal 
            show={showCreateGroupModal} 
            onClose={() => setShowCreateGroupModal(false)}
            onGroupCreated={handleGroupCreated}
          />
          <GroupProfileModal 
            show={showGroupProfileModal} 
            group={groupProfile} 
            onClose={() => setShowGroupProfileModal(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
