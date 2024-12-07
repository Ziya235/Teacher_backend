const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const UserSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  speciality: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  experience: { type: String },
  about: { type: String },
  price: {
    type: Number,
    required: false, // Adjust as needed
  },
  phone: { type: String },
  dateOfBirth: {
    type: Date,
    default: null, // Allow null/undefined initially
  },
  avialable: { type: Boolean },

  profileImage: {
    type: String, // Path to the uploaded image
    default: null,
  },
});

// Add auto-increment plugin to the schema
UserSchema.plugin(AutoIncrement, { inc_field: "userId" });

const User = mongoose.model("Teacher", UserSchema);

module.exports = User;
