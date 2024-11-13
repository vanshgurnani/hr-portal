const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const departmentSchema = new Schema({
    hrEmail: {
        type: String
    },
    orgId: {
        type: String
    },
    name: {
        type: String
    },
    latePenalty: {
        type: Boolean
    },
    workPattern: {
        type: String
    },
    noteOnAttendanceIn: {
        type: String
    },
    noteOnAttendanceOut: {
        type: String
    },
    noteOnOvertimeClockIn: {
        type: String
    },
    noteOnOvertimeClockOut: {
        type: String
    },
    supervisor: {
        type: String
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

const department = mongoose.model(DATABASE.DATABASE_COLLECTIONS.DEPARTMENT, departmentSchema);
module.exports = department;