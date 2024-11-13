const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const patternSchema = new Schema({
    orgId: {
        type: String
    },
    name: {
        type: String
    },
    tardinessTolerance: {
        type: Number
    },
    weekdays: [{
        name: {
            type: String
        },
        workPattern: {
            type: String
        },
        clockIn: {
            type: Date
        },
        clockOut: {
            type: Date
        },
        break: {
            type: Date
        },
        afterBreak: {
            type: Date
        },
        maxBreakMinutes: {
            type: Number
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
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
    },
    updatedAt_EP: {
        type: Number,
        default: Date.now() / 1000,
        index: true,
        required: true
    }
});

const pattern = mongoose.model(DATABASE.DATABASE_COLLECTIONS.WORK_PATTERN, patternSchema);
module.exports = pattern;