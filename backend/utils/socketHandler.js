const { Server } = require("socket.io");
const jsonwebtoken = require("jsonwebtoken");
const { User } = require("../schemas");
const { saveMessage } = require("../controllers/messages");
const { getJwtSecret } = require("./authHandler");

let io;
const onlineUsers = new Map(); // userId -> socketId

exports.init = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Using the renamed variable to avoid any global conflict
      const decoded = jsonwebtoken.verify(token, getJwtSecret());
      
      // Ensure we use the correct field from the decoded token
      const userId = decoded.id || decoded.sub;
      if (!userId) {
        return next(new Error("Authentication error: Invalid token structure"));
      }

      const user = await User.findById(userId).select("-password").lean();
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Add to online users
    onlineUsers.set(userId, socket.id);

    // Broadcast updated online list
    broadcastOnlineUsers();

    // Private Message
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content } = data;
        
        // Save to Database via Controller
        const savedMsg = await saveMessage({
          senderId: userId,
          receiverId,
          content,
        });

        // Emit to Receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", {
            ...savedMsg.toObject(),
            sender: {
              _id: socket.user._id,
              username: socket.user.username,
              fullName: socket.user.fullName,
              avatarUrl: socket.user.avatarUrl,
            }
          });
        }

        // Confirm to Sender
        socket.emit("message_sent", savedMsg);
      } catch (err) {
        console.error("Error in send_message:", err.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
      broadcastOnlineUsers();
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

function broadcastOnlineUsers() {
  if (!io) return;
  io.emit("update_online_users", Array.from(onlineUsers.keys()));
}
