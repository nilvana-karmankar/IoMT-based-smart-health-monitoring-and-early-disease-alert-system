import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const BACKEND = "http://localhost:5000";

function App() {
  const [healthData, setHealthData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mlCondition, setMlCondition] = useState("");
  const [mlLoading, setMlLoading] = useState(false);
  const [lastPredictionAt, setLastPredictionAt] = useState(null);

  const conditionColors = {
    Normal: "#28a745",
    Fever: "#ff8c00",
    LowSpO2: "#8a2be2",
    Tachycardia: "#ff0000",
    Bradycardia: "#007bff",
    Emergency: "#b30000"
  };

  function checkAlerts(data) {
    if (!data) return [];
    const a = [];
    if (data.heartRate < 60) a.push("⚠ Low Heart Rate Detected!");
    if (data.heartRate > 100) a.push("⚠ High Heart Rate Detected!");
    if (data.spo2 < 94) a.push("⚠ Low SpO₂ Levels! Possible Hypoxia.");
    if (data.temperature > 37.5) a.push("⚠ High Temperature! Possible Fever.");
    return a;
  }

  // Helper function
  function getValue(obj, keys, fallback = 0) {
    for (let key of keys) {
      if (obj[key] !== undefined) return obj[key];
    }
    return fallback;
  }

  // Build payload for ML API
  function buildPredictPayload(latest) {
    if (!latest) return null;

    const heartRate = getValue(latest, ["heartRate"]);
    const respiratoryRate = getValue(latest, ["respiratoryRate"]);
    const temperature = getValue(latest, ["temperature"]);
    const spo2 = getValue(latest, ["spo2"]);
    const systolic = getValue(latest, ["systolic"]);
    const diastolic = getValue(latest, ["diastolic"]);
    const age = getValue(latest, ["age"], 30);

    let gender = latest.gender ?? "Male";

    const weight = getValue(latest, ["weight"], 70);
    const height = getValue(latest, ["height"], 1.7);

    return {
      heartRate,
      respiratoryRate,
      temperature,
      spo2,
      systolic,
      diastolic,
      age,
      gender,
      weight,
      height
    };
  }

  async function runPrediction(payload) {
    if (!payload) return;
    setMlLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/predict`, payload);
      setMlCondition(res.data.condition || "Unknown");
      setLastPredictionAt(new Date().toISOString());
    } catch {
      setMlCondition("Error");
    } finally {
      setMlLoading(false);
    }
  }

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/latest`);
      const latest = res.data;

      setHealthData((prev) => [...prev.slice(-19), latest]);
      setAlerts(checkAlerts(latest));

      const payload = buildPredictPayload(latest);
      await runPrediction(payload);
    } catch (err) {
      console.error("Fetch latest error:", err.message);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const latest = healthData.length ? healthData[healthData.length - 1] : null;

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>IoMT Health Monitoring Dashboard</h2>

      {alerts.length > 0 && (
        <div style={{
          background: "#ffefef",
          padding: 12,
          border: "1px solid #ff4d4d",
          borderRadius: 8,
          marginBottom: 12
        }}>
          <h4 style={{ margin: 0, color: "#b30000" }}>⚠ Health Alerts</h4>
          <ul style={{ margin: "8px 0 0" }}>
            {alerts.map((a, i) => (
              <li key={i} style={{ color: "#660000" }}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div style={{
          padding: 12,
          borderRadius: 10,
          background: mlCondition ? (conditionColors[mlCondition] || "#ddd") : "#f0f0f0",
          color: mlCondition ? "#fff" : "#333",
          minWidth: 220
        }}>
          <h4 style={{ margin: "0 0 6px" }}>🤖 ML Predicted Condition</h4>
          <div style={{ fontWeight: "700", fontSize: 18 }}>
            {mlLoading ? "Predicting..." : (mlCondition || "No data")}
          </div>

          {lastPredictionAt && (
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              Last: {new Date(lastPredictionAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <button
          onClick={() => runPrediction(buildPredictPayload(latest))}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: "#1976d2",
            color: "white",
            cursor: "pointer"
          }}
        >
          Re-run ML now
        </button>
      </div>

      {latest && (
        <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
          <StatCard title="Heart Rate" value={`${latest.heartRate} bpm`} />
          <StatCard title="SpO₂" value={`${latest.spo2} %`} />
          <StatCard title="Temperature" value={`${latest.temperature} °C`} />
          <StatCard title="BP" value={`${latest.systolic}/${latest.diastolic} mmHg`} />
        </div>
      )}

      <h3>Real-time Vitals Graph (last 20)</h3>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="heartRate" stroke="#ff4d4d" dot={false} />
            <Line type="monotone" dataKey="spo2" stroke="#3b82f6" dot={false} />
            <Line type="monotone" dataKey="temperature" stroke="#10b981" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: "#f8fafc",
      minWidth: 160,
      textAlign: "center",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)"
    }}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default App;
