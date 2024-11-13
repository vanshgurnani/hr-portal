const jwt = require("jsonwebtoken");
const configs = require("../configs.json"); 
const dbUtils = require("../utils/db_operations");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.generateToken = ({ email, id, role , centerID , permissions, username }) => {
    const secretKey = configs.JWT_SECRET;
    const payload = { email, id, centerID , role , permissions, username };
    const options = { expiresIn: configs.JWT_ACCESS_TOKEN_EXPIRY };
    const token = jwt.sign(payload, secretKey, options);
    return token;
};

module.exports.validateJwt = (req, res, next) => {
    const secretKey = configs.JWT_SECRET;
    const authHeader = req.headers["authorization"];
    let token = undefined;
    if (authHeader) {
        const [bearer, accessToken] = authHeader?.split(" ");
        if (bearer === "Bearer" && accessToken) {
            token = accessToken;
        }
    }

    if (!token) {
        return res.status(403).json({
            error: "Please provide accessToken.",
        });
    }
    try {
        const decodedToken = jwt.verify(token, secretKey);
        req.decodedToken = decodedToken;
        console.log(decodedToken);
        
        next();
    } catch (err) {
        return res.status(403).json({
            error: "Invalid accessToken provided.",
        });
    }
};

module.exports.checkRole = async (req, res, next) => {
    try { 
        const email = req.decodedToken.email;
        const user = await dbUtils.findOne({email}, DATABASE_COLLECTIONS.ORGANISATION_USER);

        if(!user) throw new Error(`Invalid user, Please check whether this user exists in your organinsation or not`);

        const userRole = user.role;
        const permissions = [];
        
        req.decodedToken.role = userRole;
        req.decodedToken.permissions = permissions;

        next();
    } catch (err) {
        return res.status(401).json({
            error: "Role role is not sufficient to access this information.",
        });
    }
};

module.exports.validateProfile = (req, res, next) => {
    const secretKey = configs.JWT_SECRET;
    const authHeader = req.headers["authorization"];
    let token = undefined;
    if (authHeader) {
        const [bearer, accessToken] = authHeader?.split(" ");
        if (bearer === "Bearer" && accessToken) {
            token = accessToken;
        }
    }

    if (!token) {
        return res.status(401).json({
            error: "Please provide accessToken.",
        });
    }
    try {
        const decodedToken = jwt.verify(token, secretKey);
        req.decodedToken = decodedToken;
        console.log(decodedToken);
        
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid accessToken provided.",
        });
    }
};
