const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const path = require('path');
const controller = require('../controllers/recipeController');
const { isAuthenticated } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

 function addUserRating(recipes, userId) {
  return recipes.map(recipe => {
    const userRating = userId ? recipe.ratings.find(r => r.userId?.toString() === userId) : null;
    const validRatings = recipe.ratings.filter(r => r.userId && typeof r.value === 'number' && !isNaN(r.value));
    const avgRating = validRatings.length
      ? validRatings.reduce((sum, r) => sum + r.value, 0) / validRatings.length
      : 0;
    return {
      ...recipe.toObject(),
      avgRating: avgRating.toFixed(1),
      userRating: userRating?.value || 0
    };
  });
}


// Home page with filters and pagination
router.get('/', async (req, res) => {


  const { search, category, sort } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 6;

  const query = {};
  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;

  const sortOption = {};
  if (sort === 'asc') sortOption.price = 1;
  else if (sort === 'desc') sortOption.price = -1;

  try {
    const totalFilteredRecipes = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const userId = req.session.user?._id?.toString();
    const recipesWithRatings = addUserRating(recipes, userId);
    const totalPages = Math.ceil(totalFilteredRecipes / limit);

    res.render('recipes/index', {
      recipes: recipesWithRatings,
      currentPage: page,
      totalPages,
      showPagination: totalPages > 1,
      searchQuery: search || '',
      selectedCategory: category || '',
      selectedSort: sort || '',
      showMessage: recipes.length === 0,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal server error');
  }
});
// Single recipe detail page
router.get('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send('Recipe not found');

    const avgRating = recipe.ratings.length
      ? recipe.ratings.reduce((sum, r) => sum + r.value, 0) / recipe.ratings.length
      : 0;

    const userId = req.session.userId;
    const userRating = userId
      ? recipe.ratings.find(r => r.userId?.toString() === userId)
      : null;


    res.render('recipes/detail', {
      recipe: {
        ...recipe.toObject(),
        avgRating: avgRating.toFixed(1),
        userRating: userRating?.value || null
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

router.post('/recipes/:id/review', isAuthenticated, async (req, res) => {
  const { content} = req.body;
  const userId = req.session.userId;

  if (!content) {
    return res.json({ success: false, message: 'Content and rating required' });
  }

  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    recipe.reviews.push({
      userId,
      userName: res.locals.user.name,
      content,
   
    });

    await recipe.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});


// Add new recipe page
router.get('/add', isAuthenticated, controller.getAddPage);
router.post('/add', isAuthenticated, upload.single('image'), controller.postRecipe);

// Edit recipe
router.get('/recipes/edit/:id', isAuthenticated, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.redirect('/my-recipes');
  res.render('recipes/edit', { recipe });
});

router.post('/recipes/edit/:id', isAuthenticated, async (req, res) => {
  const { title, price, image, ingredients, steps } = req.body;
  await Recipe.findByIdAndUpdate(req.params.id, { title, price, image, ingredients, steps });
  res.redirect('/my-recipes');
});

// Delete recipe
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Recipe.deleteOne({ _id: req.params.id, user: req.session.userId });
    res.redirect('/my-recipes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not delete recipe');
  }
});

// Rating logic
// routes/recipeRoutes.js

router.post('/rate/:id', isAuthenticated, async (req, res) => {
  const { rating } = req.body;
  const parsedRating = parseInt(rating);

  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: 'Invalid rating value' });
  }

  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existingRating = recipe.ratings.find(r => r.userId?.toString() === userId);

    if (existingRating) {
      existingRating.value = parsedRating;
    } else {
      recipe.ratings.push({ userId, value: parsedRating });
    }

    await recipe.save();

    const validRatings = recipe.ratings.filter(r => r.userId && typeof r.value === 'number');
    const avgRating = validRatings.length
      ? validRatings.reduce((sum, r) => sum + r.value, 0) / validRatings.length
      : 0;

    res.json({
      message: existingRating ? 'Already rated' : 'Rating saved',
      avgRating: avgRating.toFixed(1),
      userRating: parsedRating
    });

  } catch (err) {
    console.error("Error in rating logic:", err);
    res.status(500).json({ message: 'Internal error' });
  }
});



// Orders
router.get('/orders', isAuthenticated, controller.getOrders);
router.post('/order/:id', controller.addToOrder);
router.post('/order/delete/:id', controller.removeOrder);

// My recipes
router.get('/my-recipes', isAuthenticated, controller.getMyRecipes);

// About page
router.get('/about', controller.getAboutPage);

// Fuzzy search
router.get('/search', async (req, res) => {
  const query = req.query.query || '';
  const regex = new RegExp(query.split('').join('.*'), 'i');

  try {
    const recipes = await Recipe.find({ title: regex }).limit(10);

    const userId = req.session.user?._id?.toString() || req.session.user?.id?.toString();

    const recipesWithRatings = recipes.map(recipe => {
      const userRating = userId
        ? recipe.ratings.find(r => r.userId?.toString() === userId)
        : null;

      const avgRating = recipe.ratings.length
        ? recipe.ratings.reduce((sum, r) => sum + r.value, 0) / recipe.ratings.length
        : 0;

      return {
        ...recipe.toObject(),
        avgRating: avgRating.toFixed(1),
        userRating: userRating?.value || null
      };
    });

    res.json(recipesWithRatings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});


module.exports = router;
