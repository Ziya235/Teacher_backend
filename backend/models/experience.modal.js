const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ExperienceSchema = new mongoose.Schema({
  experienceId: { type: Number, unique: true },
  company_name: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date},
  about_experience: { type: String },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
});

ExperienceSchema.plugin(AutoIncrement, { inc_field: 'experienceId' });

const Experience = mongoose.model('Experience', ExperienceSchema);

module.exports = Experience;