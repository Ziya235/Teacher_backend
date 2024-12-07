require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model.js");
const University = require("./models/education.modal.js");
const Experience = require("./models/experience.modal.js");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities.js");

app.use(express.json());

app.use(
  cors({
    origin: "*", // or '*' to allow all origins
  })
);

app.get("/", (req, res) => {
  res.json({ data: " hello" });
});


const path = require("path");
const multer = require("multer");
const fs = require("fs");

app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads/profile-images");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile-images/"); // Destination folder for profile images
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      ),
      false
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Account creation route with image upload
app.post("/create-account", upload.single("profileImage"), async (req, res) => {
  try {
    const {
      name,
      surname,
      email,
      speciality,
      password,
      experience,
      about,
      price,
      phone,
      available,
      dateOfBirth,
    } = req.body;

    // Existing validation checks
    if (!name) {
      return res
        .status(400)
        .json({ error: true, message: "Full name is required" });
    }
    if (!surname) {
      return res
        .status(400)
        .json({ error: true, message: "Surname is required" });
    }
    if (!email) {
      return res
        .status(400)
        .json({ error: true, message: "Email is required" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ error: true, message: "Password is required" });
    }

    // Check if user already exists
    const isUser = await User.findOne({ email: email });
    if (isUser) {
      return res
        .status(400)
        .json({ error: true, message: "User already exists" });
    }

    // Prepare user data
    const userData = {
      name,
      surname,
      speciality,
      email,
      password,
      experience,
      about,
      price,
      phone,
      dateOfBirth,
      available,
    };

    // Add profile image path if uploaded
    if (req.file) {
      userData.profileImage = req.file.path;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate access token
    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    // Respond with user data and token
    return res.status(201).json({
      error: false,
      user: {
        ...user.toObject(),
        userId: user.userId,
        profileImage: user.profileImage || null,
        teacher_id: user._id,
      },
      accessToken,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred during registration",
    });
  }
});

/* Login */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const userInfo = await User.findOne({ email: email });

  if (!userInfo) {
    return res.status(400).json({ message: "User not found" });
  }

  if (userInfo.email === email && userInfo.password === password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    return res.json({
      error: false,
      message: "Login Successful",
      user: {
        id: userInfo.userId, // Include the user ID in the response
        email: userInfo.email,
        teacher_id: userInfo._id,
      },
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid credentials",
    });
  }
});

// Get all Teachers

app.get("/get-all-teacher", async (req, res) => {
  try {
    // Retrieve all users from the database
    // You can use .select() to exclude sensitive information like password
    const users = await User.find().select("-password");

    return res.json({
      error: false,
      users: users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to retrieve users",
    });
  }
});

//Update Profil
// Update profile route with image upload
app.put(
  "/update-profile",
  authenticateToken,
  upload.single("profileImage"),


  
  async (req, res) => {
    try {
      const {
        name,
        surname,
        speciality,
        experience,
        about,
        price,
        phone,
        dateOfBirth,
        available,
      } = req.body;

      if (!name || !surname) {
        return res.status(400).json({
          error: true,
          message: "Name and surname are required.",
        });
      }
      // Extract user ID from the authenticated token
      const userId = req.user.user._id;

      // Find the user by MongoDB _id
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: true,
          message: "User not found",
        });
      }

      // Update fields if they are provided in the request
      if (name) user.name = name;
      if (surname) user.surname = surname;
      if (speciality) user.speciality = speciality;
      
      if (experience !== undefined) {
        user.experience = experience;
      }

      if (about !== undefined) {
        user.about = about;
      }

      user.price = price;
      if (phone !== undefined) user.phone = phone;

      // Handle dateOfBirth
      if (dateOfBirth !== undefined) {
        if (dateOfBirth === null || dateOfBirth === "") {
          user.dateOfBirth = null;
        } else {
          try {
            const parsedDate = new Date(dateOfBirth);
            if (!isNaN(parsedDate.getTime())) {
              user.dateOfBirth = parsedDate;
            } else {
              return res.status(400).json({
                error: true,
                message: "Invalid date format",
              });
            }
          } catch (dateError) {
            console.error("Date parsing error:", dateError);
            return res.status(400).json({
              error: true,
              message: "Failed to parse date",
            });
          }
        }
      }

      // Handle profile image upload
      if (req.file) {
        // Remove old profile image if exists
        if (user.profileImage) {
          try {
            fs.unlinkSync(user.profileImage);
          } catch (err) {
            console.error("Error deleting old profile image:", err);
          }
        }

        // Update user's profile image path
        user.profileImage = req.file.path;
      }

      if (available !== undefined) user.available = available;

      // Save the updated user
      await user.save();

      // Respond with updated user information
      return res.json({
        error: false,
        user: {
          _id: user._id,
          name: user.name,
          surname: user.surname,
          speciality: user.speciality,
          experience: user.experience,
          about: user.about,
          price: user.price,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          available: user.available,
          profileImage: user.profileImage || null,
        },
        message: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({
        error: true,
        message: "Failed to update profile",
      });
    }
  }
);

// Get user based on Id
app.get("/get-user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by the custom userId, excluding password
    const user = await User.findOne({ userId: userId }).select("-password");

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    return res.json({
      error: false,
      user: user,
      message: "User retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to retrieve user",
    });
  }
});

app.get("/get-teacher/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get  Teacher --- Your Profile

app.get("/get-teacher", authenticateToken, async (req, res) => {
  const { user } = req.user;

  const isUser = await User.findOne({ _id: user._id });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: {
      name: isUser.name,
      surname: isUser.surname,
      speciality: isUser.speciality,
      email: isUser.email,
      _id: isUser._id,
      createdOn: isUser.createdOn,
    },
    message: "",
  });
});

// add university

app.post("/create-university", authenticateToken, async (req, res) => {
  try {
    const { university, faculty, startDate, endDate, about_university } =
      req.body;

    // Validate required fields
    if (!university) {
      return res.status(400).json({
        error: true,
        message: "University name is required",
      });
    }

    if (!faculty) {
      return res.status(400).json({
        error: true,
        message: "Faculty is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        error: true,
        message: "Start date is required",
      });
    }

    // Get teacher ID from authenticated token
    const teacherId = req.user.user._id;

    // Create new university entry
    const universityEntry = new University({
      university,
      faculty,
      startDate: new Date(startDate),
      ...(endDate && { endDate: new Date(endDate) }), // Conditionally add endDate
      about_university,
      teacherId,
    });

    // Save the university entry
    await universityEntry.save();

    // Prepare response object
    const responseData = {
      error: false,
      university: {
        universityId: universityEntry.universityId,
        university: universityEntry.university,
        faculty: universityEntry.faculty,
        startDate: universityEntry.startDate,
        ...(endDate && { endDate: universityEntry.endDate }), // Conditionally add endDate to response
        about_university: universityEntry.about_university,
      },
      message: "University entry created successfully",
    };

    return res.status(201).json(responseData);
  } catch (error) {
    console.error("Create university error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to create university entry",
    });
  }
});

// get universtiy by teacher ID

app.get("/get-teacher-universities/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate if the teacherId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid teacher ID",
      });
    }

    // Convert to MongoDB ObjectId
    const validTeacherId = new mongoose.Types.ObjectId(teacherId);

    // Find all universities for this teacher
    const universities = await University.find({ teacherId: validTeacherId });

    // Check if any universities exist
    if (universities.length === 0) {
      return res.status(404).json({
        error: true,
        message: "No universities found for this teacher",
      });
    }

    return res.json({
      error: false,
      universities: universities.map((uni) => ({
        universityId: uni.universityId,
        university: uni.university,
        faculty: uni.faculty,
        startDate: uni.startDate,
        endDate: uni.endDate,
        about_university: uni.about_university,
      })),
      message: "Universities retrieved successfully",
    });
  } catch (error) {
    console.error("Get teacher universities error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to retrieve universities",
    });
  }
});

// Add Experience
app.post("/create-experience", authenticateToken, async (req, res) => {
  try {
    const { company_name, position, startDate, endDate, about_experience } =
      req.body;

    // Validate required fields
    if (!company_name) {
      return res.status(400).json({
        error: true,
        message: "Company name is required",
      });
    }

    if (!position) {
      return res.status(400).json({
        error: true,
        message: "Position is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        error: true,
        message: "Start date is required",
      });
    }

    // Get teacher ID from authenticated token
    const teacherId = req.user.user._id;

    // Create new experience entry
    const experienceEntry = new Experience({
      company_name,
      position,
      startDate: new Date(startDate),
      ...(endDate && { endDate: new Date(endDate) }), // Conditionally add endDate
      about_experience,
      teacherId,
    });

    // Save the experience entry
    await experienceEntry.save();

    // Respond with the created experience entry
    return res.status(201).json({
      error: false,
      experience: {
        experienceId: experienceEntry._id,
        company_name: experienceEntry.company_name,
        position: experienceEntry.position,
        startDate: experienceEntry.startDate,
        endDate: experienceEntry.endDate,
        about_experience: experienceEntry.about_experience,
      },
      message: "Experience entry created successfully",
    });
  } catch (error) {
    console.error("Create experience error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to create experience entry",
    });
  }
});

// Get Experiences by Teacher ID
app.get("/get-teacher-experiences/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate that the teacherId is provided
    if (!teacherId) {
      return res.status(400).json({
        error: true,
        message: "Teacher ID is required",
      });
    }

    // Find experiences for the specific teacher
    const experiences = await Experience.find({ teacherId: teacherId });

    // Check if any experiences exist for this teacher
    if (experiences.length === 0) {
      return res.status(404).json({
        error: true,
        message: "No experiences found for this teacher",
      });
    }

    // Return the experiences
    return res.json({
      error: false,
      experiences: experiences,
      message: "Teacher experiences retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving teacher experiences:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to retrieve teacher experiences",
    });
  }
});

app.listen(5000);

module.exports = app;
