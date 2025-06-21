import cloudinary from "../Lib/cloudinary.js";
import { generateToken } from "../Lib/utils.js";
import User from "../model/user.js";
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

// Validation middleware for signup
export const validateSignup = [
  body('fullName').trim().escape().isLength({ min: 2, max: 50 }).withMessage('Full name must be 2-50 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 chars'),
];

// Validation middleware for login
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 chars'),
];

// User SignUp
export const signup = async (req, res) => {
  // Validate and sanitize
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);
    res.json({
      success: true,
      userData: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        bio: newUser.bio,
        profilePic: newUser.profilePic
      },
      token,
      message: "Account created successfully",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// User Login
export const login = async (req, res) => {
  // Validate and sanitize
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);
    res.json({
      success: true,
      userData: {
        _id: userData._id,
        fullName: userData.fullName,
        email: userData.email,
        bio: userData.bio,
        profilePic: userData.profilePic
      },
      token,
      message: "Login successful",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// Check Auth
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Update Profile
export const UpdateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    let updateData = { fullName, bio };

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "profilePics",
      });
      updateData.profilePic = upload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
