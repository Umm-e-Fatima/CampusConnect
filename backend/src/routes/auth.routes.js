const router = require('express').Router();
const {
  register,
  verifyOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register',        register);
router.post('/verify-otp',      verifyOTP);
router.post('/login',           login);
router.post('/logout',          authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;