const mongoose = require("mongoose");

const healthSchema = new mongoose.Schema({
    heartRate: Number,
    respiratoryRate: Number,
    temperature: Number,
    spo2: Number,
    systolic: Number,
    diastolic: Number,

    age: Number,
    gender: { type: String },   // FIXED: no 1/0, only "Male" / "Female"
    weight: Number,
    height: Number,

    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HealthData", healthSchema);
