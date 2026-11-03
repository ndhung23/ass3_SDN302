const Attendance = require("../models/Attendance");

exports.getAllAttendances = async (req, res) => {
    try {
        const attendances = await Attendance.find()
            .populate("studentId")
            .populate({
                path: "classId",
                populate: { path: "subjectId" }
            });

        res.status(200).json(attendances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
