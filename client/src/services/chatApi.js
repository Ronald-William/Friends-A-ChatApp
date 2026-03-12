import api from "./api";

export const getConversations = () => api.get("/conversations");

export const createConversation = (friendUsername) =>
  api.post("/conversations", { friendUsername });

export const getMessages = (convoId) => api.get(`/messages/${convoId}`);

export const sendMessage = (data) => api.post("/messages", data);

export const getUnreadCounts = () => api.get("/messages/unread");

export const markConversationAsRead = (convoId) =>
  api.post(`/messages/${convoId}/read`);

export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`);

export const createGroup = (groupName, memberUsernames) =>
  api.post("/conversations/group", { groupName, memberUsernames });

export const addGroupMember = (convoId, username) =>
  api.post(`/conversations/${convoId}/members`, { username });

export const removeGroupMember = (convoId, userId) =>
  api.delete(`/conversations/${convoId}/members/${userId}`);

export const leaveGroup = (convoId) =>
  api.post(`/conversations/${convoId}/leave`);

export const disbandGroup = (convoId) =>
  api.delete(`/conversations/${convoId}`);