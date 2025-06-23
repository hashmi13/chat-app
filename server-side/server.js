// ... your imports

// Create express app and server
const app = express();
const server = http.createServer(app);

// CORS and JSON middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());

// Set up Socket.IO
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

export const userSocketMap = {};
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log('User connected:', userId);
  if (userId) userSocketMap[userId] = socket.id;

  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('disconnect', () => {
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

// Connect to MongoDB
connctDB();

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/group', groupRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.static(path.join(__dirname, '../client-side/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client-side/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server is running on port:" + PORT );
});
