import type { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service.js';
import { createCommentSchema, updateCommentSchema } from '../schemas/comment.schema.js';
import { ZodError } from 'zod';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const data = createCommentSchema.parse(req.body);

    const comment = await commentService.create(taskId, userId, data);

    res.status(201).json({
      success: true,
      data: comment,
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
    const taskId = getParam(req.params.taskId);
    const userId = req.userId!;
    const page = req.query.page ? String(req.query.page) : '1';
    const limit = req.query.limit ? String(req.query.limit) : '20';

    const result = await commentService.findAll(
      taskId,
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

export const findOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = getParam(req.params.commentId);
    const userId = req.userId!;

    const comment = await commentService.findOne(commentId, userId);

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = getParam(req.params.commentId);
    const userId = req.userId!;
    const data = updateCommentSchema.parse(req.body);

    const comment = await commentService.update(commentId, userId, data);

    res.json({
      success: true,
      data: comment,
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
    const commentId = getParam(req.params.commentId);
    const userId = req.userId!;

    await commentService.remove(commentId, userId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
