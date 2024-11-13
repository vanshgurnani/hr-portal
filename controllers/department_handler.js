const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createDepartment = async (req, res) => {
    try {
        const userEmail = req.decodedToken.email;

        const requiredFields = [
            { property: "orgId", optional: true },
            { property: "name", optional: true },
            { property: "supervisor", optional: true },
            { property: "latePenalty", optional: true },
            { property: "workPattern", optional: true },
            { property: "noteOnAttendanceIn", optional: true },
            { property: "noteOnAttendanceOut", optional: true },
            { property: "noteOnOvertimeClockIn", optional: true },
            { property: "noteOnOvertimeClockOut", optional: true },
            { property: "hrEmail", optional: true }
        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);
        const { orgId, name, supervisor, latePenalty, workPattern, noteOnAttendanceIn, noteOnAttendanceOut, noteOnOvertimeClockIn, noteOnOvertimeClockOut } = payload;

        const newDepartment = {
            orgId,
            name,
            supervisor,
            latePenalty,
            workPattern,
            noteOnAttendanceIn,
            noteOnAttendanceOut,
            noteOnOvertimeClockIn,
            noteOnOvertimeClockOut,
            hrEmail: userEmail
        };

        const department = await dbUtils.create(newDepartment, DATABASE_COLLECTIONS.DEPARTMENT);
        res.status(200).json({ type: "success", department });
    } catch (error) {
        console.error(`[createDepartment] Error occurred: ${error}`);
        res.status(400).json({ type: 'Error', message: error.message });
    }
};

module.exports.getAllDepartment = async (req, res) => {
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
        const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.DEPARTMENT);

        // Calculate total count and total pages
        const totals = await dbUtils.findMany({ ...filterQuery, ...searchQuery }, DATABASE_COLLECTIONS.DEPARTMENT);
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
        console.error(`[getAllDepartment] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: error.message });
    }
};

module.exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.body;

        // Check if the id is provided
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide a department ID to update the department' });
        }

        // Convert id to MongoDB ObjectId
        const departmentId = await dbUtils.convertStringIdToMongooId(id);

        // Prepare update data excluding `id`
        const updateData = { ...req.body };
        delete updateData.id; // Ensure `id` is not overwritten

        // Update department data based on the converted ObjectId
        const updatedDepartment = await dbUtils.updateOne({ _id: departmentId }, updateData, DATABASE_COLLECTIONS.DEPARTMENT);
        if (!updatedDepartment) {
            return res.status(404).json({ type: 'Error', message: 'Department not found' });
        }

        res.status(200).json({ type: "success", updatedDepartment });
    } catch (error) {
        console.error(`[updateDepartment] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};

module.exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.body;
        const departmentId = await dbUtils.convertStringIdToMongooId(id);
        if (!id) {
            return res.status(400).json({ type: 'Error', message: 'Please provide a department ID to delete the department' });
        }

        // Use _id to find and delete the department
        const deletedDepartment = await dbUtils.deleteOne({ _id: departmentId }, DATABASE_COLLECTIONS.DEPARTMENT);
        if (!deletedDepartment) {
            return res.status(404).json({ type: 'Error', message: 'Department not found' });
        }

        res.status(200).json({ type: "success", message: "Department deleted successfully" });
    } catch (error) {
        console.error(`[deleteDepartment] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: 'Internal server error' });
    }
};
