const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isMarkdown: {
    type: Boolean,
    default: false
  },
  onlyMe: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    path: String
  }]
});

module.exports = mongoose.model('Post', PostSchema);