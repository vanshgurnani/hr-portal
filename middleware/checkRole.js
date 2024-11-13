// const dbUtils = require("../utils/db_operations");
// const configs = require("../configs.json");
// const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;


// module.exports.checkBase = async (req, res, next) => {
//     try {
//         const id = req.decodedToken.id;
//         const userId = await dbUtils.convertStringIdToMongooId(id);
//         const userResult = await dbUtils.findOne(
//             {_id: userId},
//             DATABASE_COLLECTIONS.ORGANISATION_USER,
//             {password: 0}
//         );

//         // console.debug("user result: ", userResult);

//         const requestedEndpoint = req.baseUrl; // This should match the API being requested
//         const role = userResult.role;

//         // Pipeline to fetch role data
//         const pipeline = [
//             {
//                 $match: {
//                     roleName: { $in: role }
//                 }
//             },
//             {
//                 $addFields: {
//                     levels: {
//                         $cond: {
//                             if: { $isArray: "$levels" },
//                             then: { $map: { input: "$levels", as: "levelId", in: { $toObjectId: "$$levelId" } } },
//                             else: []
//                         }
//                     }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "levels",
//                     localField: "levels",
//                     foreignField: "_id",
//                     as: "levels"
//                 }
//             }
//         ];

//         const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.ROLES);
//         console.log(JSON.stringify(result, null, 2));

//         // Fetch user details
        
//         if (result.length > 0) {
//             const endpointPermissions = result[0].levels;
//             const roleExcludedPermissions = result[0].excludedPermission || [];
//             const userExcludedPermissions = userResult[0]?.excludedPermissions || [];
//             const combinedExcludedPermissions = roleExcludedPermissions.concat(userExcludedPermissions);

//             console.log("Endpoint Permissions:", endpointPermissions);
//             console.log("Role Excluded Permissions:", roleExcludedPermissions);
//             console.log("User Excluded Permissions:", userExcludedPermissions);

//             // Filter to check if the requested endpoint exists in endpointPermissions
//             const filteredPermissions = endpointPermissions.filter(permission => 
//                 permission.api === requestedEndpoint && 
//                 !combinedExcludedPermissions.includes(permission._id.toString())
//             );
            
//             // Log the filtered results
//             console.log("Filtered Permissions:", filteredPermissions);
            
//             const hasAccess = filteredPermissions.length > 0;

//             req.filteredPermissions = filteredPermissions;
//             req.roleExcludedPermissions = roleExcludedPermissions;
//             req.userExcludedPermissions = userExcludedPermissions;


//             if (hasAccess) {
//                 // Proceed to the next middleware or route handler
//                 return next();
//             } else {
//                 return res.status(403).json({ 
//                     type: "Error", 
//                     message: "User not authorized for this level.", 
//                     submessage: "Contact the Admin regarding access fro this level." 
//                 });
//             }
//         } else {
//             return res.status(404).json({ 
//                 type: "Error", 
//                 message: "Role or endpoint not found." 
//             });
//         }

//     } catch (error) {
//         console.error(`Error checking base: ${error}`);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// module.exports.checkSublevel = async (req, res, next) => {
//     try {
//         // Get the filtered permissions from the previous middleware
//         const filteredPermissions = req.filteredPermissions[0].api;
//         const requestedEndpoint = req.baseUrl + req.path;

//         console.log("Filtered Permissions:", filteredPermissions);
//         console.log("Requested Endpoint:", requestedEndpoint);

//         // Aggregation pipeline to get sublevels
//         const pipeline = [
//             {
//                 $match: {
//                     api: filteredPermissions
//                 }
//             },
//             {
//                 $addFields: {
//                     sublevel: {
//                         $cond: {
//                             if: { $isArray: "$sublevel" },
//                             then: { $map: { input: "$sublevel", as: "sublevelId", in: { $toObjectId: "$$sublevelId" } } },
//                             else: []
//                         }
//                     }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "sublevels",
//                     localField: "sublevel",
//                     foreignField: "_id",
//                     as: "sublevels"
//                 }
//             }
//         ];

//         const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.LEVELS);

//         if (result.length === 0 || !result[0].sublevels) {
//             return res.status(404).json({ message: "Sublevels not found." });
//         }

//         // Extract sublevels and check if requestedEndpoint matches any sublevel's API
//         const sublevels = result[0].sublevels;
//         let matchedSublevel = null;

//         // Using a for loop to filter based on requestedEndpoint
//         for (let sublevel of sublevels) {
//             if (sublevel.api === requestedEndpoint) {
//                 matchedSublevel = sublevel;
//                 break;
//             }
//         }

//         if (matchedSublevel) {
//             console.log("Matched Sublevel:", matchedSublevel);
//             req.matchedSublevel = matchedSublevel;
//             // Proceed to the next middleware or route handler
//             return next();
//         } else {
//             console.log("No matching sublevel found for the requested endpoint.");
//             return res.status(403).json({
//                 type: "Error",
//                 message: "User not authorized for this sublevel.",
//                 submessage: "Contact the Admin regarding access fro this level." 
//             });
//         }

//     } catch (error) {
//         console.error(`Error checking sublevel: ${error}`);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };


// module.exports.checkMethod = async (req, res, next) => {
//     try {
//         console.log(req.method);
//         const endpointPermissions = req.filteredPermissions;
//         const roleExcludedPermissions = req.roleExcludedPermissions;
//         const userExcludedPermissions = req.userExcludedPermissions;

//         const matchedSublevelPermission = req.matchedSublevel ? req.matchedSublevel.permissions : [];

//         console.log("matchedSublevelPermission: ", matchedSublevelPermission);

//         const combinedPermissions = endpointPermissions.reduce((acc, level) => {
//             // Assuming each level has a permissions array
//             if (level.permissions && Array.isArray(level.permissions)) {
//                 return acc.concat(level.permissions);
//             }
//             return acc;
//         }, []).concat(matchedSublevelPermission);

//         const combinedExclduedPermission = roleExcludedPermissions.concat(userExcludedPermissions);
//         console.log("Final Permissions:", endpointPermissions);
//         console.log("Role Excluded Permissions:", roleExcludedPermissions, roleExcludedPermissions.length);
//         console.log("User Excluded Permissions:", userExcludedPermissions, userExcludedPermissions.length);
//         console.log("Combined Excluded Permissions:", combinedExclduedPermission, combinedExclduedPermission.length);
//         console.log("combined permission:", combinedPermissions, combinedPermissions.length);


//         const finalPermissions = combinedPermissions.filter(permission => 
//             !combinedExclduedPermission.includes(permission)
//         );

//         console.log("finalPermissions:", finalPermissions, finalPermissions.length);

//         const permissions = await dbUtils.findMany(
//             { _id: { $in: finalPermissions.map(id => dbUtils.convertStringIdToMongooId(id)) } }, 
//             DATABASE_COLLECTIONS.PERMISSION
//           );
          
//         console.log(permissions);

//         const hasAccess = permissions.some(permission => 
//             permission.requestType === req.method
//         );

//         console.log(hasAccess);

//         if (hasAccess) {
//             // Proceed to the next middleware or route handler
//             return next();
//         } else {
//             return res.status(403).json({ 
//                 type: "Error", 
//                 message: 'Forbidden: You do not have permission to perform this action'
//             });
//         }
        
//     } catch (error) {
//         console.error(`Error checking method: ${error}`);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };


