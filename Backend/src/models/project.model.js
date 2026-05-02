const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Ensure owner is always a member
projectSchema.pre('save', function () {
  const ownerStr = this.owner.toString();
  const alreadyMember = this.members.some((m) => m.toString() === ownerStr);
  if (!alreadyMember) {
    this.members.push(this.owner);
  }
});

module.exports = mongoose.model('Project', projectSchema);
