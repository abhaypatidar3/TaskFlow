const { validationResult } = require('express-validator');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'ADMIN') {
      query = Project.find();
    } else {
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ projects });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects.', error: err.message });
  }
};

// POST /api/projects — Admin only
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
    });

    const populated = await project.populate('owner', 'name email');
    res.status(201).json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project.', error: err.message });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Members can only see projects they belong to
    if (req.user.role !== 'ADMIN') {
      const isMember = project.members.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied. Not a project member.' });
      }
    }

    res.status(200).json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project.', error: err.message });
  }
};

// PATCH /api/projects/:id — Admin only
const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.status(200).json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project.', error: err.message });
  }
};

// DELETE /api/projects/:id — Admin only
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Cascade delete tasks
    await Task.deleteMany({ project: req.params.id });

    res.status(200).json({ message: 'Project and its tasks deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project.', error: err.message });
  }
};

// POST /api/projects/:id/members — Admin only
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const [project, user] = await Promise.all([
      Project.findById(req.params.id),
      User.findById(userId),
    ]);

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const alreadyMember = project.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(409).json({ message: 'User is already a project member.' });
    }

    project.members.push(userId);
    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.status(200).json({ project: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member.', error: err.message });
  }
};

// DELETE /api/projects/:id/members/:userId — Admin only
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();

    // Unassign tasks from removed member in this project
    await Task.updateMany(
      { project: req.params.id, assignee: req.params.userId },
      { $set: { assignee: null } }
    );

    const updated = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.status(200).json({ project: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove member.', error: err.message });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
