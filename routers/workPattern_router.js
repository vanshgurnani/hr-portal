const express = require("express");
const router = express.Router();
const work = require("../controllers/work_pattern_handler");
const JwtService = require("../middleware/jwt");


// const multer = require('multer');
// const upload = multer({
//     storage: multer.memoryStorage()
// });

router.post("/", JwtService.validateJwt, work.createWorkPattern);
router.post("/all", work.getAllWorkPatterns);
router.delete("/", work.deleteWorkPattern);



module.exports = router;