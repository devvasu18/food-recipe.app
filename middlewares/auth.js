exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};
// middleware/auth.js
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next(); // user is logged in
  }
  res.redirect('/login'); // not logged in
};
