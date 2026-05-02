const { validationResult } = require('express-validator');
const Task = require('../models/task.model');
const Project = require('../models/project.model');
const { rebuildDailyLog } = require('./worklog.controller');

// Helper: populate task fully
const populateTask = (query) =>
  query
    .populate('creator', 'name email')
    .populate('assignee', 'name email')
    .populate('project', 'name')
    .populate('comments.user', 'name email');

// Helper: verify user has project access
const checkProjectAccess = async (projectId, userId, role) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found.', status: 404 };
  if (role !== 'ADMIN') {
    const isMember = project.members.some((m) => m.toString() === userId.toString());
    if (!isMember) return { error: 'Access denied. Not a project member.', status: 403 };
  }
  return { project };
};

// GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res) => {
  try {
    const access = await checkProjectAccess(req.params.projectId, req.user._id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const { status, priority, assignee } = req.query;
    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await populateTask(Task.find(filter)).sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
};

// POST /api/tasks/project/:projectId — Admin only
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const { title, description, priority, dueDate, assigneeId, estimatedHours } = req.body;

    if (assigneeId) {
      const isMember = project.members.some((m) => m.toString() === assigneeId);
      if (!isMember) return res.status(400).json({ message: 'Assignee must be a project member.' });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      estimatedHours: estimatedHours || 0,
      project: req.params.projectId,
      creator: req.user._id,
      assignee: assigneeId || null,
      comments: [{
        user: req.user._id,
        text: 'Task created.',
        status: 'OPEN',
        type: 'system',
      }],
    });

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task.', error: err.message });
  }
};

// GET /api/tasks/:id — Single task detail
const getTaskById = async (req, res) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Check access
    if (req.user.role !== 'ADMIN') {
      const project = await Project.findById(task.project._id || task.project);
      const isMember = project?.members.some((m) => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task.', error: err.message });
  }
};

// PATCH /api/tasks/:id — Admin: update any field. Assignee: limited
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const isAdmin = req.user.role === 'ADMIN';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (!isAdmin) {
      return res.status(403).json({ message: 'Members can only update tasks via comments and timer.' });
    }

    const { title, description, priority, dueDate, assignee, estimatedHours } = req.body;

    // Track assignee change
    if (assignee !== undefined && assignee !== task.assignee?.toString()) {
      task.comments.push({
        user: req.user._id,
        text: `Assignee changed.`,
        type: 'assignee_change',
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (assignee !== undefined) task.assignee = assignee || null;

    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.status(200).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task.', error: err.message });
  }
};

// DELETE /api/tasks/:id — Admin only
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task.', error: err.message });
  }
};

// GET /api/tasks/my — Member: tasks assigned to me
const getMyTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = { assignee: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await populateTask(Task.find(filter)).sort({ dueDate: 1, createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your tasks.', error: err.message });
  }
};

// GET /api/tasks — Admin: all tasks with project filter
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, project } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;

    const tasks = await populateTask(Task.find(filter)).sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
};

// POST /api/tasks/:id/comments — Add comment + optional status change
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const isAdmin = req.user.role === 'ADMIN';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Only admin or assignee can comment.' });
    }

    const { text, status } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required.' });

    const comment = { user: req.user._id, text: text.trim(), type: 'comment' };
    if (status) {
      comment.status = status;
      comment.type = 'status_change';
      task.status = status; // Latest comment status → task status

      // Auto-start work session on IN_PROGRESS
      if (status === 'IN_PROGRESS') {
        const alreadyActive = task.workSessions.find(
          (s) => s.user.toString() === req.user._id.toString() && !s.endTime
        );
        if (!alreadyActive) {
          task.workSessions.push({ user: req.user._id, startTime: new Date() });
        }
      }

      // Auto-stop active work sessions on CLOSED/COMPLETED
      if (status === 'CLOSED' || status === 'COMPLETED') {
        task.workSessions.forEach((s) => {
          if (!s.endTime) s.endTime = new Date();
        });
      }
    }

    task.comments.push(comment);
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment.', error: err.message });
  }
};

// POST /api/tasks/:id/start — Start work session
const startWork = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    if (!isAssignee && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the assignee can start work.' });
    }

    // Check no active session
    const active = task.workSessions.find(
      (s) => s.user.toString() === req.user._id.toString() && !s.endTime
    );
    if (active) return res.status(400).json({ message: 'Timer already running.' });

    task.workSessions.push({ user: req.user._id, startTime: new Date() });

    // Auto-set status to IN_PROGRESS
    if (task.status === 'OPEN') {
      task.status = 'IN_PROGRESS';
      task.comments.push({
        user: req.user._id,
        text: 'Started working on task.',
        status: 'IN_PROGRESS',
        type: 'status_change',
      });
    }

    await task.save();
    await rebuildDailyLog(req.user._id, new Date());
    const populated = await populateTask(Task.findById(task._id));
    res.status(200).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start timer.', error: err.message });
  }
};

// POST /api/tasks/:id/stop — Stop work session
const stopWork = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const active = task.workSessions.find(
      (s) => s.user.toString() === req.user._id.toString() && !s.endTime
    );
    if (!active) return res.status(400).json({ message: 'No active timer to stop.' });

    active.endTime = new Date();
    await task.save();
    await rebuildDailyLog(req.user._id, new Date());

    const populated = await populateTask(Task.findById(task._id));
    res.status(200).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop timer.', error: err.message });
  }
};

// PATCH /api/tasks/:id/assign — Reassign task (admin + assignee)
const reassignTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const isAdmin = req.user.role === 'ADMIN';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Only admin or current assignee can reassign.' });
    }

    const { assigneeId } = req.body;

    // Verify new assignee is a project member
    if (assigneeId) {
      const project = await Project.findById(task.project);
      const isMember = project?.members.some((m) => m.toString() === assigneeId);
      if (!isMember) return res.status(400).json({ message: 'New assignee must be a project member.' });
    }

    const User = require('../models/user.model');
    const newUser = assigneeId ? await User.findById(assigneeId).select('name') : null;
    const oldUser = task.assignee ? await User.findById(task.assignee).select('name') : null;

    task.comments.push({
      user: req.user._id,
      text: `Reassigned from ${oldUser?.name || 'Unassigned'} to ${newUser?.name || 'Unassigned'}.`,
      type: 'assignee_change',
    });

    task.assignee = assigneeId || null;
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.status(200).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reassign task.', error: err.message });
  }
};

module.exports = {
  getTasksByProject,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  getAllTasks,
  addComment,
  startWork,
  stopWork,
  reassignTask,
};
