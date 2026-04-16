import type { Request, Response, NextFunction } from 'express';
import * as labelService from '../services/label.service.js';
import { createLabelSchema, updateLabelSchema } from '../schemas/label.schema.js';
import { ZodError } from 'zod';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const userId = req.userId!;
    const data = createLabelSchema.parse(req.body);

    const label = await labelService.create(projectId, userId, data);

    res.status(201).json({
      success: true,
      data: label,
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

    const labels = await labelService.findAll(projectId, userId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    next(error);
  }
};

export const findOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labelId = getParam(req.params.labelId);
    const userId = req.userId!;

    const label = await labelService.findOne(labelId, userId);

    res.json({
      success: true,
      data: label,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labelId = getParam(req.params.labelId);
    const userId = req.userId!;
    const data = updateLabelSchema.parse(req.body);

    const label = await labelService.update(labelId, userId, data);

    res.json({
      success: true,
      data: label,
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
    const labelId = getParam(req.params.labelId);
    const userId = req.userId!;

    await labelService.remove(labelId, userId);

    res.json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Task Labels
export const addLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const { labelId } = req.body as { labelId: string };

    const taskLabel = await labelService.addLabelToTask(projectId, taskId, labelId, userId);

    res.status(201).json({
      success: true,
      data: taskLabel,
    });
  } catch (error) {
    next(error);
  }
};

export const removeLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const labelId = getParam(req.params.labelId);
    const userId = req.userId!;

    await labelService.removeLabelFromTask(projectId, taskId, labelId, userId);

    res.json({
      success: true,
      message: 'Label removed from task',
    });
  } catch (error) {
    next(error);
  }
};

export const findLabels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;

    const labels = await labelService.findTaskLabels(projectId, taskId, userId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    next(error);
  }
};
