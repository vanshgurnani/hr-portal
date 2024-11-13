const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const organisationSchema = new Schema({
    hrEmail: {
        type: String
    },
    email: {
        type: String,
        required: true, 
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: [DATABASE.STATUS.ACTIVE, DATABASE.STATUS.INACTIVE],
        default: DATABASE.STATUS.ACTIVE
    },
    countryCode: {
        type: Number
    },
    phoneNumber: {
        type: Number
    },
    imgUrl: {
        type: String
    },
    location: {
        type: String
    },
    pincode: {
        type: Number
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    webLink: {
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

const organisation = mongoose.model(DATABASE.DATABASE_COLLECTIONS.ORGANISATION, organisationSchema);
module.exports = organisation;