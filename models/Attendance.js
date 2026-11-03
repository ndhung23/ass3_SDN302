const mongoose = require("mongoose");
require("./Student");
require("./Class");

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["PRESENT", "ABSENT"],
        required: true
    }
});

module.exports = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema, "attendances");
