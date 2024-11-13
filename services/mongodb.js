const mongoose = require("mongoose");
const otp = require("../models/otp");
const user = require("../models/user");
const organisation = require("../models/organisation");
const pattern = require("../models/work_pattern");
const department = require("../models/department");
const attendance = require("../models/attendance");


class DBService {
    constructor() {
        console.log(`Initializing database connection.`);

        this.connect();
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error(`MongoDB connection error: ${error}`);
            process.exit(1);
        }
    }

    async close() {
        await mongoose.connection.close();
        console.log(`Disconnected from MongoDB`);
    }

    getModel(modelName) {
        return mongoose.model(modelName);
    }
}

module.exports = DBService;
