const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createAttendance = async (req, res) => {
    try {
        const requiredFields = [
            { property: "orgId", optional: false },
            { property: "userEmail", optional: false },
            { property: "userId", optional: false },
            { property: "status", optional: false },
            { property: "idealUrl", optional: false },
            { property: "currentUrl", optional: false }

        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);
        const { orgId, userEmail, status, userId, idealUrl, currentUrl } = payload;

        const newAttendance = {
            orgId,
            userEmail, 
            status,
            userId,
            idealUrl, 
            currentUrl
        };

        const attendance = await dbUtils.create(newAttendance, DATABASE_COLLECTIONS.ATTENDANCE);
        res.status(200).json({ type: "Success", attendance });
    } catch (error) {
        console.error(`[createAttendance] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.getAllAttendance = async (req, res) => {
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
                      { userEmail: { $regex: searchText, $options: 'i' } }
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
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.ATTENDANCE);

        // Calculate total count and total pages
        const totals = await dbUtils.findMany({ ...filterQuery, ...searchQuery }, DATABASE_COLLECTIONS.ATTENDANCE);
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
        console.error(`[getAllAttendance] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.body;

        // Check if the id is provided
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide a attendance ID to update the department' });
        }

        // Convert id to MongoDB ObjectId
        const attendanceId = await dbUtils.convertStringIdToMongooId(id);

        // Prepare update data excluding `id`
        const updateData = { ...req.body };
        delete updateData.id; // Ensure `id` is not overwritten

        // Update department data based on the converted ObjectId
        const updatedAttendance = await dbUtils.updateOne({ _id: attendanceId }, updateData, DATABASE_COLLECTIONS.ATTENDANCE);
        if (!updatedAttendance) {
            return res.status(404).json({ type: 'Error', message: 'Attendance not found' });
        }

        res.status(200).json({ type: "success", updatedAttendance});
    } catch (error) {
        console.error(`[updatedAttendance] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};

module.exports.deleteAttendance = async (req, res) => {
    try {
        const { id } = req.body;
        const attendanceId = await dbUtils.convertStringIdToMongooId(id);
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide a attendance ID to delete the attendance' });
        }

        // Use _id to find and delete the department
        const deletedAttendance = await dbUtils.deleteOne({ _id: attendanceId }, DATABASE_COLLECTIONS.ATTENDANCE);
        if (!deletedAttendance) {
            return res.status(404).json({ type: 'Error', message: 'Attendance not found' });
        }

        res.status(200).json({ type: "success", message: "Attendance deleted successfully" });
    } catch (error) {
        console.error(`[deleteAttendance] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};
