const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
exports.getLogin = (req, res) => {
  res.render('auth/login');
};

exports.getSignup = (req, res) => {
  res.render('auth/signup');
};

exports.postSignup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    await User.create({ email, password, name });
    res.redirect('/login');
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate email error
      return res.render('auth/signup', {
        errors: [{ msg: 'Email already exists' }],
        oldInput: req.body
      });
    }
    console.error(err);
    res.send('Something went wrong');
  }
};

exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { errors: errors.array(), oldInput: req.body });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.render('auth/login', { errors: [{ msg: 'User does not exist' }], oldInput: req.body });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render('auth/login', { errors: [{ msg: 'Incorrect password' }], oldInput: req.body });
  }

  req.session.userId = user._id;
  req.session.user = { name: user.name };
  res.redirect('/');
};



exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
