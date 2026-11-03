const express = require("express");
const router = express.Router();
const allController = require("../controllers/studentController");
const verifyToken = require("../middlewares/authMiddleware");


router.get("/classes/:classId/students", verifyToken,allController.getStudentInClass);
router.get("/classes/:classId/attendance-summary", verifyToken,allController.getAttendSummaryOfClass);
router.get("/students/:studentId/attendances", verifyToken,allController.getAttendHistoryOfStudent);
router.post("/classes/:classId/attendances", verifyToken,allController.updatedAttendance);

module.exports = router;
 