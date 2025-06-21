import mongoose from 'mongoose'

export const connctDB = async() => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        mongoose.connection.on('connected', () => console.log("Database connected"));
        mongoose.connection.on('error', (err) => console.log("Database connection error:", err));
        
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Successfully connected to MongoDB");
    } catch(error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}