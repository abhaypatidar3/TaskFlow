const mongoose = require('mongoose');

const sessionEntrySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  taskTitle: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectName: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
}, { _id: false });

const breakEntrySchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number, default: 0 },
  type: { type: String, enum: ['short', 'lunch', 'extended'], default: 'short' },
}, { _id: false });

const dailyLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // normalized to midnight
    totalMinutes: { type: Number, default: 0 },
    sessions: [sessionEntrySchema],
    breaks: [breakEntrySchema],
    firstActivity: { type: Date, default: null },
    lastActivity: { type: Date, default: null },
    productivityScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound unique index: one log per user per day
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
