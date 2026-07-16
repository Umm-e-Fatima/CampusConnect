const router = require('express').Router();
const {
  register,
  verifyOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  resendOTP,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register',        register);
router.post('/verify-otp',      verifyOTP);
router.post('/login',           login);
router.post('/logout',          authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.post('/resend-otp', resendOTP);

module.exports = router;