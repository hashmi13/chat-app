import { useContext, useEffect, useRef, useState } from "react"
import assets from "../assets/assets"
import { formatMessageTime } from "../library/utils"
import { GroupContext } from "../../context/GroupContext"
import { AuthContext } from "../../context/AuthContext"
import toast from "react-hot-toast"

const GroupChatContainer = ({ onGroupProfileClick }) => {
  const {
    groupMessages,
    selectedGroup,
    setSelectedGroup,
    sendGroupMessage,
    getGroupMessages,
    leaveGroup
  } = useContext(GroupContext)
  const { authUser, onlineUser } = useContext(AuthContext)

  const scrollEnd = useRef()
  const [input, setInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === "") return;
    try {
      await sendGroupMessage({ text: input.trim() })
      setInput('')
    } catch (error) {
      // If sending fails, the group might have been deleted or user removed
      console.error('Failed to send message:', error);
    }
  }

  // Handling sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) {
      toast.error('Select an image file')
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await sendGroupMessage({ image: reader.result })
        e.target.value = ""
      } catch (error) {
        console.error('Failed to send image:', error);
      }
    }
    reader.readAsDataURL(file)
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
    }
  };

  // Send captured photo
  const sendCapturedPhoto = async () => {
    if (capturedImage) {
      try {
        await sendGroupMessage({ image: capturedImage });
        stopCamera();
        toast.success('Photo sent successfully!');
      } catch (error) {
        console.error('Failed to send captured photo:', error);
        toast.error('Failed to send photo');
      }
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(selectedGroup._id)
      } catch (error) {
        console.error('Failed to leave group:', error);
      }
    }
  }

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id)
    }
  }, [selectedGroup])

  useEffect(() => {
    if (scrollEnd.current && groupMessages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [groupMessages])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // If no group is selected, show placeholder
  if (!selectedGroup) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 h-full">
        <img src={assets.logo_icon} alt="" className="max-w-16 md:max-w-20" />
        <p className="text-base md:text-lg font-medium text-white text-center px-4">Select a group to start chatting</p>
      </div>
    )
  }

  // Camera overlay
  if (showCamera) {
    return (
      <div className="h-full flex flex-col bg-black">
        {/* Camera Header */}
        <div className="flex items-center justify-between p-4 bg-black/95 backdrop-blur-sm border-b border-gray-700">
          <button
            onClick={stopCamera}
            className="text-white text-lg font-medium"
          >
            Cancel
          </button>
          <h3 className="text-white text-lg font-medium">Take Photo</h3>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Camera Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-800"></div>
                </button>
              </div>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              {/* Photo Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={retakePhoto}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full font-medium"
                >
                  Retake
                </button>
                <button
                  onClick={sendCapturedPhoto}
                  className="px-6 py-3 bg-violet-600 text-white rounded-full font-medium"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 px-3 md:px-4 border-b border-stone-500 bg-black/95 backdrop-blur-sm">
        <img 
          src={selectedGroup.groupPic || assets.avatar_icon} 
          alt="" 
          className="w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base md:text-lg text-white font-medium truncate">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => onGroupProfileClick && onGroupProfileClick(selectedGroup)}
              >
                {selectedGroup.name}
              </span>
            </p>
            <span className="text-xs text-gray-400 flex-shrink-0">
              ({selectedGroup.members.length})
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">
            {selectedGroup.description || "No description"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLeaveGroup}
            className="text-red-400 hover:text-red-300 text-xs md:text-sm px-2 py-1 rounded transition-colors"
          >
            Leave
          </button>
          <img 
            onClick={() => setSelectedGroup(null)} 
            src={assets.arrow_icon} 
            alt="" 
            className="w-6 h-6 md:w-7 md:h-7 cursor-pointer flex-shrink-0" 
          />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 flex flex-col overflow-y-auto p-2 md:p-3 pb-4" 
        style={{ backgroundImage: `url(${assets.chat_wall})` }}
      >
        {groupMessages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 mb-4 ${msg.senderId._id === authUser._id ? "justify-end" : "justify-start"}`}>
            {msg.image ? (
              <div className={`flex flex-col ${msg.senderId._id === authUser._id ? "items-end" : "items-start"} max-w-[85%] md:max-w-[70%]`}>
                <img 
                  src={msg.image} 
                  alt="" 
                  className="max-w-full h-auto border border-gray-700 rounded-lg overflow-hidden" 
                />
                <div className="text-center text-xs mt-1">
                  <div className="flex items-center gap-1 justify-center">
                    <img 
                      src={msg.senderId.profilePic || assets.avatar_icon} 
                      alt="" 
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                    />
                    <span className="text-gray-500 font-medium">{msg.senderId.fullName}</span>
                  </div>
                  <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col ${msg.senderId._id === authUser._id ? "items-end" : "items-start"} max-w-[85%] md:max-w-[70%]`}>
                <p className={`p-2 md:p-3 text-sm md:text-base font-light rounded-lg break-words ${
                  msg.senderId._id === authUser._id 
                    ? "bg-violet-500 text-white rounded-br-none" 
                    : "bg-gray-700 text-white rounded-bl-none"
                }`}>
                  {msg.text}
                </p>
                <div className="text-center text-xs mt-1">
                  <div className="flex items-center gap-1 justify-center">
                    <img 
                      src={msg.senderId.profilePic || assets.avatar_icon} 
                      alt="" 
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                    />
                    <span className="text-gray-500 font-medium">{msg.senderId.fullName}</span>
                  </div>
                  <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      {/* Bottom Area */}
      <div className="p-2 md:p-3 bg-black/20 backdrop-blur-md border-t border-gray-700">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex-1 flex items-center bg-gray-100/10 px-3 py-2 md:py-3 rounded-full">
            <input 
              onChange={(e) => setInput(e.target.value)} 
              type="text" 
              value={input} 
              onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null} 
              placeholder="Send a message to group" 
              className="flex-1 text-sm md:text-base bg-transparent text-white placeholder-gray-400 outline-none focus:ring-0"
            />
            
            {/* Camera Button */}
            <button
              onClick={startCamera}
              className="cursor-pointer p-1 hover:bg-gray-600/20 rounded-full transition-colors"
            >
              <span className="text-gray-400 hover:text-white text-lg font-bold">📷</span>
            </button>
            
            {/* Gallery Button */}
            <input onChange={handleSendImage} type="file" id="group-image" accept="image/png,image/jpeg" hidden />
            <label htmlFor="group-image" className="cursor-pointer p-1 hover:bg-gray-600/20 rounded-full transition-colors">
              <img src={assets.gallery_icon} alt="" className="w-5 h-5 md:w-6 md:h-6" />
            </label>
          </div>
          <button 
            onClick={handleSendMessage}
            className="bg-violet-600 hover:bg-violet-700 p-2 md:p-3 rounded-full transition-colors"
          >
            <img src={assets.send_button} alt="" className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupChatContainer 