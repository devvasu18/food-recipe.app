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

const app = express();

// ✅ View engine setup
app.engine('ejs', engine);
app.set('view engine', 'ejs');
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
  store: MongoStore.create({ mongoUrl })
}));

// ✅ Global middleware to pass auth info to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.currentUserId = req.session.userId || null;
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});




// ✅ Routing
app.use(authRoutes);
app.use('/', recipeRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
