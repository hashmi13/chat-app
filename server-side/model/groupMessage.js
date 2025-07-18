import mongoose from 'mongoose'

const groupMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String
    },
    image: {
        type: String
    },
    seenBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        seenAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
export default GroupMessage; 