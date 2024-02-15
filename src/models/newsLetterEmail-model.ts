const mongoose = require('mongoose');

const newsletterEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures each email is unique in the collection
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const NewsletterEmail = mongoose.model('NewsletterEmail', newsletterEmailSchema);

module.exports = NewsletterEmail;
