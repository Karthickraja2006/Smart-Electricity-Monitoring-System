const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const User = require("./models/User");
const Usage = require("./models/Usage");
const Appliance = require("./models/Appliance");
const Contact = require("./models/Contact");

const app = express();
const PORT = 5000;
const RATE = 8;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));

mongoose.connect("mongodb://127.0.0.1:27017/SmartElectricity")
    .then(() => console.log("MongoDB connected"))
    .catch(error => console.log("MongoDB error:", error));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/home.html"));
});

// REGISTER
app.post("/register", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        await new User({ name, email, phone, password }).save();

        // Initial dashboard data for a new user
        await Usage.insertMany([
            { email, date: new Date().toISOString().slice(0, 10), usage: 8.5 }
        ]);

        await Appliance.insertMany([
            { email, name: "Fan", usage: 2.5 },
            { email, name: "Air Conditioner", usage: 4.0 },
            { email, name: "Refrigerator", usage: 1.2 },
            { email, name: "Television", usage: 0.8 }
        ]);

        res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            message: "Login successful!",
            user: { name: user.name, email: user.email, phone: user.phone }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET PROFILE
app.get("/profile/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select("name email phone");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE PROFILE
app.put("/profile/:email", async (req, res) => {
    try {
        const { name, phone } = req.body;
        if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" });

        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { name, phone },
            { new: true }
        ).select("name email phone");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Profile updated successfully!", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DASHBOARD SUMMARY
app.get("/dashboard/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const today = new Date().toISOString().slice(0, 10);
        const monthPrefix = today.slice(0, 7);

        const readings = await Usage.find({ email });
        const todayReadings = readings.filter(item => item.date === today);
        const monthlyReadings = readings.filter(item => item.date.startsWith(monthPrefix));

        const todayUsage = todayReadings.reduce((sum, item) => sum + item.usage, 0);
        const monthlyUsage = monthlyReadings.reduce((sum, item) => sum + item.usage, 0);

        res.json({
            todayUsage: Number(todayUsage.toFixed(2)),
            monthlyUsage: Number(monthlyUsage.toFixed(2)),
            cost: Number((todayUsage * RATE).toFixed(2)),
            rate: RATE,
            status: todayUsage >= 12 ? "High electricity consumption" : "Normal electricity consumption",
            percentage: Math.min(Math.round((todayUsage / 12) * 100), 100)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ADD USAGE - CREATE
app.post("/usage", async (req, res) => {
    try {
        const { email, date, usage } = req.body;
        if (!email || !date || usage === undefined || Number(usage) < 0) {
            return res.status(400).json({ message: "Valid email, date and usage are required" });
        }

        const reading = await new Usage({ email, date, usage: Number(usage) }).save();
        res.status(201).json({ message: "Usage added successfully!", reading });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET USAGE HISTORY
app.get("/usage/:email", async (req, res) => {
    try {
        const readings = await Usage.find({ email: req.params.email }).sort({ date: -1 });
        res.json(readings);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET APPLIANCES
app.get("/appliances/:email", async (req, res) => {
    try {
        const appliances = await Appliance.find({ email: req.params.email }).sort({ name: 1 });
        res.json(appliances);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ADD APPLIANCE - CREATE
app.post("/appliances", async (req, res) => {
    try {
        const { email, name, usage } = req.body;
        if (!email || !name || usage === undefined || Number(usage) < 0) {
            return res.status(400).json({ message: "Valid appliance details are required" });
        }

        const appliance = await new Appliance({ email, name, usage: Number(usage) }).save();
        res.status(201).json({ message: "Appliance added successfully!", appliance });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE APPLIANCE
app.put("/appliances/:id", async (req, res) => {
    try {
        const { name, usage } = req.body;
        const appliance = await Appliance.findByIdAndUpdate(
            req.params.id,
            { name, usage: Number(usage) },
            { new: true }
        );

        if (!appliance) return res.status(404).json({ message: "Appliance not found" });
        res.json({ message: "Appliance updated successfully!", appliance });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE APPLIANCE
app.delete("/appliances/:id", async (req, res) => {
    try {
        const appliance = await Appliance.findByIdAndDelete(req.params.id);
        if (!appliance) return res.status(404).json({ message: "Appliance not found" });
        res.json({ message: "Appliance deleted successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// CONTACT MESSAGE - CREATE
app.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        await new Contact({ name, email, subject, message }).save();
        res.status(201).json({ message: "Your message has been sent successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});