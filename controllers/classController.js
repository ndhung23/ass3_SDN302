const mongoose = require("mongoose");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate("subjectId")
            .populate("enrollments.studentId");
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentsByClassId = async (req, res) => {
    try {
        const { classId } = req.params;
        if (!mongoose.isValidObjectId(classId)) {
            return res.status(400).json({ error: `Invalid classId: ${classId}` });
        }
        const classDoc = await Class.findById(classId).populate("enrollments.studentId");
        if (!classDoc) {
            return res.status(404).json({ error: `Class with id: ${classId} not found` });
        }
        const { status } = req.query;
        let enrollments = classDoc.enrollments;
        if (status) {
            if (!["enrolled", "dropped"].includes(status)) {
                return res.status(400).json({ error: `Invalid status: ${status}` });
            }
            enrollments = enrollments.filter(e => e.status === status);
        }
        const students = enrollments
            .filter(e => e.studentId)
            .map(e => ({
                id: e.studentId._id,
                studentCode: e.studentId.studentCode,
                fullName: e.studentId.fullName,
                email: e.studentId.email
            }));
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const { classId } = req.params;
        if (!mongoose.isValidObjectId(classId)) {
            return res.status(400).json({ error: `Invalid classId: ${classId}` });
        }
        const classDoc = await Class.findById(classId).populate("enrollments.studentId");
        if (!classDoc) {
            return res.status(404).json({ error: `Class with id = ${classId} not found` });
        }
        const enrolledStudents = classDoc.enrollments.filter(
            e => e.status === "enrolled" && e.studentId
        );
        const classAttend = await Attendance.find({ classId });
        const summary = enrolledStudents.map(e => {
            const studentRecords = classAttend.filter(
                a => a.studentId.toString() === e.studentId._id.toString()
            );
            const totalSessions = studentRecords.length;
            const present = studentRecords.filter(a => a.status === "PRESENT").length;
            const absent = studentRecords.filter(a => a.status === "ABSENT").length;
            const attendanceRate = totalSessions > 0 ? Math.round((present / totalSessions) * 1000) / 10 : 0;
            const warning = attendanceRate < 80;
            return {
                studentCode: e.studentId.studentCode,
                fullName: e.studentId.fullName,
                totalSessions,
                present,
                absent,
                attendanceRate,
                warning
            };
        });
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
