const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const path = require('path');
const controller = require('../controllers/recipeController');
const {isAuthenticated} = require('../middlewares/auth');
const {isLoggedIn} = require('../middlewares/auth');
const upload = require('../middlewares/upload');


router.get('/', async (req, res) => {
  const { search, category, sort } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 4;

  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (category) {
    query.category = category;
  }

  const sortOption = {};
  if (sort === 'asc') sortOption.price = 1;
  else if (sort === 'desc') sortOption.price = -1;

  const totalRecipes = await Recipe.countDocuments(query);
  const totalPages = Math.ceil(totalRecipes / limit);
const hasFilter = (search?.trim() || category?.trim() || sort?.trim()) ? true : false;
  const recipes = await Recipe.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  res.render('recipes/index', {
    recipes,
    currentPage: page,
    totalPages,
    searchQuery: search || '',
    selectedCategory: category || '',
    selectedSort: sort || '',
    showMessage: (search || category || sort) && recipes.length === 0
  });
});




router.get('/orders', isAuthenticated, controller.getOrders);
router.post('/order/:id', controller.addToOrder);
router.post('/order/delete/:id', controller.removeOrder);
router.get('/add', isAuthenticated,  controller.getAddPage);
router.post('/add', isAuthenticated, upload.single('image'), controller.postRecipe);
router.get('/about', controller.getAboutPage);
router.get('/recipe/:id', controller.getRecipe);
router.get('/my-recipes', isAuthenticated, controller.getMyRecipes);
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Recipe.deleteOne({ _id: req.params.id, user: req.session.userId });
    res.redirect('/my-recipes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not delete recipe');
  }
});

router.get('/recipes/edit/:id', isAuthenticated, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.redirect('/my-recipes');
  res.render('recipes/edit', { recipe });
});
router.post('/recipes/edit/:id', isAuthenticated, async (req, res) => {
  const { title, price, image, ingredients, steps } = req.body;
  await Recipe.findByIdAndUpdate(req.params.id, {
    title,
    price,
    image,
    ingredients,
    steps,
  });
  res.redirect('/my-recipes');
});

// Fuzzy search using regex
router.get('/search', async (req, res) => {
  const query = req.query.query || '';

  // Convert to case-insensitive regex, match start of string
  const regex = new RegExp(query.split('').join('.*'), 'i');

  try {
    const recipes = await Recipe.find({ title: regex }).limit(10);
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;


