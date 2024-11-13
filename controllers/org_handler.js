const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const s3Utils = require("../utils/s3");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createOrganisation = async (req, res) => {
    try {
        const requiredFields = [
            { property: "email", optional: false },
            { property: "name", optional: false },
            { property: "description", optional: true },
            { property: "phoneNumber", optional: true },
            { property: "location", optional: true },
            { property: "pincode", optional: true },
            { property: "city", optional: true },
            { property: "state", optional: true },
            { property: "country", optional: true },
            { property: "webLink", optional: true }
        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);
        const { email, name, description, location, pincode, city, state, country, webLink } = payload;

        const file = req.file;
        if (!file?.originalname) {
            throw new Error(`Please provide a valid image`);
        }

        const fileName = `${email}.${file.originalname.split('.').pop()}`;
        const imgUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.USER_PROFILE_IMAGES_BUCKET_NAME);

        const newOrg = {
            email,
            name,
            description,
            location,
            pincode,
            city,
            state,
            country,
            imgUrl,
            webLink
        };

        const org = await dbUtils.create(newOrg, DATABASE_COLLECTIONS.ORGANISATION);
        res.status(200).json({ type: "success", org });
    } catch (error) {
        console.error(`[createOrganisation] Error occurred: ${error}`);
        res.status(400).json({ type: 'Error', message: error.message });
    }
};

module.exports.getAllOrg = async (req, res) => {
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
                      { name: { $regex: searchText, $options: 'i' } }
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
                $skip: skip
            },
            {
                $limit: limit
            }
        ];

        // Execute the aggregate query
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.ORGANISATION);

        // Calculate total count and total pages
        const totals = await dbUtils.findMany({ ...filterQuery, ...searchQuery }, DATABASE_COLLECTIONS.ORGANISATION);
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
        console.error(`[getOrg] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.updateOrganisation = async (req, res) => {
    try {
        const { id } = req.body;

        // Check if the id is provided
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide an organization ID to update the organization' });
        }

        // Convert id to MongoDB ObjectId
        const orgId = await dbUtils.convertStringIdToMongooId(id);

        // Prepare update data excluding `id`
        const updateData = { ...req.body };
        delete updateData.id; // Ensure `id` is not overwritten

        // Check if a file is provided and update image URL
        if (req.file) {
            const fileName = `${orgId}.jpg`; // Use orgId as part of the filename
            updateData.imageUrl = await s3Utils.uploadFileToS3(req.file, fileName, process.env.USER_PROFILE_IMAGES_BUCKET_NAME);
        }

        // Update organization data based on the converted ObjectId
        const updatedOrg = await dbUtils.updateOne({ _id: orgId }, updateData, DATABASE_COLLECTIONS.ORGANISATION);
        if (!updatedOrg) {
            return res.status(404).json({ type: 'Error', message: 'Organization not found' });
        }

        res.status(200).json({ type: "success", updatedOrg });
    } catch (error) {
        console.error(`[updateOrganisation] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};

module.exports.deleteOrganisation = async (req, res) => {
    try {
        const { id } = req.body;
        const orgId = await dbUtils.convertStringIdToMongooId(id);
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide an organization ID to delete the organization' });
        }

        // Use _id to find and delete the organization
        const deletedOrg = await dbUtils.deleteOne({ _id: orgId }, DATABASE_COLLECTIONS.ORGANISATION);
        if (!deletedOrg) {
            return res.status(404).json({ type: 'Error', message: 'Organization not found' });
        }

        res.status(200).json({ type: "success", message: "Organization deleted successfully" });
    } catch (error) {
        console.error(`[deleteOrganisation] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};

