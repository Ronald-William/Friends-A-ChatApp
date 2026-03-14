import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import redis from "../config/redis.js"
import {io} from "../server.js"

export const getMyConversations = async (req, res) => {
  try {
    const convos = await Conversation.find({
      participants: req.user._id
    }).populate("participants", "name username");

    // Transform to include 'friend' field for each conversation
    const transformedConvos = convos.map(convo => {
      if (convo.isGroup) {
        return {
          _id: convo._id,
          participants: convo.participants,
          isGroup: true,
          groupName: convo.groupName,
          admin: convo.admin,
          updatedAt: convo.updatedAt
        };
      }

      const friend = convo.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      return {
        _id: convo._id,
        participants: convo.participants,
        isGroup: false,
        friend,
        updatedAt: convo.updatedAt
      };
    });

    res.json({ data: transformedConvos });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { friendUsername } = req.body;
    const currentUserId = req.user._id;

    // Validate input
    if (!friendUsername) {
      return res.status(400).json({
        message: 'Friend username is required'
      });
    }

    // Find the friend by username
    const friend = await User.findOne({
      username: friendUsername.trim()
    }).select('_id username name');

    if (!friend) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Prevent creating conversation with yourself
    if (friend._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        message: 'You cannot create a conversation with yourself'
      });
    }

    // Check if they are friends
    const currentUser = await User.findById(currentUserId);

    if (!currentUser.friends.includes(friend._id)) {
      return res.status(400).json({
        message: 'You can only create conversations with friends. Send a friend request first!'
      });
    }

    // Check if conversation already exists
    const existingConvo = await Conversation.findOne({
      participants: { $all: [currentUserId, friend._id] }
    }).populate('participants', 'username name');

    if (existingConvo) {
      return res.status(200).json({
        message: 'Conversation already exists',
        _id: existingConvo._id,
        participants: existingConvo.participants,
        friend: friend
      });
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: [currentUserId, friend._id]
    });

    await newConversation.save();

    // Populate the conversation before sending
    const populatedConvo = await Conversation.findById(newConversation._id)
      .populate('participants', 'username name');

    res.status(201).json({
      message: 'Conversation created successfully',
      _id: populatedConvo._id,
      participants: populatedConvo.participants,
      friend: friend
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { groupName, memberUsernames } = req.body;
    const currentUserId = req.user._id;
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }
    if (!memberUsernames || !Array.isArray(memberUsernames) || memberUsernames.length === 0) {
      return res.status(400).json({ message: "At least one member is required" });
    }
    const members = await User.find({
      username: { $in: memberUsernames.map(u => u.trim()) }
    }).select("_id username name");

    if (members.length !== memberUsernames.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    const currentUser = await User.findById(currentUserId);
    const nonFriends = members.filter(m => !currentUser.friends.includes(m._id));
    if (nonFriends.length > 0) {
      return res.status(400).json({
        message: `You can only add friends to a group. Not friends with: ${nonFriends.map(u => u.username).join(", ")}`
      })
    }

    const participantIds = [currentUserId, ...members.map(m => m._id)];
    const newGroup = await Conversation.create({
      participants: participantIds,
      isGroup: true,
      groupName: groupName.trim(),
      admin: currentUserId
    })
    const populateGroup = await Conversation.findById(newGroup._id)
      .populate("participants", "username name")
      .populate("admin", "username name")

    
    participantIds.forEach(participantId=>{
      io.to(participantId.toString()).emit("groupCreated",populateGroup);
    })

    res.status(201).json(populateGroup);
  }
  catch (err) {
    console.log("Error create group:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export const addMember = async (req, res) => {
  try {
    const { convoId } = req.params;
    const { username } = req.body;
    const currentUserId = req.user._id;

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Group not found" });
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group conversation" });
    if (convo.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "One the admin can add members" });

    }

    const userToAdd = await User.findOne({ username: username.trim() }).select("_id username name");
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    if (convo.participants.some(p => p.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ message: "User is already in the group" });

    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(userToAdd._id)) {
      return res.status(400).json({ message: "You can only add friends to the group" });

    }

    convo.participants.push(userToAdd._id);
    await convo.save();

    await redis.del(`messages:${convoId}`);

    const updated = await Conversation.findById(convoId)
      .populate("participants", "username name")
      .populate("admin", "username name");

    updated.participants.forEach(p=>{
      io.to(p._id.toString()).emit("groupUpdated", {convoId, action: "memberAdded", group: updated});
    });

    io.to(userToAdd._id.toString()).emit("groupCreated", updated);
    res.json(updated);
  }
  catch (err) {
    console.error("Error adding member", err);
    res.status(500).json({ message: "server error", error: err.message });
  }
}

export const removeMember = async (req, res) => {
  try {
    const { convoId, userId } = req.params;
    const currentUserId = req.user._id;

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Group not found" });
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group conversation" });
    if (convo.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Only the admin can remove members" });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "Admin cannot remove themselves. Disband the group instead." });
    }

    convo.participants = convo.participants.filter(p => p.toString() !== userId);
    await convo.save();

    await redis.del(`messages:${convoId}`);

    const updated = await Conversation.findById(convoId)
      .populate("participants", "username name")
      .populate("admin", "username name");

    const removedUser = await User.findById(userId).select("username"); 
    updated.participants.forEach(p => {
      io.to(p._id.toString()).emit("groupUpdated", { convoId, action: "memberRemoved", username: removedUser.username, group: updated });
    });
 
    // Notify the removed user to remove group from their sidebar
    io.to(userId).emit("groupRemoved", { convoId });

    res.json(updated);
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { convoId} = req.params;
    const currentUserId = req.user._id;
    
    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Group not found" });
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group conversation" });

    if (convo.admin.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: "Admin cannot leave. Disband the group instead." });
    }

    convo.participants = convo.participants.filter(
      p => p.toString() !== currentUserId.toString()
    );
    await convo.save();

    await redis.del(`messages:${convoId}`);
    const updated = await Conversation.findById(convoId)
      .populate("participants", "username name")
      .populate("admin", "username name");

    const removedUser = await User.findById(currentUserId).select("username");
    updated.participants.forEach(p => {
      io.to(p._id.toString()).emit("groupUpdated", { convoId, action: "memberLeft", username: removedUser.username , group: updated });
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const disbandGroup = async (req, res) => {
  try {
    const { convoId } = req.params;
    const currentUserId = req.user._id;

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Group not found" });
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group conversation" });
    if (convo.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Only the admin can disband the group" });
    }
    convo.participants.forEach(p => {
      io.to(p.toString()).emit("groupRemoved", { convoId });
    });

    await Conversation.findByIdAndDelete(convoId);
    await redis.del(`messages:${convoId}`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error disbanding group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};