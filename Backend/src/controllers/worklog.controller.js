const Task = require('../models/task.model');
const DailyLog = require('../models/dailyLog.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');

// ── Helpers ─────────────────────────────────────────────────
function normalizeDate(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function classifyBreak(gap, startTime) {
  const hour = new Date(startTime).getHours();
  if (gap <= 20) return 'short';
  if (gap <= 60 && hour >= 12 && hour <= 14) return 'lunch';
  return 'extended';
}

// ── Rebuild DailyLog for a user+date ────────────────────────
async function rebuildDailyLog(userId, date) {
  const dayStart = normalizeDate(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const tasks = await Task.find({
    'workSessions.user': userId,
  }).populate('project', 'name');

  const sessions = [];
  for (const task of tasks) {
    for (const ws of task.workSessions) {
      if (ws.user.toString() !== userId.toString()) continue;
      const start = new Date(ws.startTime);
      const end = ws.endTime ? new Date(ws.endTime) : new Date();
      if (start >= dayEnd || end < dayStart) continue;
      const clampedStart = start < dayStart ? dayStart : start;
      const clampedEnd = end > dayEnd ? dayEnd : end;
      const dur = Math.round((clampedEnd - clampedStart) / 60000);
      if (dur <= 0) continue;
      sessions.push({
        task: task._id,
        taskTitle: task.title,
        project: task.project?._id || task.project,
        projectName: task.project?.name || '',
        startTime: clampedStart,
        endTime: ws.endTime ? clampedEnd : null,
        durationMinutes: dur,
      });
    }
  }

  sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const breaks = [];
  for (let i = 1; i < sessions.length; i++) {
    const prevEnd = sessions[i - 1].endTime || new Date();
    const currStart = new Date(sessions[i].startTime);
    const gap = Math.round((currStart - prevEnd) / 60000);
    if (gap > 2) {
      breaks.push({
        startTime: prevEnd,
        endTime: currStart,
        durationMinutes: gap,
        type: classifyBreak(gap, prevEnd),
      });
    }
  }

  const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);
  const firstActivity = sessions.length ? sessions[0].startTime : null;
  const lastActivity = sessions.length ? (sessions[sessions.length - 1].endTime || new Date()) : null;

  // Productivity score: simple hours-based for daily
  const targetMinutes = 480; // 8 hours
  const hoursScore = Math.min(totalMinutes / targetMinutes, 1.0) * 100;
  const productivityScore = Math.round(hoursScore);

  await DailyLog.findOneAndUpdate(
    { user: userId, date: dayStart },
    { totalMinutes, sessions, breaks, firstActivity, lastActivity, productivityScore },
    { upsert: true, new: true }
  );
}

// ── GET /my/daily?date= ─────────────────────────────────────
const getMyDaily = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date || new Date());
    await rebuildDailyLog(req.user._id, date);
    const log = await DailyLog.findOne({ user: req.user._id, date });
    res.json({ log: log || { totalMinutes: 0, sessions: [], breaks: [], productivityScore: 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch daily log.', error: err.message });
  }
};

// ── GET /my/chart?from=&to= ─────────────────────────────────
const getMyChart = async (req, res) => {
  try {
    const to = normalizeDate(req.query.to || new Date());
    const from = req.query.from ? normalizeDate(req.query.from) : new Date(to.getTime() - 13 * 86400000);
    const fromDate = normalizeDate(from);

    // Rebuild each day
    const days = [];
    const cursor = new Date(fromDate);
    while (cursor <= to) {
      await rebuildDailyLog(req.user._id, cursor);
      cursor.setDate(cursor.getDate() + 1);
    }

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: fromDate, $lte: to },
    }).sort({ date: 1 });

    const result = [];
    const c2 = new Date(fromDate);
    while (c2 <= to) {
      const dayStr = c2.toISOString().split('T')[0];
      const log = logs.find(l => normalizeDate(l.date).toISOString().split('T')[0] === dayStr);
      result.push({
        date: dayStr,
        day: c2.toLocaleDateString('en-US', { weekday: 'short' }),
        totalMinutes: log?.totalMinutes || 0,
        hours: Math.round((log?.totalMinutes || 0) / 60 * 100) / 100,
        score: log?.productivityScore || 0,
        isWeekend: c2.getDay() === 0 || c2.getDay() === 6,
      });
      c2.setDate(c2.getDate() + 1);
    }
    res.json({ chart: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chart data.', error: err.message });
  }
};

// ── GET /my/timeline?from=&to= ──────────────────────────────
const getMyTimeline = async (req, res) => {
  try {
    const to = normalizeDate(req.query.to || new Date());
    const from = req.query.from ? normalizeDate(req.query.from) : new Date(to.getTime() - 6 * 86400000);
    const fromDate = normalizeDate(from);

    const cursor = new Date(fromDate);
    while (cursor <= to) {
      await rebuildDailyLog(req.user._id, cursor);
      cursor.setDate(cursor.getDate() + 1);
    }

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: fromDate, $lte: to },
    }).sort({ date: -1 });

    res.json({ timeline: logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch timeline.', error: err.message });
  }
};

// ── GET /my/heatmap?months=3 ─────────────────────────────────
const getMyHeatmap = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const to = normalizeDate(new Date());
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: from, $lte: to },
    }).select('date totalMinutes');

    const heatmap = logs.map(l => ({
      date: l.date.toISOString().split('T')[0],
      minutes: l.totalMinutes,
      level: l.totalMinutes >= 420 ? 4 : l.totalMinutes >= 300 ? 3 : l.totalMinutes >= 180 ? 2 : l.totalMinutes > 0 ? 1 : 0,
    }));

    res.json({ heatmap });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch heatmap.', error: err.message });
  }
};

// ── GET /my/task-logs?date=&project= ─────────────────────────
const getMyTaskLogs = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date || new Date());
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const filter = { 'workSessions.user': req.user._id };
    if (req.query.project) filter.project = req.query.project;

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignee', 'name');

    const logs = [];
    for (const task of tasks) {
      for (const ws of task.workSessions) {
        if (ws.user.toString() !== req.user._id.toString()) continue;
        const start = new Date(ws.startTime);
        if (start < date || start >= dayEnd) continue;
        logs.push({
          taskId: task._id,
          taskTitle: task.title,
          status: task.status,
          projectName: task.project?.name || '',
          projectId: task.project?._id,
          startTime: ws.startTime,
          endTime: ws.endTime,
          durationMinutes: ws.endTime ? Math.round((new Date(ws.endTime) - start) / 60000) : null,
        });
      }
    }
    logs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task logs.', error: err.message });
  }
};

// ── Admin endpoints (same logic, different userId) ───────────
const adminWrapper = (handler) => async (req, res) => {
  req._targetUserId = req.params.userId;
  const origUser = req.user._id;
  req.user = { ...req.user, _id: req.params.userId };
  try {
    await handler(req, res);
  } finally {
    req.user._id = origUser;
  }
};

const getUserDaily = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date || new Date());
    await rebuildDailyLog(req.params.userId, date);
    const log = await DailyLog.findOne({ user: req.params.userId, date });
    res.json({ log: log || { totalMinutes: 0, sessions: [], breaks: [], productivityScore: 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

const getUserChart = async (req, res) => {
  req.user = { ...req.user, _id: req.params.userId };
  return getMyChart(req, res);
};

const getUserTimeline = async (req, res) => {
  req.user = { ...req.user, _id: req.params.userId };
  return getMyTimeline(req, res);
};

const getUserHeatmap = async (req, res) => {
  req.user = { ...req.user, _id: req.params.userId };
  return getMyHeatmap(req, res);
};

const getUserTaskLogs = async (req, res) => {
  req.user = { ...req.user, _id: req.params.userId };
  return getMyTaskLogs(req, res);
};

// ── GET /user/:userId/summary ────────────────────────────────
const getUserSummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const tasks = await Task.find({ assignee: userId });
    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const open = tasks.filter(t => t.status === 'OPEN').length;

    let totalWorkedMinutes = 0;
    for (const task of tasks) {
      for (const ws of task.workSessions) {
        if (ws.user.toString() !== userId) continue;
        const end = ws.endTime || new Date();
        totalWorkedMinutes += (end - new Date(ws.startTime)) / 60000;
      }
    }

    // Last 30 days logs for trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = await DailyLog.find({
      user: userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    const workedDays = recentLogs.filter(l => l.totalMinutes > 0).length;
    const avgDailyMinutes = workedDays > 0 ? recentLogs.reduce((s, l) => s + l.totalMinutes, 0) / workedDays : 0;

    // On-time rate
    const tasksWithDue = tasks.filter(t => t.dueDate && ['COMPLETED', 'CLOSED'].includes(t.status));
    const onTime = tasksWithDue.filter(t => new Date(t.updatedAt) <= new Date(t.dueDate)).length;
    const onTimeRate = tasksWithDue.length > 0 ? Math.round(onTime / tasksWithDue.length * 100) : 100;

    // Score trend (last 7 entries)
    const scoreTrend = recentLogs.slice(-7).map(l => ({ date: l.date, score: l.productivityScore }));

    res.json({
      user,
      summary: {
        totalTasks, completed, inProgress, open,
        totalWorkedMinutes: Math.round(totalWorkedMinutes),
        totalWorkedHours: Math.round(totalWorkedMinutes / 60 * 10) / 10,
        avgDailyHours: Math.round(avgDailyMinutes / 60 * 10) / 10,
        workedDays,
        onTimeRate,
        scoreTrend,
        overallScore: recentLogs.length > 0 ? Math.round(recentLogs.reduce((s, l) => s + l.productivityScore, 0) / recentLogs.length) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

// ── GET /live — Admin: who's working now ─────────────────────
const getLiveTracking = async (req, res) => {
  try {
    const tasks = await Task.find({ 'workSessions.endTime': null })
      .populate('assignee', 'name email')
      .populate('project', 'name');

    const active = [];
    for (const task of tasks) {
      for (const ws of task.workSessions) {
        if (ws.endTime) continue;
        const user = await User.findById(ws.user).select('name email');
        active.push({
          user: user,
          task: { _id: task._id, title: task.title },
          project: task.project?.name || '',
          startTime: ws.startTime,
          elapsedMinutes: Math.round((Date.now() - new Date(ws.startTime).getTime()) / 60000),
        });
      }
    }
    res.json({ active });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

// ── POST /user/:userId/sessions — Admin: add manual session ──
const addManualSession = async (req, res) => {
  try {
    const { taskId, startTime, endTime } = req.body;
    if (!taskId || !startTime || !endTime) {
      return res.status(400).json({ message: 'taskId, startTime, endTime required.' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.workSessions.push({
      user: req.params.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });
    await task.save();

    await rebuildDailyLog(req.params.userId, startTime);
    res.status(201).json({ message: 'Session added.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

// ── PATCH /sessions/:sessionId — Admin: edit session ─────────
const editSession = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const task = await Task.findOne({ 'workSessions._id': req.params.sessionId });
    if (!task) return res.status(404).json({ message: 'Session not found.' });

    const session = task.workSessions.id(req.params.sessionId);
    if (startTime) session.startTime = new Date(startTime);
    if (endTime) session.endTime = new Date(endTime);
    await task.save();

    await rebuildDailyLog(session.user, session.startTime);
    res.json({ message: 'Session updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

// ── DELETE /sessions/:sessionId — Admin: delete session ──────
const deleteSession = async (req, res) => {
  try {
    const task = await Task.findOne({ 'workSessions._id': req.params.sessionId });
    if (!task) return res.status(404).json({ message: 'Session not found.' });

    const session = task.workSessions.id(req.params.sessionId);
    const userId = session.user;
    const sessionDate = session.startTime;

    task.workSessions.pull(req.params.sessionId);
    await task.save();

    await rebuildDailyLog(userId, sessionDate);
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
};

module.exports = {
  rebuildDailyLog,
  getMyDaily, getMyChart, getMyTimeline, getMyHeatmap, getMyTaskLogs,
  getUserDaily, getUserChart, getUserTimeline, getUserHeatmap, getUserTaskLogs,
  getUserSummary, getLiveTracking,
  addManualSession, editSession, deleteSession,
};
