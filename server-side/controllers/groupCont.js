import Group from "../model/group.js";
import GroupMessage from "../model/groupMessage.js";
import User from "../model/user.js";
import cloudinary from "../Lib/cloudinary.js";
import { io, userSocketMap } from '../server.js';
import fs from 'fs';

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;
        const createdBy = req.user._id;

        // Validate required fields
        if (!name || !memberIds || memberIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Group name and at least one member are required" 
            });
        }

        // Add creator to members if not already included
        const allMembers = [...new Set([...memberIds, createdBy.toString()])];

        // Create the group
        const newGroup = await Group.create({
            name,
            description: description || "",
            createdBy,
            admins: [createdBy],
            members: allMembers
        });

        // Populate group with member details
        const populatedGroup = await Group.findById(newGroup._id)
            .populate('members', 'fullName profilePic')
            .populate('admins', 'fullName profilePic')
            .populate('createdBy', 'fullName profilePic');

        // Emit new group to all members
        allMembers.forEach(memberId => {
            const memberSocketId = userSocketMap[memberId.toString()];
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdated", populatedGroup);
            }
        });

        res.json({ success: true, group: populatedGroup });
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            members: userId,
            isActive: true
        })
        .populate('members', 'fullName profilePic')
        .populate('admins', 'fullName profilePic')
        .populate('createdBy', 'fullName profilePic')
        .sort({ updatedAt: -1 });

        res.json({ success: true, groups });
    } catch (err) {
        console.error('Get user groups error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get group details
export const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({
            _id: groupId,
            members: userId,
            isActive: true
        })
        .populate('members', 'fullName profilePic')
        .populate('admins', 'fullName profilePic')
        .populate('createdBy', 'fullName profilePic');

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not a member" 
            });
        }

        res.json({ success: true, group });
    } catch (err) {
        console.error('Get group details error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            members: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not a member" 
            });
        }

        const messages = await GroupMessage.find({ groupId })
            .populate('senderId', 'fullName profilePic')
            .sort({ createdAt: 1 });

        // Mark messages as seen by current user
        await GroupMessage.updateMany(
            { 
                groupId, 
                'seenBy.userId': { $ne: userId } 
            },
            { 
                $push: { 
                    seenBy: { 
                        userId, 
                        seenAt: new Date() 
                    } 
                } 
            }
        );

        res.json({ success: true, messages });
    } catch (err) {
        console.error('Get group messages error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            members: senderId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not a member" 
            });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await GroupMessage.create({
            groupId,
            senderId,
            text,
            image: imageUrl,
            seenBy: [{ userId: senderId, seenAt: new Date() }]
        });

        // Populate sender details
        const populatedMessage = await GroupMessage.findById(newMessage._id)
            .populate('senderId', 'fullName profilePic');

        // Emit to all group members
        group.members.forEach(memberId => {
            const memberSocketId = userSocketMap[memberId.toString()];
            if (memberSocketId && memberId.toString() !== senderId.toString()) {
                io.to(memberSocketId).emit("newGroupMessage", populatedMessage);
            }
        });

        res.json({ success: true, newMessage: populatedMessage });
    } catch (err) {
        console.error('Send group message error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add members to group
export const addGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        const group = await Group.findOne({
            _id: groupId,
            admins: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not an admin" 
            });
        }

        // Add new members
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: { $each: memberIds } } },
            { new: true }
        )
        .populate('members', 'fullName profilePic')
        .populate('admins', 'fullName profilePic')
        .populate('createdBy', 'fullName profilePic');

        // Emit group update to all group members
        group.members.forEach(memberId => {
            const memberSocketId = userSocketMap[memberId.toString()];
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdated", updatedGroup);
            }
        });

        // Emit to new members
        memberIds.forEach(memberId => {
            const memberSocketId = userSocketMap[memberId.toString()];
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.json({ success: true, group: updatedGroup });
    } catch (err) {
        console.error('Add group members error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Remove member from group
export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({
            _id: groupId,
            admins: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not an admin" 
            });
        }

        // Don't allow removing the creator
        if (memberId === group.createdBy.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot remove group creator" 
            });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { 
                $pull: { 
                    members: memberId,
                    admins: memberId 
                } 
            },
            { new: true }
        )
        .populate('members', 'fullName profilePic')
        .populate('admins', 'fullName profilePic')
        .populate('createdBy', 'fullName profilePic');

        // Emit group update to remaining members
        updatedGroup.members.forEach(member => {
            const memberSocketId = userSocketMap[member._id.toString()];
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdated", updatedGroup);
            }
        });

        // Emit removal event to the removed user
        const removedUserSocketId = userSocketMap[memberId];
        if (removedUserSocketId) {
            io.to(removedUserSocketId).emit("userRemovedFromGroup", {
                groupId: groupId,
                userId: memberId
            });
        }

        res.json({ success: true, group: updatedGroup });
    } catch (err) {
        console.error('Remove group member error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Leave group
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({
            _id: groupId,
            members: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not a member" 
            });
        }

        let groupDeleted = false;

        // If user is the creator, transfer ownership to first admin or delete group
        if (group.createdBy.toString() === userId.toString()) {
            const otherAdmins = group.admins.filter(admin => admin.toString() !== userId.toString());
            if (otherAdmins.length > 0) {
                // Transfer ownership to first admin
                const updatedGroup = await Group.findByIdAndUpdate(groupId, {
                    createdBy: otherAdmins[0],
                    $pull: { admins: userId }
                }, { new: true })
                .populate('members', 'fullName profilePic')
                .populate('admins', 'fullName profilePic')
                .populate('createdBy', 'fullName profilePic');

                // Emit group update to remaining members
                updatedGroup.members.forEach(member => {
                    const memberSocketId = userSocketMap[member._id.toString()];
                    if (memberSocketId) {
                        io.to(memberSocketId).emit("groupUpdated", updatedGroup);
                    }
                });
            } else {
                // No other admins, delete the group
                await Group.findByIdAndUpdate(groupId, { isActive: false });
                await GroupMessage.deleteMany({ groupId });
                groupDeleted = true;

                // Emit group deletion to all members
                group.members.forEach(memberId => {
                    const memberSocketId = userSocketMap[memberId.toString()];
                    if (memberSocketId) {
                        io.to(memberSocketId).emit("groupDeleted", groupId);
                    }
                });
            }
        } else {
            // Regular member leaving
            const updatedGroup = await Group.findByIdAndUpdate(groupId, {
                $pull: { 
                    members: userId,
                    admins: userId 
                }
            }, { new: true })
            .populate('members', 'fullName profilePic')
            .populate('admins', 'fullName profilePic')
            .populate('createdBy', 'fullName profilePic');

            // Emit group update to remaining members
            updatedGroup.members.forEach(member => {
                const memberSocketId = userSocketMap[member._id.toString()];
                if (memberSocketId) {
                    io.to(memberSocketId).emit("groupUpdated", updatedGroup);
                }
            });
        }

        res.json({ 
            success: true, 
            message: groupDeleted ? "Group deleted successfully" : "Left group successfully" 
        });
    } catch (err) {
        console.error('Leave group error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Mark group message as seen
export const markGroupMessageSeen = async (req, res) => {
    try {
        const { groupId, messageId } = req.params;
        const userId = req.user._id;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            members: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not a member" 
            });
        }

        // Mark message as seen by this user
        await GroupMessage.findByIdAndUpdate(messageId, {
            $addToSet: { 
                seenBy: { 
                    userId, 
                    seenAt: new Date() 
                } 
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Mark group message seen error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update group details
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        // Check if user is admin of the group
        const group = await Group.findOne({
            _id: groupId,
            admins: userId,
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: "Group not found or you're not an admin" 
            });
        }

        let updateData = {};

        // Handle text updates
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Group name cannot be empty" 
                });
            }
            updateData.name = name.trim();
        }

        if (description !== undefined) {
            updateData.description = description.trim();
        }

        // Handle profile picture upload
        if (req.file) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(req.file.path);
                updateData.groupPic = uploadResponse.secure_url;
                
                // Clean up the temporary file
                fs.unlinkSync(req.file.path);
            } catch (uploadError) {
                // Clean up the temporary file if upload fails
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                throw uploadError;
            }
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            updateData,
            { new: true }
        )
        .populate('members', 'fullName profilePic')
        .populate('admins', 'fullName profilePic')
        .populate('createdBy', 'fullName profilePic');

        // Emit group update to all members
        updatedGroup.members.forEach(member => {
            const memberSocketId = userSocketMap[member._id.toString()];
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.json({ success: true, group: updatedGroup });
    } catch (err) {
        console.error('Update group error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}; 