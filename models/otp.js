const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
    },
    username: {
        type: String
    },
    otp: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: [DATABASE.OTP_TYPE.PASSWORD_RESET, DATABASE.OTP_TYPE.FORGOT_PASSWORD, DATABASE.OTP_TYPE.REGISTER]
    },
    status: {
        type: String,
        enum: [DATABASE.STATUS.ACTIVE , DATABASE.STATUS.INACTIVE],
        default: DATABASE.STATUS.ACTIVE,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    createdAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        required: true,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    updatedAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        required: true,
        index: true
    },
});

const otps = mongoose.model(DATABASE.DATABASE_COLLECTIONS.OTP, otpSchema);
module.exports = otps;