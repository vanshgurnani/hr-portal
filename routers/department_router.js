const express = require("express");
const router = express.Router();
const department = require("../controllers/department_handler");
const JwtService = require("../middleware/jwt");


// const multer = require('multer');
// const upload = multer({
//     storage: multer.memoryStorage()
// });

router.post("/", JwtService.validateJwt, department.createDepartment);
router.post("/all", department.getAllDepartment);
router.put("/", department.updateDepartment);
router.delete("/", department.deleteDepartment);



module.exports = router;