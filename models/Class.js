const mongoose = require("mongoose");
require("./Subject");
require("./Student");

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    lecturerName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["OPEN", "CLOSED"],
        default: "OPEN"
    },
    enrollments: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },
        status: {
            type: String,
            enum: ["enrolled", "dropped"],
            required: true
        },
        _id: false
    }]
});

module.exports = mongoose.models.Class || mongoose.model("Class", classSchema, "classes");
