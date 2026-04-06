const Message = require("../schemas/messages");

/**
 * Save a new message to the database
 * Returns the message document or error
 */
exports.saveMessage = async (data) => {
  try {
    const newMessage = new Message({
      sender: data.senderId,
      receiver: data.receiverId,
      content: data.content,
    });
    return await newMessage.save();
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (userId, contactId, limit = 50, skip = 0) => {
  try {
    return await Message.find({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username fullName avatarUrl")
      .populate("receiver", "username fullName avatarUrl");
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
exports.markAsRead = async (userId, contactId) => {
  try {
    return await Message.updateMany(
      { sender: contactId, receiver: userId, isRead: false },
      { $set: { isRead: true, status: "read" } }
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};
