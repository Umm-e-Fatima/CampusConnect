const crypto=require('crypto');
//generates a random 4 digit pin for book exchange handoff
const generatePIN=()=>String(crypto.randomInt(1000,9999));

//calculates PIN expiry time from now
const getPINExpiry=()=>{
    const expires=new Date();
    expires.setMinutes(expires.getMinutes()+parseInt(process.env.PIN_EXPIRES_MINUTES || 30));
    return expires;
};
module.exports={generatePIN,getPINExpiry};