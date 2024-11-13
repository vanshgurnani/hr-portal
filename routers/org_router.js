const express = require("express");
const router = express.Router();
const org = require("../controllers/org_handler");
const JwtService = require("../middleware/jwt");


const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage()
});

router.post("/", JwtService.validateJwt, upload.single('file'), org.createOrganisation);
router.post("/all", org.getAllOrg);
router.put("/", org.updateOrganisation);
router.delete("/", org.deleteOrganisation);



module.exports = router;