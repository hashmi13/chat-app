import Message from "../model/msg.js";
import User from "../model/user.js";
import cloudinary from "../Lib/cloudinary.js";
import { io, userSocketMap } from '../server.js';

export const getUsersidBar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filterUsers = await User.find({ _id: { $ne: userId } }).select("-password");

    const unSeenMessage = {};
    const promises = filterUsers.map(async(user) => {
        const messages = await Message.find({
            senderId: user._id,
            receiverId: userId,
            seen: false
        });
        if (messages.length > 0) {
            unSeenMessage[user._id] = messages.length;
        }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filterUsers, unSeenMessage });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

//// all message for selected user///

export const getMessgaes = async(req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );
        res.json({ success: true, messages });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

//mark message as seen ////

export const markmessageSeen = async(req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (err) {
        console.error('Mark message seen error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

//sending message to selected user//

export const sendMessage = async(req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;
 
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Emit the new message to the receiver socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};