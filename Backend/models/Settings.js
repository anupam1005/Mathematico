const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  site_name: {
    type: String,
    default: 'Mathematico'
  },
  site_description: {
    type: String,
    default: 'Learn Mathematics Online'
  },
  contact_email: {
    type: String,
    default: 'sirramanujan@gmail.com'
  },
  maintenance_mode: {
    type: Boolean,
    default: false
  },
  allow_registration: {
    type: Boolean,
    default: true
  },
  require_email_verification: {
    type: Boolean,
    default: false
  },
  max_file_size: {
    type: Number,
    default: 10
  },
  supported_file_types: {
    type: String,
    default: 'jpg,jpeg,png,pdf,doc,docx'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

module.exports = Settings;
