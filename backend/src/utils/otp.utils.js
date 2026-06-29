const crypto=require('crypto');
//generate a random 6 digit otp
const generateOTP=()=>String(crypto.randomInt(100000, 999999));
//checks if otp has passed its expiry time
const isOTPExpired = (expiresAt)=>new Date() > new Date(expiresAt);
module.exports={generateOTP,isOTPExpired};