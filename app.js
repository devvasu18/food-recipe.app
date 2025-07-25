require('dotenv').config(); // ✅ Load env vars from .env

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const recipeRoutes = require('./routes/recipeRoutes');
const engine = require('ejs-mate');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');

const app = express();

// ✅ View engine setup
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

// ✅ Static files and form data parsing
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// ✅ Use environment variable for MongoDB Atlas URL
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/recipe';

// ✅ Connect to MongoDB
mongoose.connect(mongoUrl)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));



// ✅ Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl }),
}));


// ✅ Global middleware to pass auth info to views
app.use(async (req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.currentUserId = req.session.userId || null;

  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('name');
      res.locals.user = user;
    } catch (err) {
      console.error('Error fetching user for res.locals:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
});



app.use((req, res, next) => {
  const user = req.user || req.session.user;
  res.locals.user = user;
  next();
});


// ✅ Routing
app.use(authRoutes);
app.use('/', recipeRoutes);


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
