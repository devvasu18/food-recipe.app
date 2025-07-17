const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  ingredients: { type: [String], required: true },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: Number
  }],
  reviews: [
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String, // So you don't have to query User model again
    content: String,
    rating: Number,
    createdAt: { type: Date, default: Date.now }
  }
],
  steps: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Desserts'], required: true }
});

module.exports = mongoose.model('Recipe', recipeSchema);