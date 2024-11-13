const express = require("express");
const router = express.Router();
const attendance = require("../controllers/attendance_handler");
// const JwtService = require("../middleware/jwt");


// const multer = require('multer');
// const upload = multer({
//     storage: multer.memoryStorage()
// });

router.post("/", attendance.createAttendance);
router.post("/all", attendance.getAllAttendance);
router.put("/", attendance.updateAttendance);
router.delete("/", attendance.deleteAttendance);



module.exports = router;