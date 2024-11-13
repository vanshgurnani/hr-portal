const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const serverless = require("serverless-http");

const authRouter = require("./routers/auth_router");
const departmentRouter = require("./routers/department_router");
const attendanceRouter = require("./routers/attendance_router");
const workPattern = require("./routers/workPattern_router");
const orgRouter = require("./routers/org_router");


const EXPRESS_SESSION_CONFIGS = {
    secret: process.env.EXPRESS_SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
};

const app = express();
app.use(cors());
app.use(session(EXPRESS_SESSION_CONFIGS));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/auth", authRouter);
app.use("/api/org", orgRouter);

app.use("/api/department", departmentRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/work", workPattern);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});

// to run and test locally
// if (process.env.DEVELOPMENT) {
//     const port = process.env.PORT || 3000;
//     app.listen(port, () => {
//         console.log(`Server is running on PORT: ${port}.`);
//     });
// }
// // to run over lambda
// module.exports.handler = async (event, context) => {
//     try {
//         const path = event.path || "";
//         console.log("[Lambda Handler] Requested Path -", path);

//         // Forward the request to the serverless app instance
//         return await serverless(app)(event, context);

//     } catch (error) {
//         console.error(`Lambda Handler Error: ${JSON.stringify(error)}`);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({
//                 error: error?.message ? error.message : `Internal server error`,
//             }),
//         };
//     }
// };
