const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    }
});

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema, "subjects");
