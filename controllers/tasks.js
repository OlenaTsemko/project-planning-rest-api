const Tasks = require('../repository/tasks');
const Sprints = require('../repository/sprints');
const { HttpCode } = require('../helpers/constants');

const createTask = async (req, res, next) => {
  const { projectId, sprintId } = req.params;
  const incomingScheduledTime = parseInt(req.body.scheduledTime);
  const findSprint = await Sprints.getById(projectId, sprintId);

  if (!findSprint) {
    return res.status(HttpCode.NOT_FOUND).json({
      status: 'error',
      code: HttpCode.NOT_FOUND,
      message: 'Not found',
    });
  }

  const currentScheduledTime = findSprint.allScheduledTime;
  const sprint = await Sprints.updateSprint(projectId, sprintId, {
    allScheduledTime: incomingScheduledTime + currentScheduledTime || 0,
  });

  try {
    const task = await Tasks.createTask({
      ...req.body,
      sprint: sprintId,
      project: projectId,
      durationSprint: sprint.duration,
      startDate: sprint.startDate,
    });

    return res
      .status(HttpCode.CREATED)
      .json({ status: 'success', code: HttpCode.CREATED, data: { task } });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  const { sprintId, taskId } = req.params;
  try {
    const task = await Tasks.getTaskById(sprintId, taskId);
    if (task) {
      return res
        .status(HttpCode.OK)
        .json({ status: 'success', code: HttpCode.OK, data: { task } });
    }
    return res.status(HttpCode.NOT_FOUND).json({
      status: 'error',
      code: HttpCode.NOT_FOUND,
      message: 'Not found',
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  const { sprintId, taskId, day, value } = req.params;

  try {
    const findTask = await Tasks.getTaskById(sprintId, taskId);

    if (!findTask) {
      return res.status(HttpCode.NOT_FOUND).json({
        status: 'error',
        code: HttpCode.NOT_FOUND,
        message: 'Task is not found',
      });
    }
    const projectId = findTask.project;
    const findSprint = await Sprints.getById(projectId, sprintId);

    const currentTotalDaly = findSprint.totalDaly;

    const updatedTotalDaly = currentTotalDaly.map(el =>
      Object.keys(el)[0] === day
        ? { [Object.keys(el)[0]]: Object.values(el)[0] + parseInt(value) }
        : el,
    );

    Sprints.updateSprint(projectId, sprintId, {
      totalDaly: updatedTotalDaly,
    });

    const taskByDaysUpd = findTask.taskByDays.map(el =>
      Object.keys(el)[0] === day
        ? { [Object.keys(el)[0]]: parseInt(value) }
        : el,
    );

    const totalTime = await findTask.taskByDays.reduce(
      (acc, el) =>
        Object.keys(el)[0] === day
          ? acc + parseInt(value)
          : acc + Object.values(el)[0],
      0,
    );

    const task = await Tasks.updateTask(
      sprintId,
      taskId,
      taskByDaysUpd,
      totalTime,
    );

    if (task) {
      return res.status(HttpCode.OK).json({
        status: 'success',
        code: HttpCode.OK,
        data: { task },
      });
    }

    return res.status(HttpCode.NOT_FOUND).json({
      status: 'error',
      code: HttpCode.NOT_FOUND,
      message: 'Task is not found',
    });
  } catch (error) {
    next(error);
  }
};

const getAllTasks = async (req, res, next) => {
  const sprintId = req.params.sprintId;
  try {
    const tasks = await Tasks.allTasks(sprintId);
    return res
      .status(HttpCode.OK)
      .json({ status: 'success', code: HttpCode.OK, data: { tasks } });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  const { sprintId, taskId } = req.params;
  try {
    const task = await Tasks.removeTask(sprintId, taskId);
    if (task) {
      return res.status(HttpCode.OK).json({
        status: 'success',
        code: HttpCode.OK,
        message: 'Task is deleted',
      });
    }
    return res.status(HttpCode.NOT_FOUND).json({
      status: 'error',
      code: HttpCode.NOT_FOUND,
      message: 'The task is not found',
    });
  } catch (error) {
    next(error);
  }
};

const getTaskByDay = async (req, res, next) => {
  const { sprintId, day } = req.params;

  try {
    const tasks = await Tasks.allTasks(sprintId);

    const tasksByDay = tasks.map(task => {
      return {
        name: task.name,
        totalTime: task.totalTime,
        scheduledTime: task.scheduledTime,
        sprint: task.sprint,
        project: task.project,
        byDay: task.taskByDays.find(days => Object.keys(days)[0] === day),
      };
    });

    if (tasks) {
      return res
        .status(HttpCode.OK)
        .json({ status: 'success', code: HttpCode.OK, data: { tasksByDay } });
    }

    return res.status(HttpCode.NOT_FOUND).json({
      status: 'error',
      code: HttpCode.NOT_FOUND,
      message: 'Tasks found',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  getAllTasks,
  deleteTask,
  getTaskByDay,
};
