const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const UniversitySchema = new mongoose.Schema({
  universityId: { type: Number, unique: true },
  university: { type: String, required: true },
  faculty: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  about_university: { type: String },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
});

UniversitySchema.plugin(AutoIncrement, { inc_field: 'universityId' });

const University = mongoose.model('University', UniversitySchema);

module.exports = University;