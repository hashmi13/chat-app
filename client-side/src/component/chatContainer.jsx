import { useContext, useEffect, useRef, useState } from "react"
import assets from "../assets/assets"
import { formatMessageTime } from "../library/utils"
import { ChatContext } from "../../context/Chatcontex"
import { AuthContext } from "../../context/AuthContext"
import toast from "react-hot-toast"

const ChatContainer = ({ onUserProfileClick }) => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessage
  } = useContext(ChatContext)
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
    await sendMessage({ text: input.trim() })
    setInput('')
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
      await sendMessage({ image: reader.result })
      e.target.value = ""
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
        await sendMessage({ image: capturedImage });
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

  useEffect(() => {
    if (selectedUser) {
      getMessage(selectedUser._id)
    }
  }, [selectedUser])

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  return selectedUser ? (
   <div
  className="h-full overflow-scroll relative bg-cover bg-center bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 mx-4 border-b border-stone-500">
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => onUserProfileClick && onUserProfileClick(selectedUser)}
          >
            {selectedUser.fullName}
          </span>
          {onlineUser.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className="md:hidden max-w-7" />
       
      </div>

      {/* Chat Area */}
      <div className="flex flex-col h-[calc(100%-120px)]  overflow-y-scroll p-3 pb-6" style={{ backgroundImage: `url(${assets.chat_wall})` }}>
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.senderId === authUser._id ? "justify-end" : "justify-start"}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8" />
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all ${
                msg.senderId === authUser._id ? "bg-violet-500 text-white rounded-br-none" : "bg-gray-700 text-white rounded-bl-none"
              }`}>
                {msg.text}
              </p>
            )}
            <div className="text-center text-xs">
              <img 
                src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} 
                alt="" 
                className="rounded-full w-7"
              />
              <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      {/* Bottom Area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-black/20 backdrop-blur-md">
        <div className="flex-1 flex items-center bg-gray-100/10 px-3 py-2 rounded-full">
          <input 
            onChange={(e) => setInput(e.target.value)} 
            type="text" 
            value={input} 
            onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null} 
            placeholder="Send a message" 
            className="flex-1 text-sm bg-transparent text-white placeholder-gray-400 outline-none focus:ring-0"
          />
          
          {/* Camera Button */}
          <button
            onClick={startCamera}
            className="cursor-pointer p-1 hover:bg-gray-600/20 rounded-full transition-colors mr-2"
          >
            <span className="text-gray-400 hover:text-white text-lg font-bold">📷</span>
          </button>
          
          {/* Gallery Button */}
          <input onChange={handleSendImage} type="file" id="image" accept="image/png,image/jpeg" hidden />
          <label htmlFor="image" className="cursor-pointer p-1 hover:bg-gray-600/20 rounded-full transition-colors">
            <img src={assets.gallery_icon} alt="" className="w-5" />
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className="w-7 cursor-pointer" />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="max-w-16" />
     
    </div>
  )
}

export default ChatContainer