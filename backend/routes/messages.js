const express = require("express");
const router = express.Router();
const { getChatHistory, markAsRead } = require("../controllers/messages");
const { requireAuth } = require("../utils/authHandler");

/**
 * @route   GET /api/v1/messages/history/:contactId
 * @desc    Get chat history between current user and specified contact
 * @access  Private
 */
router.get("/history/:contactId", requireAuth, async (req, res, next) => {
  try {
    const history = await getChatHistory(req.user.id, req.params.contactId);
    
    // Mark as read when opening chat
    await markAsRead(req.user.id, req.params.contactId);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
