const mongoose = require('mongoose');
const crypto = require('crypto'); 

module.exports.validateRequestBody = async (body, keys) => {
    try {
        let missingKeys = [];
        let payload = {};

        for (const keyObj of keys) {
            const key = keyObj.property;
            const value = body[key];

            if (!value && !keyObj.optional) {
                missingKeys.push(key);
            } else if (value !== undefined) {
                payload[key] = value;
            }
        }

        if (missingKeys.length > 0) {
            const missingKeyString = missingKeys.join(', ');
            throw new Error(`Please provide the following key(s): ${missingKeyString}`);
        }
        return payload;
    } catch (error) {
        console.log(`Error occurred validating request body - ${JSON.stringify(body)}, keys - ${JSON.stringify(keys)} & error - ${error}`);
        throw error;
    }
};

module.exports.throwCustomError = (errorMessage) => {
    throw new Error(errorMessage);
};

module.exports.generateRandomNumber = (length) => {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};

module.exports.getFormattedDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    
    console.log(`[getFormattedDate] Converting Date - ${date} to ${day}/${month}/${year}`);
    return { day, month, year, format: `${day}/${month}/${year}` }
}

module.exports.createEpoch = (day, month, year) => {
    return new Date(year, month - 1, day, 0, 0, 0, 0).getTime(); // Set hours, minutes, etc. to 0
}

module.exports.generateRandomObjectId = () => {
  const buffer = crypto.randomBytes(12); // Generate 12 random bytes
  const hexString = buffer.toString('hex'); // Convert to hexadecimal string
  return new mongoose.Types.ObjectId(hexString);
}
 
module.exports.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

module.exports.convertToIST = (date) => {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    return new Date(date.getTime() + istOffset);
};

module.exports.passwordGenerator = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }
    return password;
}