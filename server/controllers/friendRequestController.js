import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { clearUserCache } from "../config/redis.js";
// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    const currentUserId = req.user._id;

    // Validate input
    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      });
    }

    // Find the target user
    const targetUser = await User.findOne({
      username: username.trim()
    });

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Prevent sending request to yourself
    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        message: 'You cannot send a friend request to yourself'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already friends
    if (currentUser.friends.includes(targetUser._id)) {
      return res.status(400).json({
        message: 'You are already friends with this user'
      });
    }

    // Check if request already sent
    if (targetUser.friendRequests.includes(currentUserId)) {
      return res.status(400).json({
        message: 'Friend request already sent'
      });
    }

    // Check if target user already sent you a request
    if (currentUser.friendRequests.includes(targetUser._id)) {
      return res.status(400).json({
        message: 'This user has already sent you a friend request. Check your requests!'
      });
    }

    // Add friend request
    targetUser.friendRequests.push(currentUserId);
    await targetUser.save();

    res.status(200).json({
      message: 'Friend request sent successfully',
      username: targetUser.username
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get incoming friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests', 'username name email');

    res.json(user.friendRequests || []);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const requester = await User.findById(requesterId);

    console.log("friendRequests:", currentUser.friendRequests);
    console.log("requesterId:", requesterId);
    if (!requester) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if request exists
    if (!currentUser.friendRequests.includes(requesterId)) {
      return res.status(400).json({
        message: 'No friend request from this user'
      });
    }

    // Remove from friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== requesterId
    );

    // Add to friends (bidirectional)
    if (!currentUser.friendRequests.some(id => id.toString() === requesterId)) {
      currentUser.friends.push(requesterId);
    }

    if (!requester.friends.includes(currentUserId)) {
      requester.friends.push(currentUserId);
    }

    await currentUser.save();
    await requester.save();
    await clearUserCache(currentUserId);
    await clearUserCache(requesterId);
    // Create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, requesterId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, requesterId]
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username name');

    res.status(200).json({
      message: 'Friend request accepted',
      friend: {
        _id: requester._id,
        username: requester.username,
        name: requester.name
      },
      conversation: populatedConversation
    });

  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    // Check if request exists
    if (!currentUser.friendRequests.some(id => id.toString() === requesterId)) {
      return res.status(400).json({
        message: 'No friend request from this user'
      });
    }

    // Remove from friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== requesterId
    );

    await currentUser.save();
    await clearUserCache(currentUserId)

    res.status(200).json({
      message: 'Friend request rejected'
    });

  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all friends
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username name email');

    res.json(user.friends || []);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Remove from both users' friends lists
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== friendId
    );

    friend.friends = friend.friends.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await friend.save();

    res.status(200).json({
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};