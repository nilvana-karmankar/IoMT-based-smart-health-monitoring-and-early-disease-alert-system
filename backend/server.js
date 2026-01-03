const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const HealthData = require("./models/HealthData");
require("dotenv").config();
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
    res.send("IoMT Backend Running...");
});

// Save Sensor Data + Predict
app.post("/api/health-data", async (req, res) => {
    try {
        const data = {
            heartRate: req.body.heart_rate,
            respiratoryRate: req.body.respiratory_rate,
            temperature: req.body.temperature,
            spo2: req.body.spo2,
            systolic: req.body.systolic_bp,
            diastolic: req.body.diastolic_bp,
            age: req.body.age,
            gender: req.body.gender,   // 🔥 FIXED: save string
            weight: req.body.weight,
            height: req.body.height,
            timestamp: req.body.timestamp
        };

        // Save to DB
        const saved = await HealthData.create(data);
        console.log("📥 Saved:", saved);

        // Prepare ML input (gender MUST be STRING)
        const input = [
            data.heartRate,
            data.respiratoryRate,
            data.temperature,
            data.spo2,
            data.systolic,
            data.diastolic,
            data.age,
            String(data.gender),   // 🔥 FIXED
            data.weight,
            data.height
        ].join(",");

        // Run Python Model
        exec(`python ./models/predict.py ${input}`, (error, stdout) => {
            if (error) {
                console.log("❌ Prediction Error:", error);
                return res.json({ saved, condition: "Prediction Failed" });
            }

            return res.json({
                saved,
                condition: stdout.trim()
            });
        });

    } catch (error) {
        console.log("❌ Error:", error);
        res.status(500).json({ error: "Failed to process data" });
    }
});

// 🔥 NEW: Direct ML Prediction Route (needed for React frontend)
app.post("/predict", async (req, res) => {
    try {
        const d = req.body;

        const input = [
            d.heartRate,
            d.respiratoryRate,
            d.temperature,
            d.spo2,
            d.systolic,
            d.diastolic,
            d.age,
            String(d.gender),     // 🔥 IMPORTANT
            d.weight,
            d.height
        ].join(",");

        exec(`python ./models/predict.py ${input}`, (error, stdout) => {
            if (error) {
                console.log("❌ Prediction Error:", error);
                return res.json({ condition: "Prediction Failed" });
            }

            return res.json({
                condition: stdout.trim()
            });
        });

    } catch (e) {
        console.log("❌ /predict error:", e);
        return res.status(500).json({ condition: "Error" });
    }
});

// Latest entry
app.get("/api/latest", async (req, res) => {
    const latest = await HealthData.findOne().sort({ timestamp: -1 });
    res.json(latest);
});

// Start Server
app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
});
