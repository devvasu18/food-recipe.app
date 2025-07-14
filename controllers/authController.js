const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login');
};

exports.getSignup = (req, res) => {
  res.render('auth/signup');
};

exports.postSignup = async (req, res) => {
  const { username, password , name } = req.body;
  await User.create({ username, password , name });
  res.redirect('/login');
};

exports.postLogin = async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.send('Invalid credentials');
  }

  req.session.userId = user._id;
  req.session.user = { name: user.name }; // 👈 store name for welcome toast
  res.redirect('/');
};



exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
