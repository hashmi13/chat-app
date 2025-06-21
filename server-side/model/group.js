import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        default: "" 
    },
    groupPic: { 
        type: String, 
        default: "" 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    admins: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
export default Group; 