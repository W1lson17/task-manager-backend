import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from '../schemas/project.schema';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema';
import { createCommentSchema, updateCommentSchema } from '../schemas/comment.schema';
import { createLabelSchema, updateLabelSchema } from '../schemas/label.schema';

describe('Auth Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signupSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'PASSWORD123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'PasswordABC',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Pass1',
      });

      expect(result.success).toBe(false);
    });

    it('should allow optional name', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate correct project data', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
        description: 'A test project',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createProjectSchema.safeParse({
        name: '',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid color format', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
        color: '#FF5733',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
        color: 'red',
      });

      expect(result.success).toBe(false);
    });

    it('should default color to #3B82F6', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3B82F6');
      }
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial update', () => {
      const result = updateProjectSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateProjectSchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });

  describe('addMemberSchema', () => {
    it('should validate correct member data', () => {
      const result = addMemberSchema.safeParse({
        email: 'member@example.com',
        role: 'MEMBER',
      });

      expect(result.success).toBe(true);
    });

    it('should default role to MEMBER', () => {
      const result = addMemberSchema.safeParse({
        email: 'member@example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('MEMBER');
      }
    });

    it('should reject invalid role', () => {
      const result = addMemberSchema.safeParse({
        email: 'member@example.com',
        role: 'SUPER_ADMIN',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Task Schemas', () => {
  describe('createTaskSchema', () => {
    it('should validate correct task data', () => {
      const result = createTaskSchema.safeParse({
        title: 'New Task',
        description: 'Task description',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid status enum', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        status: 'IN_PROGRESS',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        status: 'INVALID_STATUS',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid priority enum', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        priority: 'HIGH',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateTaskSchema', () => {
    it('should allow partial updates', () => {
      const result = updateTaskSchema.safeParse({
        status: 'DONE',
        completedAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result.success).toBe(true);
    });

    it('should allow nullable fields', () => {
      const result = updateTaskSchema.safeParse({
        dueDate: null,
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('Comment Schemas', () => {
  describe('createCommentSchema', () => {
    it('should validate correct comment data', () => {
      const result = createCommentSchema.safeParse({
        content: 'This is a test comment',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = createCommentSchema.safeParse({
        content: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject content over 10000 characters', () => {
      const result = createCommentSchema.safeParse({
        content: 'a'.repeat(10001),
      });

      expect(result.success).toBe(false);
    });

    it('should accept content at 10000 characters', () => {
      const result = createCommentSchema.safeParse({
        content: 'a'.repeat(10000),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateCommentSchema', () => {
    it('should validate correct update data', () => {
      const result = updateCommentSchema.safeParse({
        content: 'Updated comment',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = updateCommentSchema.safeParse({
        content: '',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Label Schemas', () => {
  describe('createLabelSchema', () => {
    it('should validate correct label data', () => {
      const result = createLabelSchema.safeParse({
        name: 'Bug',
        color: '#FF5733',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createLabelSchema.safeParse({
        name: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject name over 50 characters', () => {
      const result = createLabelSchema.safeParse({
        name: 'a'.repeat(51),
      });

      expect(result.success).toBe(false);
    });

    it('should default color to #3B82F6', () => {
      const result = createLabelSchema.safeParse({
        name: 'Bug',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3B82F6');
      }
    });

    it('should reject invalid color format', () => {
      const result = createLabelSchema.safeParse({
        name: 'Bug',
        color: 'red',
      });

      expect(result.success).toBe(false);
    });

    it('should reject color without hash', () => {
      const result = createLabelSchema.safeParse({
        name: 'Bug',
        color: 'FF5733',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateLabelSchema', () => {
    it('should validate partial update with name', () => {
      const result = updateLabelSchema.safeParse({
        name: 'Updated Bug',
      });

      expect(result.success).toBe(true);
    });

    it('should validate partial update with color', () => {
      const result = updateLabelSchema.safeParse({
        color: '#00FF00',
      });

      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateLabelSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const result = updateLabelSchema.safeParse({
        color: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });
});
