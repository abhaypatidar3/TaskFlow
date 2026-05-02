const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'CLOSED', 'COMPLETED'], default: null },
  type: { type: String, enum: ['comment', 'status_change', 'assignee_change', 'system'], default: 'comment' },
  createdAt: { type: Date, default: Date.now },
});

const workSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date, default: null },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'CLOSED', 'COMPLETED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: [commentSchema],
    workSessions: [workSessionSchema],
  },
  { timestamps: true }
);

// Virtual: calculated worked hours
taskSchema.virtual('workedHours').get(function () {
  let total = 0;
  for (const session of this.workSessions) {
    const end = session.endTime || new Date();
    total += (end - session.startTime) / (1000 * 60 * 60);
  }
  return Math.round(total * 100) / 100;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
