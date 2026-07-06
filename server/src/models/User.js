const mongoose = require('mongoose');

/**
 * Two roles:
 *  - admin: manages media buyer accounts and campaign assignments, sees everything
 *  - media_buyer: sees/receives alerts only for campaigns assigned to them
 */
const ROLES = ['admin', 'media_buyer'];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'media_buyer',
    },
    // Media buyer's own Telegram chat - alerts for their assigned campaigns
    // are sent here instead of a single shared chat.
    telegramChatId: {
      type: String,
      default: '',
    },
    // Media buyer's own bot token (from their own BotFather bot). Fully
    // isolates each buyer's alerts - nobody, including the admin, can read
    // another buyer's messages via a shared bot's getUpdates. Falls back to
    // the shared TELEGRAM_BOT_TOKEN (env) if left blank.
    telegramBotToken: {
      type: String,
      default: '',
    },
    // Rule types this user doesn't want Telegram notifications for, even on
    // campaigns assigned to them. The rule still evaluates and is recorded
    // in AlertHistory (status MUTED) - only the Telegram send is skipped.
    mutedRuleTypes: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
