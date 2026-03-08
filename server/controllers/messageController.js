import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { io } from "../server.js";
import redis from "../config/redis.js";

const CACHE_TTL = 3600; // 1 hour
const CACHE_LIMIT = 50; // cache last 50 messages

const getCacheKey = (conversationId) => `messages:${conversationId}`;

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ message: "conversationId and text are required" });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = convo.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: "You are not a participant in this conversation" });

    const message = await Message.create({
      conversation: convo._id,
      sender: req.user._id,
      text
    });

    // Populate sender so cache stays consistent with getMessages response
    const populatedMessage = await Message.findById(message._id).populate("sender", "username name");

    // Append to cache if it exists
    const cacheKey = getCacheKey(conversationId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      const messages = JSON.parse(cached);
      messages.push(populatedMessage);
      // Keep only last CACHE_LIMIT messages
      if (messages.length > CACHE_LIMIT) messages.splice(0, messages.length - CACHE_LIMIT);
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(messages));
      console.log(`✓ Cache updated for conversation: ${conversationId}`);
    }

    // Increment unread count for all participants except sender
    const otherParticipants = convo.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      const key = `unread:${participantId}:${conversationId}`;
      const newCount = await redis.incr(key);
      io.to(participantId.toString()).emit("unreadCountUpdate", { conversationId, count: newCount });
    }

    io.to(convo._id.toString()).emit("newMessage", populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { convoId } = req.params;

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = convo.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: "You are not a participant in this conversation" });

    // Check cache first
    const cacheKey = getCacheKey(convoId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`✓ Cache hit for conversation: ${convoId}`);
      return res.json(JSON.parse(cached));
    }

    // Cache miss — query MongoDB
    console.log(`✗ Cache miss for conversation: ${convoId}`);
    const msgs = await Message.find({ conversation: convoId })
      .populate("sender", "username name")
      .sort({ createdAt: 1 })
      .limit(CACHE_LIMIT);

    // Store in cache
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(msgs));
    console.log(`✓ Cache set for conversation: ${convoId}`);

    res.json(msgs);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { convoId } = req.params;
    const key = `unread:${req.user._id}:${convoId}`;
    await redis.del(key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const keys = await redis.keys(`unread:${userId}:*`);
    const counts = {};

    if (keys.length > 0) {
      const values = await redis.mget(...keys);
      keys.forEach((key, i) => {
        const conversationId = key.split(":")[2];
        counts[conversationId] = parseInt(values[i]) || 0;
      });
    }

    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    const conversationId = message.conversation.toString();
    await Message.findByIdAndDelete(messageId);

    // Remove from cache if it exists
    const cacheKey = getCacheKey(conversationId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      const messages = JSON.parse(cached);
      const filtered = messages.filter(m => m._id.toString() !== messageId);
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(filtered));
      console.log(`✓ Cache updated after delete for conversation: ${conversationId}`);
    }

    io.to(conversationId).emit("messageDeleted", { messageId, conversationId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};