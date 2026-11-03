const mongoose = require("mongoose");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");

exports.getStudentInClass = async (req, res) => {
    try {
        const { classId } = req.params;
        if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({ error: `Invalid classId: ${classId}` })
        }
        const classDoc = await Class.findById(classId).populate('enrollments.studentId');
        if (!classDoc) {
        return res.status(404).json({ error: `Class with id: ${classId} not found` });
        }
        const { status } = req.query;
        if (!status || !['enrolled', 'dropped'].includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
        }
        const students = classDoc.enrollments
            .filter(e => e.status == status && e.studentId)
            .map(e => ({
            studentId: e.studentId._id,
            studentCode: e.studentId.studentCode,
            fullName: e.studentId.fullName,
            email: e.studentId.email
            }))
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAttendSummaryOfClass = async (req, res) => {
    try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ error: `Invalid classId: ${classId}` })
    }
    const classDoc = await Class.findById(classId).populate('enrollments.studentId');
    if (!classDoc) {
      return res.status(404).json({ error: `Class with id = ${classId} not found` });
    } 
    const enrolledStudents = classDoc.enrollments.filter(
      e => e.status == 'enrolled' && e.studentId
    )
    const classAttend = await Attendance.find({ classId });
    const summary = enrolledStudents.map(e => {
        const studentRecords = classAttend.filter(
          a => a.studentId.toString() == e.studentId._id.toString()
        )
        const totalSessions = studentRecords.length;
        const present = studentRecords.filter(a => a.status == "PRESENT").length;
        const absent = studentRecords.filter(a => a.status == "ABSENT").length;
        const attendanceRate = Math.round((present / totalSessions) * 1000) / 10;
        const warning = attendanceRate < 80;
        return {
          studentCode: e.studentId.studentCode,
          totalSessions,
          present,
          absent,
          attendanceRate,
          warning
        }
      })
      res.status(200).type('application/json').send(
        JSON.stringify(summary).replace(
          /("attendanceRate":\s*)(\d+)([,}])/g,
          '$1$2.0$3'
        )
      );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAttendHistoryOfStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        if(!mongoose.isValidObjectId(studentId)){
        return res.status(400).json({ error: `Invalid studentId: ${studentId}`});
        }
        const student = await Student.findById(studentId);
        if(!student){
        return res.status(404).json({ error: `Student with id = ${studentId} not found`});
        }
        const attStudent = await Attendance.find({studentId: studentId})
        .sort({ date: -1 })
        .populate({
            path: 'classId',
            select: 'className subjectId',
            populate: {
                path: 'subjectId',
                select: 'name'
            }
        })
        if(attStudent.length < 1){
            return res.status(200).json([]);
        }
        const kq = attStudent.map(a => ({
            id: a._id,
            className: a.classId.className,
            subjectName: a.classId.subjectId.name,
            date: a.date,
            status: a.status
        }))
        return res.status(200).json(kq);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updatedAttendance = async (req, res) => {
    try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({
        error: `Invalid classId: ${classId}`
      });
    }
    const classDoc = await Class.findById(classId)
      .populate('enrollments.studentId');
    if (!classDoc) {
      return res.status(404).json({
        error: `Class with id = ${classId} not found`
      });
    }
    const { date, records } = req.body;
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        error: 'Date is required and must be valid'
      });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'Records array is required and cannot be empty'
      });
    }
    const inputDate = new Date(date);
    const today = new Date().toISOString().slice(0, 10);
    const dateString = inputDate.toISOString().slice(0, 10);
    if (dateString > today) {
      return res.status(400).json({
        error: 'Date cannot be in the future'
      });
    }
    const enrolledStudents = classDoc.enrollments
      .filter(e => e.status === 'enrolled' && e.studentId)
      .map(e => e.studentId);
    const enrolledIdsSet = new Set(
      enrolledStudents.map(s => s._id.toString())
    );
    for (const r of records) {
      if (
        !r.studentId ||
        !mongoose.isValidObjectId(r.studentId) ||
        !enrolledIdsSet.has(r.studentId.toString())
      ) {
        return res.status(400).json({
          error: `Student ${r.studentId} does not belong to class`
        });
      }
    }
    const submittedIdsSet = new Set(
      records.map(r => r.studentId.toString())
    );
    if (submittedIdsSet.size !== records.length) {
      return res.status(400).json({
        error: 'Duplicate studentId'
      });
    }
    for (const s of enrolledStudents) {
      if (!submittedIdsSet.has(s._id.toString())) {
        return res.status(400).json({
          error: `Missing attendance for student ${s.studentCode} (${s.fullName})`
        });
      }
    }
    for (const r of records) {
      if (!['PRESENT', 'ABSENT'].includes(r.status)) {
        return res.status(400).json({
          error: `Invalid status: ${r.status}`
        });
      }
    }
    inputDate.setUTCHours(0, 0, 0, 0);
    const startOfDay = new Date(inputDate);
    const endOfDay = new Date(inputDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const operations = records.map(r => ({
      updateOne: {
        filter: {
          classId,
          studentId: r.studentId,
          date: { $gte: startOfDay, $lte: endOfDay }
        },
        update: {
          $set: {
            status: r.status,
            date: startOfDay
          }
        },
        upsert: true
      }
    }));
    const result = await Attendance.bulkWrite(operations);
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    return res.status(201).json({
      message: 'Attendance recorded successfully',
      totalRecords: records.length,
      present,
      absent,
      updatedCount: result.matchedCount
    });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};