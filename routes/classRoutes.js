const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", classController.getAllClasses);
router.get("/:classId/students", verifyToken, classController.getStudentsByClassId);
router.get("/:classId/attendance-summary", verifyToken, classController.getAttendanceSummary);

module.exports = router;
