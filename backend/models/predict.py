import sys
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load saved objects
model = joblib.load(os.path.join(BASE_DIR, "health_condition_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
gender_encoder = joblib.load(os.path.join(BASE_DIR, "gender_encoder.pkl"))
condition_encoder = joblib.load(os.path.join(BASE_DIR, "condition_encoder.pkl"))

# Read input
raw = sys.argv[1].split(",")

# Extract gender as string
gender_str = raw[7]

# Convert gender using encoder
gender_val = gender_encoder.transform([gender_str])[0]

# Replace gender string with encoded number
raw[7] = str(gender_val)

# Convert all to float
values = [float(x) for x in raw]

# Scale
scaled = scaler.transform([values])

# Predict
pred = model.predict(scaled)[0]

# Decode label
final_label = condition_encoder.inverse_transform([pred])[0]

print(final_label)
