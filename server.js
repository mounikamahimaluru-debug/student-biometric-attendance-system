const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


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

    console.error(
        "❌ MONGO_URL is missing in .env file"
    );

} else {

    mongoose
        .connect(MONGO_URL)
        .then(() => {

            console.log(
                "========================================="
            );

            console.log(
                "✅ MongoDB connected successfully"
            );

            console.log(
                "========================================="
            );

        })
        .catch((error) => {

            console.error(
                "❌ MongoDB connection error:"
            );

            console.error(
                error.message
            );

        });

}


// =====================================================
// STUDENT SCHEMA
// =====================================================

const studentSchema = new mongoose.Schema(

    {

        id: {
            type: Number,
            required: true,
            unique: true
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
            default: "",
            trim: true
        },

        year: {
            type: String,
            default: "",
            trim: true
        },

        branch: {
            type: String,
            default: "",
            trim: true
        },

        section: {
            type: String,
            default: "",
            trim: true
        },

        dob: {
            type: String,
            default: ""
        },

        credentialId: {
            type: String,
            default: ""
        }

    },

    {
        timestamps: true
    }

);


const Student =
    mongoose.model(
        "Student",
        studentSchema
    );


// =====================================================
// ATTENDANCE SCHEMA
// =====================================================

const attendanceSchema =
    new mongoose.Schema(

        {

            name: {
                type: String,
                required: true,
                trim: true
            },

            roll: {
                type: String,
                required: true,
                trim: true
            },

            dateTime: {
                type: String,
                required: true
            },

            attendanceDate: {
                type: String,
                required: true
            },

            attendanceTime: {
                type: String,
                required: true
            }

        },

        {
            timestamps: true
        }

    );


// Prevent same roll number from being
// marked twice on the same date.

attendanceSchema.index(
    {
        roll: 1,
        attendanceDate: 1
    },
    {
        unique: true
    }
);


const Attendance =
    mongoose.model(
        "Attendance",
        attendanceSchema
    );


// =====================================================
// HOME PAGE
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// =====================================================
// LOGIN
// =====================================================

app.post(
    "/login",
    (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (
                username === "admin" &&
                password === "1234"
            ) {

                return res.json({

                    success: true,

                    message:
                        "Login successful"

                });

            }


            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password"

            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Login failed"

            });

        }

    }
);


// =====================================================
// GET ALL STUDENTS
// =====================================================

app.get(
    "/students",
    async (req, res) => {

        try {

            const students =
                await Student
                    .find()
                    .sort({
                        createdAt: -1
                    });


            return res.json(
                students
            );


        } catch (error) {

            console.error(
                "Get students error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to get students"

            });

        }

    }
);


// =====================================================
// ADD STUDENT
// =====================================================

app.post(
    "/students",
    async (req, res) => {

        try {

            const {
                id,
                name,
                roll,
                college,
                year,
                branch,
                section,
                dob
            } = req.body;


            // Required fields

            if (
                !name ||
                !roll
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Student name and roll number are required."

                });

            }


            const cleanName =
                String(name).trim();


            const cleanRoll =
                String(roll).trim();


            // Check duplicate roll

            const existingStudent =
                await Student.findOne({

                    roll:
                        cleanRoll

                });


            if (existingStudent) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Student with this roll number already exists."

                });

            }


            // Generate ID if not provided

            let studentId;


            if (id) {

                studentId =
                    Number(id);

            } else {

                studentId =
                    Date.now();

            }


            // Check duplicate ID

            const existingId =
                await Student.findOne({

                    id:
                        studentId

                });


            if (existingId) {

                studentId =
                    Date.now();

            }


            // Create student

            const student =
                new Student({

                    id:
                        studentId,

                    name:
                        cleanName,

                    roll:
                        cleanRoll,

                    college:
                        college
                            ? String(college).trim()
                            : "",

                    year:
                        year
                            ? String(year).trim()
                            : "",

                    branch:
                        branch
                            ? String(branch).trim()
                            : "",

                    section:
                        section
                            ? String(section).trim()
                            : "",

                    dob:
                        dob || "",

                    credentialId:
                        ""

                });


            await student.save();


            console.log(
                "========================================="
            );

            console.log(
                "Student added:"
            );

            console.log(
                `Name: ${student.name}`
            );

            console.log(
                `Roll: ${student.roll}`
            );

            console.log(
                "========================================="
            );


            return res.json({

                success: true,

                message:
                    "Student added successfully.",

                student:
                    student

            });


        } catch (error) {

            console.error(
                "Add student error:",
                error
            );


            // Duplicate MongoDB key

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Student ID or Roll Number already exists."

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Failed to add student."

            });

        }

    }
);


// =====================================================
// UPDATE FINGERPRINT
// =====================================================

app.put(
    "/students/:id/fingerprint",
    async (req, res) => {

        try {

            const studentId =
                Number(
                    req.params.id
                );


            const {
                credentialId
            } = req.body;


            if (!credentialId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Credential ID is missing."

                });

            }


            const student =
                await Student.findOne({

                    id:
                        studentId

                });


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found."

                });

            }


            student.credentialId =
                String(
                    credentialId
                );


            await student.save();


            console.log(
                "========================================="
            );

            console.log(
                "Fingerprint registered:"
            );

            console.log(
                `Name: ${student.name}`
            );

            console.log(
                `Roll: ${student.roll}`
            );

            console.log(
                "========================================="
            );


            return res.json({

                success: true,

                message:
                    "Fingerprint registered successfully.",

                student:
                    student

            });


        } catch (error) {

            console.error(
                "Fingerprint update error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to save fingerprint."

            });

        }

    }
);


// =====================================================
// GET ATTENDANCE RECORDS
// =====================================================

app.get(
    "/attendance",
    async (req, res) => {

        try {

            const records =
                await Attendance
                    .find()
                    .sort({
                        createdAt: -1
                    });


            return res.json(
                records
            );


        } catch (error) {

            console.error(
                "Get attendance error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to get attendance records."

            });

        }

    }
);


// =====================================================
// MARK ATTENDANCE
// =====================================================

app.post(
    "/attendance",
    async (req, res) => {

        try {

            const {
                name,
                roll
            } = req.body;


            // -----------------------------------------
            // CHECK DATA
            // -----------------------------------------

            if (
                !name ||
                !roll
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Attendance details are missing."

                });

            }


            const cleanName =
                String(name).trim();


            const cleanRoll =
                String(roll).trim();


            // -----------------------------------------
            // CURRENT DATE/TIME
            // INDIA TIMEZONE
            // -----------------------------------------

            const now =
                new Date();


            // -----------------------------------------
            // INDIA DATE
            // Example: 05/10/2026
            // -----------------------------------------

            const attendanceDate =
                new Intl.DateTimeFormat(
                    "en-IN",
                    {

                        timeZone:
                            "Asia/Kolkata",

                        day:
                            "2-digit",

                        month:
                            "2-digit",

                        year:
                            "numeric"

                    }
                ).format(now);


            // -----------------------------------------
            // INDIA TIME
            // Example: 10:30:45 AM
            // -----------------------------------------

            const attendanceTime =
                new Intl.DateTimeFormat(
                    "en-IN",
                    {

                        timeZone:
                            "Asia/Kolkata",

                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        second:
                            "2-digit",

                        hour12:
                            true

                    }
                ).format(now);


            const dateTime =
                `${attendanceDate}, ${attendanceTime}`;


            console.log(
                "========================================="
            );

            console.log(
                "Attendance request received"
            );

            console.log(
                `Name: ${cleanName}`
            );

            console.log(
                `Roll: ${cleanRoll}`
            );

            console.log(
                `Date: ${attendanceDate}`
            );

            console.log(
                `Time: ${attendanceTime}`
            );

            console.log(
                "========================================="
            );


            // -----------------------------------------
            // CHECK ALREADY ATTENDED TODAY
            // -----------------------------------------

            const alreadyMarked =
                await Attendance.findOne({

                    roll:
                        cleanRoll,

                    attendanceDate:
                        attendanceDate

                });


            if (alreadyMarked) {

                console.log(
                    `⚠️ Already attended: ${cleanName} | ${cleanRoll}`
                );


                return res.json({

                    success: false,

                    alreadyAttended:
                        true,

                    message:
                        "Attendance already marked today.",

                    dateTime:
                        alreadyMarked.dateTime,

                    attendanceDate:
                        alreadyMarked.attendanceDate,

                    attendanceTime:
                        alreadyMarked.attendanceTime

                });

            }


            // -----------------------------------------
            // CREATE ATTENDANCE RECORD
            // -----------------------------------------

            const newAttendance =
                new Attendance({

                    name:
                        cleanName,

                    roll:
                        cleanRoll,

                    dateTime:
                        dateTime,

                    attendanceDate:
                        attendanceDate,

                    attendanceTime:
                        attendanceTime

                });


            await newAttendance.save();


            console.log(
                "========================================="
            );

            console.log(
                "✅ ATTENDANCE MARKED"
            );

            console.log(
                `Name: ${cleanName}`
            );

            console.log(
                `Roll: ${cleanRoll}`
            );

            console.log(
                `Date: ${attendanceDate}`
            );

            console.log(
                `Time: ${attendanceTime}`
            );

            console.log(
                "========================================="
            );


            return res.json({

                success: true,

                alreadyAttended:
                    false,

                message:
                    "Attendance marked successfully.",

                dateTime:
                    dateTime,

                attendanceDate:
                    attendanceDate,

                attendanceTime:
                    attendanceTime

            });


        } catch (error) {

            console.error(
                "Attendance error:",
                error
            );


            // -----------------------------------------
            // DUPLICATE KEY PROTECTION
            // -----------------------------------------

            if (
                error.code === 11000
            ) {

                try {

                    const {
                        roll
                    } = req.body;


                    const cleanRoll =
                        String(
                            roll
                        ).trim();


                    const now =
                        new Date();


                    const attendanceDate =
                        new Intl.DateTimeFormat(
                            "en-IN",
                            {

                                timeZone:
                                    "Asia/Kolkata",

                                day:
                                    "2-digit",

                                month:
                                    "2-digit",

                                year:
                                    "numeric"

                            }
                        ).format(now);


                    const existing =
                        await Attendance.findOne({

                            roll:
                                cleanRoll,

                            attendanceDate:
                                attendanceDate

                        });


                    if (existing) {

                        return res.json({

                            success: false,

                            alreadyAttended:
                                true,

                            message:
                                "Attendance already marked today.",

                            dateTime:
                                existing.dateTime,

                            attendanceDate:
                                existing.attendanceDate,

                            attendanceTime:
                                existing.attendanceTime

                        });

                    }

                } catch (
                    duplicateError
                ) {

                    console.error(
                        duplicateError
                    );

                }

            }


            return res.status(500).json({

                success: false,

                message:
                    "Failed to mark attendance."

            });

        }

    }
);


// =====================================================
// TODAY ATTENDANCE
// =====================================================

app.get(
    "/attendance/today",
    async (req, res) => {

        try {

            const now =
                new Date();


            const today =
                new Intl.DateTimeFormat(
                    "en-IN",
                    {

                        timeZone:
                            "Asia/Kolkata",

                        day:
                            "2-digit",

                        month:
                            "2-digit",

                        year:
                            "numeric"

                    }
                ).format(now);


            const records =
                await Attendance
                    .find({
                        attendanceDate:
                            today
                    })
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                date:
                    today,

                count:
                    records.length,

                records:
                    records

            });


        } catch (error) {

            console.error(
                "Today attendance error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to get today's attendance."

            });

        }

    }
);


// =====================================================
// API TEST
// =====================================================

app.get(
    "/api/test",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "Student Biometric Attendance API is working.",

            time:
                new Date().toISOString()

        });

    }
);


// =====================================================
// 404 HANDLER
// =====================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API route not found."

        });

    }
);


// =====================================================
// START SERVER
// =====================================================

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