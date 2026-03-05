import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { io } from "../server.js";
import redis from "../config/redis.js"

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ 
        message: "conversationId and text are required" 
      });
    }

    // Verify conversation exists and user is a participant
    const convo = await Conversation.findById(conversationId);
    
    if (!convo) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = convo.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        message: "You are not a participant in this conversation" 
      });
    }

    // Create the message
    const message = await Message.create({
      conversation: convo._id,
      sender: req.user._id,
      text
    });

    const otherParticipants = convo.participants.filter(
      p=>p.toString() !== req.user._id.toString()

    );
    for(const participantId of otherParticipants){
      const key = `unread:${participantId}:${conversationId}`;
      const newCount = await redis.incr(key);

      io.to(participantId.toString()).emit("unreadCountUpdate",{
        conversationId,
        count: newCount
      });
    }

    // Emit socket event to all participants
    io.to(convo._id.toString()).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { convoId } = req.params;

    // Verify conversation exists and user is a participant
    const convo = await Conversation.findById(convoId);
    
    if (!convo) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = convo.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        message: "You are not a participant in this conversation" 
      });
    }

    const msgs = await Message.find({
      conversation: convoId
    })
    .populate("sender", "username name")
    .sort({ createdAt: 1 });

    res.json(msgs);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

export const markAsRead = async(req,res)=>{
  try{
    const {convoId} = req.params;
    const userId = req.user._id;

    const key =  `unread:${userId}:${convoId}`;
    await redis.del(key);
    res.json({success: true});
  }
  catch(error){
    console.log("Error marking as read:", error);
    res.status(500).json({messsage: "server error", error: error.message});
  }
}

export const getUnreadCounts = async(req,res)=>{
  try{
    const userId = req.user._id;
    const keys = await redis.keys(`unread:${userId}:*`);
    const counts = {};
    if(keys.length > 0){
      const values = await redis.mget(...keys);
      keys.forEach((key,i)=>{
        const conversationId = key.split(":")[2];
        counts[conversationId] = parseInt(values[i]) || 0;
      })
    }
    res.json(counts);
  }
  catch(error){
    console.log("Error fetching unread counts: ", error);
    res.status(500).json({message: "Server Error", error: error.message});
  }
}