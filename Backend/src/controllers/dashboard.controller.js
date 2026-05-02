const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const now = new Date();

    if (req.user.role === 'ADMIN') {
      const [
        totalProjects,
        totalUsers,
        totalTasks,
        openCount,
        inProgressCount,
        closedCount,
        completedCount,
        overdueTasks,
        recentTasks,
      ] = await Promise.all([
        Project.countDocuments(),
        User.countDocuments(),
        Task.countDocuments(),
        Task.countDocuments({ status: 'OPEN' }),
        Task.countDocuments({ status: 'IN_PROGRESS' }),
        Task.countDocuments({ status: 'CLOSED' }),
        Task.countDocuments({ status: 'COMPLETED' }),
        Task.find({ dueDate: { $lt: now }, status: { $nin: ['CLOSED', 'COMPLETED'] } })
          .populate('project', 'name')
          .populate('assignee', 'name email')
          .sort({ dueDate: 1 })
          .limit(10),
        Task.find()
          .populate('project', 'name')
          .populate('assignee', 'name email')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        role: 'ADMIN',
        stats: {
          totalProjects,
          totalUsers,
          totalTasks,
          byStatus: { OPEN: openCount, IN_PROGRESS: inProgressCount, CLOSED: closedCount, COMPLETED: completedCount },
          overdueCount: overdueTasks.length,
        },
        overdueTasks,
        recentTasks,
      });
    } else {
      const myId = req.user._id;
      const [
        myTotal,
        myOpen,
        myInProgress,
        myClosed,
        myCompleted,
        myOverdue,
        upcomingTasks,
        myProjects,
      ] = await Promise.all([
        Task.countDocuments({ assignee: myId }),
        Task.countDocuments({ assignee: myId, status: 'OPEN' }),
        Task.countDocuments({ assignee: myId, status: 'IN_PROGRESS' }),
        Task.countDocuments({ assignee: myId, status: 'CLOSED' }),
        Task.countDocuments({ assignee: myId, status: 'COMPLETED' }),
        Task.find({
          assignee: myId,
          dueDate: { $lt: now },
          status: { $nin: ['CLOSED', 'COMPLETED'] },
        })
          .populate('project', 'name')
          .sort({ dueDate: 1 })
          .limit(5),
        Task.find({
          assignee: myId,
          dueDate: { $gte: now },
          status: { $nin: ['CLOSED', 'COMPLETED'] },
        })
          .populate('project', 'name')
          .sort({ dueDate: 1 })
          .limit(5),
        Project.find({ members: myId }).select('name description').limit(5),
      ]);

      return res.status(200).json({
        role: 'MEMBER',
        stats: {
          totalAssigned: myTotal,
          byStatus: { OPEN: myOpen, IN_PROGRESS: myInProgress, CLOSED: myClosed, COMPLETED: myCompleted },
          overdueCount: myOverdue.length,
        },
        overdueTasks: myOverdue,
        upcomingTasks,
        myProjects,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard.', error: err.message });
  }
};

module.exports = { getDashboard };
