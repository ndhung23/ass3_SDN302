const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema, "students");
