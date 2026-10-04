const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static(__dirname));


// =====================================================
// MONGODB CONNECTION
// =====================================================

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    console.error("❌ MONGO_URL is missing in .env file");
    process.exit(1);
}

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("=========================================");
        console.log("MongoDB connected successfully");
        console.log("=========================================");
    })
    .catch((error) => {
        console.error("❌ MongoDB connection failed:");
        console.error(error.message);
    });


// =====================================================
// STUDENT SCHEMA
// =====================================================

const studentSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            unique: true,
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        roll: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        college: {
            type: String,
            required: true,
            trim: true
        },

        year: {
            type: String,
            required: true,
            trim: true
        },

        branch: {
            type: String,
            required: true,
            trim: true
        },

        section: {
            type: String,
            required: true,
            trim: true
        },

        dob: {
            type: String,
            required: true
        },

        credentialId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Student = mongoose.model("Student", studentSchema);


// =====================================================
// ATTENDANCE SCHEMA
// =====================================================

const attendanceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        roll: {
            type: String,
            required: true
        },

        dateTime: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Attendance =
    mongoose.model("Attendance", attendanceSchema);


// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    if (
        username === "admin" &&
        password === "1234"
    ) {

        return res.json({
            success: true
        });

    }

    return res.json({

        success: false,

        message:
            "Invalid username or password"

    });

});


// =====================================================
// STUDENTS - GET
// =====================================================

app.get("/students", async (req, res) => {

    try {

        const students =
            await Student.find()
                .sort({ createdAt: 1 });

        res.json(students);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to load students."

        });

    }

});


// =====================================================
// STUDENTS - ADD
// =====================================================

app.post("/students", async (req, res) => {

    try {

        const {
            name,
            roll,
            college,
            year,
            branch,
            section,
            dob
        } = req.body;


        // Check required fields

        if (
            !name ||
            !roll ||
            !college ||
            !year ||
            !branch ||
            !section ||
            !dob
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all student details."

            });

        }


        // Check duplicate roll number

        const existingStudent =
            await Student.findOne({
                roll: String(roll).trim()
            });


        if (existingStudent) {

            return res.status(400).json({

                success: false,

                message:
                    "This Roll Number already exists."

            });

        }


        // Create student

        const newStudent =
            new Student({

                id: Date.now(),

                name:
                    String(name).trim(),

                roll:
                    String(roll).trim(),

                college:
                    String(college).trim(),

                year:
                    String(year).trim(),

                branch:
                    String(branch).trim(),

                section:
                    String(section).trim(),

                dob:
                    dob,

                credentialId:
                    null

            });


        await newStudent.save();


        res.json({

            success: true,

            message:
                "Student added successfully.",

            student:
                newStudent

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to add student."

        });

    }

});


// =====================================================
// FINGERPRINT ENROLLMENT
// =====================================================

app.put(
    "/students/:id/fingerprint",
    async (req, res) => {

        try {

            const studentId =
                req.params.id;

            const {
                credentialId
            } = req.body;


            if (!credentialId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Credential ID is required."

                });

            }


            const student =
                await Student.findOne({
                    id: Number(studentId)
                });


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found."

                });

            }


            student.credentialId =
                credentialId;


            await student.save();


            res.json({

                success: true,

                message:
                    "Fingerprint enrolled successfully."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Failed to save fingerprint."

            });

        }

    }
);


// =====================================================
// ATTENDANCE - GET
// =====================================================

app.get("/attendance", async (req, res) => {

    try {

        const records =
            await Attendance.find()
                .sort({ createdAt: -1 });

        res.json(records);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to load attendance."

        });

    }

});


// =====================================================
// ATTENDANCE - MARK
// =====================================================

app.post("/attendance", async (req, res) => {

    try {

        const {
            name,
            roll,
            dateTime
        } = req.body;


        if (!name || !roll || !dateTime) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance details are missing."

            });

        }


        // Today's date

        const today =
            new Date()
                .toLocaleDateString();


        // Get today's attendance

        const records =
            await Attendance.find({
                roll: String(roll)
            });


        const alreadyMarked =
            records.find(record => {

                return new Date(
                    record.dateTime
                ).toLocaleDateString() === today;

            });


        if (alreadyMarked) {

            return res.json({

                success: false,

                message:
                    "Attendance already marked today.",

                dateTime:
                    alreadyMarked.dateTime

            });

        }


        // Save attendance

        const newAttendance =
            new Attendance({

                name:
                    name,

                roll:
                    roll,

                dateTime:
                    dateTime

            });


        await newAttendance.save();


        res.json({

            success: true,

            message:
                "Attendance marked successfully."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to mark attendance."

        });

    }

});


// =====================================================
// TEST API
// =====================================================

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Student Biometric Attendance backend is working with MongoDB."

    });

});


// =====================================================
// SERVER
// =====================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================="
        );

        console.log(
            "Student Biometric Attendance System"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `Open: http://localhost:${PORT}`
        );

        console.log(
            "========================================="

        );

    }
);