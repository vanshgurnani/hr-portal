const express = require("express");
const router = express.Router();
const auth = require("../controllers/authorization/auth_handler");
const JwtService = require("../middleware/jwt");


const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage()
});

router.post("/validate", auth.validateOtp);
router.post("/register", upload.single('file'), auth.registerHandler);
router.post("/login", auth.loginHandler);
router.get("/profile", JwtService.validateProfile, auth.profileHandler);
router.put("/reset-password", auth.resetPassword);
router.post("/all", JwtService.validateJwt, auth.getAll);
router.put("/profile", upload.single('file') , JwtService.validateJwt , auth.updateProfile);
router.put("/forgot-password", auth.forgotPassword);

module.exports = router;