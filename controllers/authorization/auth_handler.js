const jwtService = require("../../middleware/jwt");
const dbUtils = require("../../utils/db_operations");
const commonUtils = require("../../utils/common");
const s3Utils = require("../../utils/s3");
const configs = require("../../configs.json");
const emailService = require("../../services/email_service");
const templates = require("../../utils/templates");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.validateOtp = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!email || !type) {
            return res.status(400).json({
                type: "Error",
                message: "Username and type are required.",
            });
        }

        // Check if the user exists in the `USER` collection
        const user = await dbUtils.findOne(
            {
                email: email 
            },
            DATABASE_COLLECTIONS.USER
        );

        // If user is found, return an error saying user already exists
        if (user) {
            return res.status(400).json({ type: "Error", message: "User already exists." });
        }

        // Generate a new OTP
        const otpNumber = commonUtils.generateRandomNumber(configs.OTP_LENGTH);

        // Save the new OTP to the database
        const newOtp = await dbUtils.create(
            {
                email: email, // Assuming username here is an email
                type: type,
                otp: otpNumber,
                status: configs.CONSTANTS.STATUS.ACTIVE,
            },
            DATABASE_COLLECTIONS.OTP
        );

        if (!newOtp) {
            throw new Error("Failed to generate OTP.");
        }

        // Send the OTP via email
        const emailSubject = "Reset Your Password";
        const emailHtml = templates.sendOtpEmailTemplate(otpNumber);
        const emailSent = await emailService.sendMail(
            email,
            emailSubject,
            "OTP SENT MAIL",
            emailHtml
        );

        if (!emailSent) {
            throw new Error("Failed to send OTP email.");
        }

        res.status(200).json({
            type: "Success",
            message: `OTP sent to ${email} successfully.`,
        });
    } catch (error) {
        console.error(`[validateOtp] Error occurred: ${error.message || error}`);

        const errorMessage = error.message.includes("User already exists") ? "User already exists." :
            error.message.includes("Failed to generate OTP") ? "An error occurred while generating the OTP. Please try again." :
            error.message.includes("Failed to send OTP email") ? "An error occurred while sending the OTP email. Please try again." :
            "An unexpected error occurred. Please try again later.";

        res.status(500).json({ type: "Error", message: errorMessage });
    }
};


module.exports.registerHandler = async (req, res) => {
    try {
        // Step 1: Fetch email from request body and validate required field
        const requiredFields = [{ property: "email", optional: false }, { property: "otp", optional: false }];
        let data = await commonUtils.validateRequestBody(req.body, requiredFields);

        // Step 2: Check if a user with this email already exists
        const findKey = { email: data.email };
        const existingUser = await dbUtils.findOne(findKey, DATABASE_COLLECTIONS.USER, { email: 1, _id: 1 });
        if (existingUser) {
            const errorMessage = `${data.email} is already registered.`;
            return res.status(400).json({ type: "error", message: errorMessage });
        }

        // Step 3: Validate OTP
        const pipeline = [
            {
                $match: {
                    email: data.email,
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by creation time in descending order to get the latest OTP
            },
            {
                $limit: 1,
            },
        ];

        // Fetch the latest OTP from the OTP collection
        const checkOtp = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.OTP);

        if (!checkOtp?.length) {
            return res.status(408).json({
                message: "Otp expired",
            });
        }

        if (checkOtp[0]?.otp !== data.otp) {
            return res.status(403).json({ 
                message: "Otp not matched",
            });
        }

        // Step 4: Use the request payload directly (validate only the required fields)
        data = req.body;

        // Step 5: Handle optional file upload for user profile image
        const file = req.file;
        if (file) {
            const fileName = `${data.email}.${file.originalname.split(".").pop()}`;
            data.imgUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.USER_PROFILE_IMAGES_BUCKET_NAME);
        }

        // Step 6: Create new user in the database
        const newUser = await dbUtils.create(data, DATABASE_COLLECTIONS.USER);
        const message = `${data.username || "User"} is successfully registered with us.`;

        return res.status(201).json({ type: "success", message, newUser });

    } catch (error) {
        // Handle duplicate username error specifically
        if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
            return res.status(400).json({ type: "error", message: "Username is already taken." });
        }
        console.error(`[registerHandler] Error occurred: ${error}`);
        return res.status(500).json({ type: "error", message: error.message || "Internal server error." });
    }
};



module.exports.loginHandler = async (req, res) => {
    try {
        // Fetch email and password from the request body
        const { email, password } = req.body;

        // Validate input fields
        if (!email) {
            return res.status(400).json({
                type: "Error",
                message: "Email is required.",
            });
        }

        if (!password) {
            return res.status(400).json({
                type: "Error",
                message: "Password is required.",
            });
        }

        // Find the user in the USER collection by email
        let user;
        const query = { email: email };
        
        try {
            user = await dbUtils.findOne(query, DATABASE_COLLECTIONS.USER);
        } catch (error) {
            console.error(`[loginHandler] Database error while searching for user: ${error.message}`);
            return res.status(500).json({ 
                type: "Error", 
                message: "Internal server error while retrieving user data." 
            });
        }

        // If user doesn't exist, return error message for invalid email
        if (!user) {
            return res.status(404).json({
                type: "Error",
                message: "User not found. Please check your email.",
            });
        }

        // If password is incorrect, return error message
        if (user.password !== password) {
            return res.status(401).json({
                type: "Error",
                message: "Invalid password.",
            });
        }
        
        // Generate JWT token for the user including additional properties
        const tokenData = {
            id: user._id,
            email: user.email,
            role: user.role,
            username: user.username,
        };
                    
        const token = jwtService.generateToken(tokenData);
        
        // Send success response with token
        return res.status(200).json({ type: "Success", role: user.role, token: token });

    } catch (error) {
        console.error(`[loginHandler] Unexpected error occurred: ${error.message}`);
        return res.status(500).json({ type: "Error", message: "An unexpected error occurred. Please try again later." });
    }
};



module.exports.profileHandler = async (req, res) => {
    try {
        // Extract userEmail from decoded token
        const userEmail = req.decodedToken.email;

        // Define pipeline to find user profile based on userEmail
        const pipeline = [
            {
                $match: { email: userEmail }
            }
        ];

        // Call aggregate function to find user profile
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.USER);
        const userProfile = result.length > 0 ? result[0] : null;

        // Check if userProfile is found
        if (userProfile) {
            // Respond with user profile data
            return res.status(200).json({ type: "Success", userProfile });
        } else {
            // If userProfile is not found, respond with appropriate message
            return res.status(404).json({
                type: "Error",
                message: "User profile not found.",
            });
        }
    } catch (error) {
        console.error(`Error occurred while fetching user profile: ${error.message}`);
        return res.status(500).json({
            type: "Error",
            message: "Internal server error.",
        });
    }
};

module.exports.getAll = async (req, res) => {
    try {
        const filterQuery = req.body?.filter || {};
        const sortQuery = req.body?.sort || { createdAt_EP: -1 };

        let limit = req.body?.limit ? parseInt(req.body.limit) : 5;
        const page = req.body?.page ? parseInt(req.body.page) : 1;
        const skip = (page - 1) * limit;

        const searchText = req.body?.search || '';
        const searchQuery = searchText
            ? {
                  $or: [
                      { email: { $regex: searchText, $options: 'i' } },
                      { firstName: { $regex: searchText, $options: 'i' } },
                      { lastName: { $regex: searchText, $options: 'i' } },
                      { username: { $regex: searchText, $options: 'i' } }
                  ]
              }
            : {};

        

        // Define the pipeline to apply sorting, pagination, and filtering
        const pipeline = [
            {
                $match: {
                    ...filterQuery,
                    ...searchQuery
                }
            },
            {
                $sort: sortQuery
            },
            {
                $project: {
                    password: 0 // Exclude password field
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ];

        // Execute the aggregate query
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.USER);

        // Calculate total count and total pages
        const totals = await dbUtils.findMany({ ...filterQuery, ...searchQuery }, DATABASE_COLLECTIONS.USER);
        const totalCount = totals.length;
        const totalPages = Math.ceil(totalCount / limit);

        // Send success response with data
        res.status(200).json({
            type: 'Success',
            page,
            limit,
            totalPages,
            totalCount,
            data: result
        });
    } catch (error) {
        console.error(`[getAll] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const userEmail = req.decodedToken.email;
        const updates = req.body;
        const file = req?.file;
        let imgUrl = "";

        if (file) {
            const fileName = `${userEmail}.${file.originalname.split(".").pop()}`;

            imgUrl = await s3Utils.uploadFileToS3(
                file,
                fileName,
                process.env.USER_PROFILE_IMAGES_BUCKET_NAME
            );

            // Add the new image URL to the updates object
            updates.imgUrl = imgUrl;
        }

        // Find the user in the `USER` collection only
        const user = await dbUtils.findOne(
            { email: userEmail },
            DATABASE_COLLECTIONS.USER
        );

        // If user is not found, return an error
        if (!user) {
            return res.status(404).json({ type: "Error", message: "User not found." });
        }

        // Update the user profile
        const result = await dbUtils.updateOne({ email: userEmail }, updates, DATABASE_COLLECTIONS.USER);

        const updatedUser = await dbUtils.findOne(
            { email: userEmail },
            DATABASE_COLLECTIONS.USER
        );

        // Respond with success message
        res.status(200).json({ type: 'Success', message: "Profile updated successfully.", result, profile: updatedUser });
    } catch (error) {
        console.error(`[updateProfile] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const { username, password, confirmPassword, otp } = req.body;

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({ type: "Error", message: "Passwords do not match." });
        }

        // Check if the user exists in the USER collection
        const user = await dbUtils.findOne(
            {
                $or: [
                    { username: username },
                    { email: username }
                ]
            },
            DATABASE_COLLECTIONS.USER
        );

        if (!user) {
            return res.status(404).json({ type: "Error", message: "User not found." });
        }

        if (password === user.password) {
            return res.status(400).json({ type: "Error", message: "New password cannot be the same as the old password." });
        }

        // Fetch the most recent OTP for password reset
        const pipeline = [
            {
                $match: {
                    email: user.email,
                    type: configs.CONSTANTS.OTP_TYPE.PASSWORD_RESET,
                    status: configs.CONSTANTS.STATUS.ACTIVE,
                },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
        ];

        const storedOtp = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.OTP);

        if (!storedOtp || !storedOtp.length) {
            return res.status(404).json({ type: "Error", message: "OTP not found." });
        }

        const otpCreationTime = new Date(storedOtp[0].createdAt);
        const currentTime = new Date();
        const otpAgeInMinutes = (currentTime - otpCreationTime) / (1000 * 60);

        if (otpAgeInMinutes > configs.OTP_EXPIRES_IN_MINUTES) {
            await dbUtils.updateOne(
                { _id: storedOtp[0]._id },
                { status: configs.CONSTANTS.STATUS.INACTIVE },
                DATABASE_COLLECTIONS.OTP
            );
            return res.status(400).json({ type: "Error", message: "OTP has expired." });
        }

        if (storedOtp[0].otp !== otp) {
            return res.status(400).json({ type: "Error", message: "Invalid OTP." });
        }

        const updateData = {
            password: password
        };

        // Update the user's password
        await dbUtils.updateOne({ email: user.email }, updateData, DATABASE_COLLECTIONS.USER);

        // Deactivate the OTP
        await dbUtils.updateOne(
            { _id: storedOtp[0]._id },
            { status: configs.CONSTANTS.STATUS.INACTIVE },
            DATABASE_COLLECTIONS.OTP
        );

        const tokenData = {
            id: user._id,
            email: user.email,
            centerID: user.centerID,
            role: user.role,
            permissions: user.permissions,
        };
        const token = jwtService.generateToken(tokenData);

        res.status(200).json({
            type: "Success",
            message: "Password has been reset successfully.",
            token,
        });
    } catch (error) {
        console.error(`[resetPassword] Error occurred: ${error}`);
        res.status(500).json({ type: "Error", message: error.message || "An unexpected error occurred." });
    }
};

module.exports.forgotPassword = async (req, res) => {
    try {
        const { username, password, confirmPassword, otp } = req.body;

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({ type: "Error", message: "Passwords do not match." });
        }

        // Check if the user exists in the USER collection
        const user = await dbUtils.findOne(
            {
                $or: [
                    { username: username },
                    { email: username }
                ]
            },
            DATABASE_COLLECTIONS.USER
        );

        if (!user) {
            return res.status(404).json({ type: "Error", message: "User not found." });
        }

        if (password === user.password) {
            return res.status(400).json({ type: "Error", message: "New password cannot be the same as the old password." });
        }

        // Fetch the most recent OTP for forgot password
        const pipeline = [
            {
                $match: {
                    email: user.email,
                    type: configs.CONSTANTS.OTP_TYPE.FORGOT_PASSWORD,
                    status: configs.CONSTANTS.STATUS.ACTIVE,
                },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
        ];

        const storedOtp = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.OTP);

        if (!storedOtp || !storedOtp.length) {
            return res.status(400).json({ type: "Error", message: "OTP not found." });
        }

        const otpCreationTime = new Date(storedOtp[0].createdAt);
        const currentTime = new Date();
        const otpAgeInMinutes = (currentTime - otpCreationTime) / (1000 * 60);

        if (otpAgeInMinutes > configs.OTP_EXPIRES_IN_MINUTES) {
            await dbUtils.updateOne(
                { _id: storedOtp[0]._id },
                { status: configs.CONSTANTS.STATUS.INACTIVE },
                DATABASE_COLLECTIONS.OTP
            );
            return res.status(400).json({ type: "Error", message: "OTP has expired." });
        }

        if (storedOtp[0].otp !== otp) {
            return res.status(400).json({ type: "Error", message: "Invalid OTP." });
        }

        const updateData = {
            password: password
        };

        // Update the user's password
        await dbUtils.updateOne({ email: user.email }, updateData, DATABASE_COLLECTIONS.USER);

        // Deactivate the OTP
        await dbUtils.updateOne(
            { _id: storedOtp[0]._id },
            { status: configs.CONSTANTS.STATUS.INACTIVE },
            DATABASE_COLLECTIONS.OTP
        );

        const tokenData = {
            id: user._id,
            email: user.email,
            centerID: user.centerID,
            role: user.role,
            permissions: user.permissions,
        };
        const token = jwtService.generateToken(tokenData);

        res.status(200).json({
            type: "Success",
            message: "Password has been updated successfully.",
            token,
        });
    } catch (error) {
        console.error(`[forgotPassword] Error occurred: ${error}`);
        res.status(500).json({ type: "Error", message: error.message || "An unexpected error occurred." });
    }
};
