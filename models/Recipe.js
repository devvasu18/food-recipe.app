const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  ingredients: { type: [String], required: true },
  steps: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  user: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
  category: {type: String,enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Desserts'],required: true}
});

module.exports = mongoose.model('Recipe', recipeSchema);
