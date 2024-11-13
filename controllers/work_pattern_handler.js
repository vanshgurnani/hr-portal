const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createWorkPattern = async (req, res) => {
    try {
        const userEmail = req.decodedToken.email;

        const requiredFields = [
            { property: "orgId", optional: true },
            { property: "name", optional: true },
            { property: "tardinessTolerance", optional: true },
            { property: "weekdays", optional: true },
            { property: "hrEmail", optional: true }

        ];

        // Validate the incoming request body
        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);
        const { orgId, name, tardinessTolerance, weekdays } = payload;


        // Prepare the new Work Pattern object
        const newWorkPattern = {
            orgId,
            name,
            tardinessTolerance,
            weekdays
        };

        // Save the Work Pattern to the database
        const workPattern = await dbUtils.create(newWorkPattern, DATABASE_COLLECTIONS.WORK_PATTERN);
        
        res.status(200).json({ type: "success", workPattern });
    } catch (error) {
        console.error(`[createWorkPattern] Error occurred: ${error}`);
        res.status(400).json({ type: 'Error', message: error.message });
    }
};

module.exports.getAllWorkPatterns = async (req, res) => {
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
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.WORK_PATTERN);

        // Calculate total count and total pages
        const totals = await dbUtils.findMany({ ...filterQuery, ...searchQuery }, DATABASE_COLLECTIONS.WORK_PATTERN);
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
        console.error(`[getAllWorkPatterns] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.deleteWorkPattern = async (req, res) => {
    try {
        const { id } = req.body;
        const workPatternId = await dbUtils.convertStringIdToMongooId(id);
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide a work pattern ID to delete the work pattern' });
        }

        // Use _id to find and delete the work pattern
        const deletedWorkPattern = await dbUtils.deleteOne({ _id: workPatternId }, DATABASE_COLLECTIONS.WORK_PATTERN);
        if (!deletedWorkPattern) {
            return res.status(404).json({ type: 'Error', message: 'Work Pattern not found' });
        }

        res.status(200).json({ type: "success", message: "Work Pattern deleted successfully" });
    } catch (error) {
        console.error(`[deleteWorkPattern] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};