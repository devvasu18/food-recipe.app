const Recipe = require('../models/Recipe');
const Order = require('../models/order');
const User = require('../models/User');

exports.getHome = async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;

  const user = req.user || req.session.user; // Make sure user is defined!



  const query = q ? { title: { $regex: q, $options: 'i' } } : {};
  const totalRecipes = await Recipe.countDocuments(query);

  const recipes = await Recipe.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.render('recipes/index', {
    recipes,
    currentPage: page,
    totalPages: Math.ceil(totalRecipes / limit),
    selectedCategory: req.query.category || '',
    selectedSort: req.query.sort || '',
    searchQuery: q || "",
    user
  });
};


exports.getAddPage = (req, res) => {
  res.render('recipes/add', { title: 'Add Recipe' });
};



exports.getAboutPage = (req, res) => {
  res.render('about', { title: 'About' });
};


exports.postRecipe = async (req, res) => {
  try {
   

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const { title, ingredients, steps, price, category } = req.body;

    const recipe = new Recipe({
      title,
      ingredients: ingredients.split(','),
      steps,
      price,
      category,
      image: req.file.filename,
      user: req.session.userId
    });

    await recipe.save();
    res.redirect('/my-recipes');
  } catch (err) {
    console.error(err);
    res.send('Error creating recipe');
  }
};


exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    const user = req.user || req.session.user;


    res.render('recipes/index', {
      recipes,
      user,
      searchQuery: req.query.search || '',
      selectedCategory: req.query.category || '',
      selectedSort: req.query.sort || '',
      currentPage: 1,
      totalPages: 1,
      showPagination: false
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};



exports.getRecipe = async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  const user = req.user;
};


exports.deleteRecipe = async (req, res) => {
  await Recipe.findByIdAndDelete(req.params.id);
  res.redirect('/');
};

exports.getMyRecipes = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const recipes = await Recipe.find({ user: req.session.userId }).sort({ createdAt: -1 });
  res.render('recipes/my-recipes', { title: 'My Recipes', recipes });
};



// ✅ Final working version of order functions

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId }).populate('recipe').sort({ createdAt: -1 });
    res.render('orders/orders', { title: 'Orders', orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.addToOrder = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send('Recipe not found');

    await Order.create({
      recipe: recipe._id,
      user: req.session.userId // if you're tracking orders by user
    });

    res.redirect('/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


exports.removeOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect('/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting order');
  }
};


exports.getEditPage = async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  res.render('edit', { title: 'Edit Recipe', recipe });
};

exports.postEditRecipe = async (req, res) => {
  const { title, image, price, ingredients, steps } = req.body;
  await Recipe.findByIdAndUpdate(req.params.id, {
    title,
    image,
    price: parseFloat(price),
    ingredients: ingredients.split(','),
    steps
  });
  res.redirect('/my-recipes');
};


