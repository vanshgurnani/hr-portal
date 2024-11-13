const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const attendanceSchema = new Schema({
    idealUrl: {
        type: String
    },
    currentUrl: {
        type: String
    },
    userEmail: {
        type: String
    },
    orgId: {
        type: String
    },
    attendanceTime: {
        type: Date,
        default: Date.now,  // Automatically set to current date and time
    },
    status: {
        type: String,
        enum: [DATABASE.STATUS.PRESENT, DATABASE.STATUS.ABSENT], // Can be "Present" or "Absent"
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        index: true,
    }
});

const attendance = mongoose.model(DATABASE.DATABASE_COLLECTIONS.ATTENDANCE, attendanceSchema);
module.exports = attendance;