import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import redis from "./config/redis.js";
import http from "http";
import { Server } from "socket.io";

const myServer = http.createServer(app);

export const io = new Server(myServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("connected:", socket.id);
  
  let currentUserId = null; // Track user for this socket

  socket.on("joinUser", async (userId) => {
    console.log(`User ${userId} joined their personal room`);
    socket.join(userId);
    currentUserId = userId; // Store for disconnect
    
    // Mark user as online in Redis (expires in 5 minutes)
    await redis.setex(`online:${userId}`, 360, Date.now().toString());
    
    // Get all currently online users
    const onlineKeys = await redis.keys('online:*');
    const onlineUserIds = onlineKeys.map(key => key.replace('online:', ''));
    
    // Send current online users to this newly connected user
    socket.emit("initialOnlineUsers", onlineUserIds);
    
    // Notify all OTHER connected clients that this user is online
    socket.broadcast.emit("userOnline", userId);
    
    console.log(`✓ User ${userId} is now online. Total online: ${onlineUserIds.length}`);
  });

  socket.on("joinConversation", (convoId) => {
    console.log(`Socket ${socket.id} joined conversation: ${convoId}`);
    socket.join(convoId);
  });

  socket.on("leaveConversation", (convoId) => {
    console.log(`Socket ${socket.id} left conversation: ${convoId}`);
    socket.leave(convoId);
  });

  // Heartbeat to keep user online
  socket.on("heartbeat", async (userId) => {
    await redis.setex(`online:${userId}`, 360, Date.now().toString());
  });

  
  socket.on("typing", async ({ conversationId, userId, username }) => {
    console.log(`User ${username} is typing in conversation ${conversationId}`);
    
    // Store in Redis with 3-second expiry
    await redis.setex(
      `typing:${conversationId}:${userId}`,
      3, // Expires in 3 seconds
      username
    );
    
    // Notify others in the conversation (except sender)
    socket.to(conversationId).emit("userTyping", {
      conversationId,
      userId,
      username
    });
  });

  socket.on("stopTyping", async ({ conversationId, userId }) => {
    console.log(`User ${userId} stopped typing in conversation ${conversationId}`);
    
    // Remove from Redis immediately
    await redis.del(`typing:${conversationId}:${userId}`);
    
    // Notify others
    socket.to(conversationId).emit("userStoppedTyping", {
      conversationId,
      userId
    });
  });

  socket.on("disconnect", async () => {
    console.log("disconnected:", socket.id);
    
    // Remove user from online status
    if (currentUserId) {
      await redis.del(`online:${currentUserId}`);
      socket.broadcast.emit("userOffline", currentUserId);
      console.log(`✓ User ${currentUserId} is now offline`);
      
      // Clean up any typing indicators for this user
      const typingKeys = await redis.keys(`typing:*:${currentUserId}`);
      if (typingKeys.length > 0) {
        await redis.del(...typingKeys);
      }
    }
  });
});

const start = async () => {
  await connectDB();

  myServer.listen(process.env.PORT || 5000, () => {
    console.log("server running");
  });
};

start();