import type { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activity.service.js';
import { activityQuerySchema } from '../schemas/activity.schema.js';
import { ZodError } from 'zod';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export const getProjectActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const userId = req.userId!;
    const query = activityQuerySchema.parse(req.query);

    const result = await activityService.findByProject(projectId, userId, query.page, query.limit, {
      entityType: query.entityType,
      action: query.action,
    });

    res.json({
      success: true,
      ...result,
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

export const getEntityActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = getParam(req.params.projectId);
    const entityType = getParam(req.params.entityType);
    const entityId = getParam(req.params.entityId);
    const userId = req.userId!;
    const page = req.query.page ? String(req.query.page) : '1';
    const limit = req.query.limit ? String(req.query.limit) : '50';

    const result = await activityService.findByEntity(
      projectId,
      entityType as 'Project' | 'Task' | 'Comment' | 'Subtask',
      entityId,
      userId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
