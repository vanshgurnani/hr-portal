const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    firstName: {
        type: String
    },
    orgId: {
        type: String
    },
    lastName: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    emergencyNumber: {
        type: String
    },
    role: {
        type: [String],
        enum: [DATABASE.ROLES.HR, DATABASE.ROLES.SUPER_ADMIN, DATABASE.ROLES.USER]
    },
    status: {
        type: String,
        enum: [DATABASE.STATUS.ACTIVE, DATABASE.STATUS.INACTIVE],
        default: DATABASE.STATUS.ACTIVE,
        required: true
    },
    imgUrl: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true
    },
    isPasswordReset: {
        type: Boolean,
        default: false,
        required: true
    },
    position: {
        type: String
    },
    employmentStatus: {
        type: String
    },
    department: {
        type: String
    },
    gender: {
        type: String
    },
    dob: {
        type: Date
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    annualLeave: {
        type: Number
    },
    idType: {
        type: String
    },
    idNumber: {
        type: String
    },
    idDoc: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    createdAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        index: true,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    updatedAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        index: true,
        required: true
    }
});


const user = mongoose.model(DATABASE.DATABASE_COLLECTIONS.USER, userSchema);
module.exports = user;
