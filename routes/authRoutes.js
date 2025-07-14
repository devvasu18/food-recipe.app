const router = require('express').Router();
const authController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');



router.get('/login',
  (req, res) => {
    res.render('auth/login', { errors: [], oldInput: {} });
  });
router.post('/login',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.postLogin
);

router.get('/signup', (req, res) => {
  res.render('auth/signup', { errors: [], oldInput: {} });
});

router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/signup', { errors: errors.array(), oldInput: req.body });
  }

  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.render('auth/signup', {
      errors: [{ msg: 'User already exists' }],
      oldInput: req.body
    });
  }

  authController.postSignup(req, res);
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});


module.exports = router;
