const axios = require("axios");

// Smooth baseline values
let heartRate = 75 + Math.random() * 10;
let spo2 = 96 + Math.random() * 3;
let temperature = 36.4 + Math.random() * 0.6;

let respiratoryRate = 14 + Math.random() * 4;
let systolic = 120 + Math.random() * 10;
let diastolic = 80 + Math.random() * 5;

const ages = [22, 30, 35, 40, 50, 60];
const genders = ["Male", "Female"];
const weights = [55, 65, 75, 85];
const heights = [1.6, 1.7, 1.75, 1.8];

function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

function generateFakeData() {

    heartRate = clamp(heartRate + (Math.random() * 6 - 3), 50, 130);
    spo2 = clamp(spo2 + (Math.random() * 2 - 1), 85, 100);
    temperature = clamp(temperature + (Math.random() * 0.25 - 0.12), 35.8, 40);

    respiratoryRate = clamp(respiratoryRate + (Math.random() * 2 - 1), 10, 30);
    systolic = clamp(systolic + (Math.random() * 5 - 2), 100, 180);
    diastolic = clamp(diastolic + (Math.random() * 3 - 1.5), 60, 120);

    return {
        heart_rate: Math.round(heartRate),
        respiratory_rate: Math.round(respiratoryRate),
        temperature: Number(temperature.toFixed(2)),
        spo2: Math.round(spo2),
        systolic_bp: Math.round(systolic),
        diastolic_bp: Math.round(diastolic),

        age: ages[Math.floor(Math.random() * ages.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        weight: weights[Math.floor(Math.random() * weights.length)],
        height: heights[Math.floor(Math.random() * heights.length)],

        timestamp: new Date().toISOString()
    };
}

async function sendData() {
    const data = generateFakeData();
    console.log("📤 Sending:", data);

    try {
        await axios.post("http://localhost:5000/api/health-data", data);
        console.log("✔ Sent\n");
    } catch (err) {
        console.log("❌ Error:", err.message);
    }
}

setInterval(sendData, 5000);
