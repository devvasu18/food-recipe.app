// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
