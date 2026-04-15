import type { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  addAssigneeSchema,
} from '../schemas/task.schema.js';
import { ZodError } from 'zod';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const userId = req.userId!;
    const data = createTaskSchema.parse(req.body);

    const task = await taskService.create(projectId, userId, data);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const userId = req.userId!;
    const page = req.query.page ? String(req.query.page) : '1';
    const limit = req.query.limit ? String(req.query.limit) : '20';

    const result = await taskService.findAll(
      projectId,
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
      {
        status: req.query.status ? String(req.query.status) : undefined,
        priority: req.query.priority ? String(req.query.priority) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        assignedTo: req.query.assignedTo ? String(req.query.assignedTo) : undefined,
      }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const findOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    const task = await taskService.findOne(projectId, taskId, userId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const data = updateTaskSchema.parse(req.body);

    const task = await taskService.update(projectId, taskId, userId, data);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    await taskService.remove(projectId, taskId, userId);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const restore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    const task = await taskService.restore(projectId, taskId, userId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Subtasks
export const createSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const data = createSubtaskSchema.parse(req.body);

    const subtask = await taskService.createSubtask(projectId, taskId, userId, data);

    res.status(201).json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const findSubtasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    const subtasks = await taskService.findSubtasks(projectId, taskId, userId);

    res.json({
      success: true,
      data: subtasks,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const subtaskId = getParam(req.params.subtaskId);
    const userId = req.userId!;
    const data = updateSubtaskSchema.parse(req.body);

    const subtask = await taskService.updateSubtask(projectId, taskId, subtaskId, userId, data);

    res.json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const deleteSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const subtaskId = getParam(req.params.subtaskId);
    const userId = req.userId!;

    await taskService.deleteSubtask(projectId, taskId, subtaskId, userId);

    res.json({
      success: true,
      message: 'Subtask deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Assignees
export const addAssignee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const data = addAssigneeSchema.parse(req.body);

    const assignee = await taskService.addAssignee(projectId, taskId, userId, data.userId);

    res.status(201).json({
      success: true,
      data: assignee,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const removeAssignee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const assigneeId = getParam(req.params.assigneeId);
    const userId = req.userId!;

    await taskService.removeAssignee(projectId, taskId, userId, assigneeId);

    res.json({
      success: true,
      message: 'Assignee removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const findAssignees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    const assignees = await taskService.findAssignees(projectId, taskId, userId);

    res.json({
      success: true,
      data: assignees,
    });
  } catch (error) {
    next(error);
  }
};
