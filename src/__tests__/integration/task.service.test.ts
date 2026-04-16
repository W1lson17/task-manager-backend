/**
 * Tests de Integración para el Servicio de Tareas
 *
 * Estos tests usan la base de datos PostgreSQL real (via Testcontainers)
 * con vitest-environment-prisma-postgres que envuelve cada test en una transacción.
 *
 * Los datos de prueba se cargan en vitest.globalSetup.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as taskService from '../../services/task.service.js';
import { PrismaClient } from '@prisma/client';

describe('TaskService - Integration Tests', () => {
  let prisma: PrismaClient;

  // Datos del seed (cargados en vitest.globalSetup.ts)
  let testUser1Id: string;
  let testUser2Id: string;
  let testProjectId: string;
  let testTaskTodoId: string;
  let testTaskInProgressId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();

    // Obtener datos del seed desde la base de datos
    const testUser1 = await prisma.user.findUnique({
      where: { email: 'test-user-1@example.com' },
    });
    const testUser2 = await prisma.user.findUnique({
      where: { email: 'test-user-2@example.com' },
    });
    const testProject = await prisma.project.findUnique({
      where: { slug: 'test-project' },
    });
    const todoTask = await prisma.task.findFirst({
      where: { title: 'Tarea pendiente' },
    });
    const inProgressTask = await prisma.task.findFirst({
      where: { title: 'Tarea en progreso' },
    });

    testUser1Id = testUser1!.id;
    testUser2Id = testUser2!.id;
    testProjectId = testProject!.id;
    testTaskTodoId = todoTask!.id;
    testTaskInProgressId = inProgressTask!.id;
  });

  describe('create', () => {
    it('should create a task when user is a member', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Nueva tarea de test',
        description: 'Descripción de la nueva tarea',
        status: 'TODO',
        priority: 'MEDIUM',
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Nueva tarea de test');
      expect(task.status).toBe('TODO');
      expect(task.priority).toBe('MEDIUM');
      expect(task.projectId).toBe(testProjectId);
      expect(task.createdById).toBe(testUser1Id);
    });

    it('should throw ForbiddenError when user is not a member', async () => {
      // Crear un usuario que no es miembro del proyecto
      const outsider = await prisma.user.create({
        data: {
          email: 'outsider@example.com',
          name: 'Outsider User',
          password: 'hashed_password',
        },
      });

      await expect(
        taskService.create(testProjectId, outsider.id, {
          title: 'Tarea no permitida',
          status: 'TODO',
          priority: 'LOW',
        })
      ).rejects.toThrow('You are not a member of this project');

      // Limpiar
      await prisma.user.delete({ where: { id: outsider.id } });
    });

    it('should throw ForbiddenError when user is a viewer', async () => {
      // Crear un usuario viewer
      const viewer = await prisma.user.create({
        data: {
          email: 'viewer@example.com',
          name: 'Viewer User',
          password: 'hashed_password',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: testProjectId,
          userId: viewer.id,
          role: 'VIEWER',
        },
      });

      await expect(
        taskService.create(testProjectId, viewer.id, {
          title: 'Tarea no permitida',
          status: 'TODO',
          priority: 'LOW',
        })
      ).rejects.toThrow('Viewers cannot create tasks');

      // Limpiar
      await prisma.projectMember.delete({
        where: {
          projectId_userId: { projectId: testProjectId, userId: viewer.id },
        },
      });
      await prisma.user.delete({ where: { id: viewer.id } });
    });

    it('should log activity when creating a task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea con actividad',
        status: 'TODO',
        priority: 'HIGH',
      });

      const activity = await prisma.activityLog.findFirst({
        where: {
          entityId: task.id,
          action: 'CREATE',
        },
      });

      expect(activity).toBeDefined();
      expect(activity!.entityType).toBe('Task');
      expect(activity!.userId).toBe(testUser1Id);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks for project members', async () => {
      const result = await taskService.findAll(testProjectId, testUser1Id, 1, 10);

      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.pagination.total).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter tasks by status', async () => {
      const result = await taskService.findAll(testProjectId, testUser1Id, 1, 10, {
        status: 'TODO',
      });

      expect(result.tasks.every((task) => task.status === 'TODO')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const result = await taskService.findAll(testProjectId, testUser1Id, 1, 10, {
        priority: 'HIGH',
      });

      expect(result.tasks.every((task) => task.priority === 'HIGH')).toBe(true);
    });

    it('should throw ForbiddenError for non-members', async () => {
      const outsider = await prisma.user.create({
        data: {
          email: 'outsider-find@example.com',
          name: 'Outsider Finder',
          password: 'hashed_password',
        },
      });

      await expect(taskService.findAll(testProjectId, outsider.id, 1, 10)).rejects.toThrow(
        'You are not a member of this project'
      );

      // Limpiar
      await prisma.user.delete({ where: { id: outsider.id } });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const task = await taskService.findOne(testProjectId, testTaskTodoId, testUser1Id);

      expect(task).toBeDefined();
      expect(task.id).toBe(testTaskTodoId);
      expect(task.title).toBe('Tarea pendiente');
    });

    it('should include related data', async () => {
      const task = await taskService.findOne(testProjectId, testTaskInProgressId, testUser1Id);

      expect(task).toBeDefined();
      expect(task.assignees).toBeDefined();
      expect(task.labels).toBeDefined();
      expect(task.subtasks).toBeDefined();
    });

    it('should throw NotFoundError for non-existent task', async () => {
      await expect(
        taskService.findOne(testProjectId, 'non-existent-id', testUser1Id)
      ).rejects.toThrow('Task');
    });

    it('should throw NotFoundError when task belongs to different project', async () => {
      // Crear otro proyecto y tarea
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-owner@example.com',
          name: 'Other Owner',
          password: 'hashed_password',
        },
      });
      const otherProject = await prisma.project.create({
        data: {
          name: 'Other Project',
          slug: 'other-project',
          ownerId: otherUser.id,
        },
      });
      const otherTask = await prisma.task.create({
        data: {
          title: 'Tarea de otro proyecto',
          projectId: otherProject.id,
          createdById: otherUser.id,
        },
      });

      // Intentar acceder desde el proyecto original
      await expect(taskService.findOne(testProjectId, otherTask.id, testUser1Id)).rejects.toThrow(
        'Task'
      );

      // Limpiar
      await prisma.task.delete({ where: { id: otherTask.id } });
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('update', () => {
    it('should update a task title', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para actualizar',
        status: 'TODO',
        priority: 'MEDIUM',
      });

      const updated = await taskService.update(testProjectId, task.id, testUser1Id, {
        title: 'Título actualizado',
      });

      expect(updated.title).toBe('Título actualizado');
    });

    it('should update task status', async () => {
      const updated = await taskService.update(testProjectId, testTaskTodoId, testUser1Id, {
        status: 'IN_PROGRESS',
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should update task priority', async () => {
      const updated = await taskService.update(testProjectId, testTaskTodoId, testUser1Id, {
        priority: 'URGENT',
      });

      expect(updated.priority).toBe('URGENT');
    });

    it('should log activity when updating a task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para log de actualización',
        status: 'TODO',
        priority: 'LOW',
      });

      await taskService.update(testProjectId, task.id, testUser1Id, {
        status: 'IN_PROGRESS',
      });

      const activity = await prisma.activityLog.findFirst({
        where: {
          entityId: task.id,
          action: 'UPDATE',
        },
      });

      expect(activity).toBeDefined();
      expect(activity!.oldData).toBeDefined();
      expect(activity!.newData).toBeDefined();
    });

    it('should throw ForbiddenError when non-creator tries to update', async () => {
      await expect(
        taskService.update(
          testProjectId,
          testTaskTodoId,
          testUser2Id, // No es el creador
          { title: 'Intento de cambio' }
        )
      ).rejects.toThrow('You do not have permission to modify this task');
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para eliminar',
        status: 'TODO',
        priority: 'LOW',
      });

      await taskService.remove(testProjectId, task.id, testUser1Id);

      // Verificar soft delete
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask!.deletedAt).toBeDefined();

      // Verificar que no aparece en queries normales
      const taskInList = await taskService.findAll(testProjectId, testUser1Id, 1, 100);
      expect(taskInList.tasks.some((t) => t.id === task.id)).toBe(false);
    });

    it('should log activity when deleting a task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para eliminar con log',
        status: 'TODO',
        priority: 'LOW',
      });

      await taskService.remove(testProjectId, task.id, testUser1Id);

      const activity = await prisma.activityLog.findFirst({
        where: {
          entityId: task.id,
          action: 'DELETE',
        },
      });

      expect(activity).toBeDefined();
      expect(activity!.oldData).toBeDefined();
    });

    it('should throw ForbiddenError for non-creator', async () => {
      await expect(taskService.remove(testProjectId, testTaskTodoId, testUser2Id)).rejects.toThrow(
        'You do not have permission to delete this task'
      );
    });
  });

  describe('restore', () => {
    it('should restore a deleted task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para restaurar',
        status: 'TODO',
        priority: 'LOW',
      });

      // Eliminar primero
      await taskService.remove(testProjectId, task.id, testUser1Id);

      // Restaurar
      const restored = await taskService.restore(testProjectId, task.id, testUser1Id);

      expect(restored.deletedAt).toBeNull();
    });

    it('should log activity when restoring a task', async () => {
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea para restaurar con log',
        status: 'TODO',
        priority: 'LOW',
      });

      await taskService.remove(testProjectId, task.id, testUser1Id);
      await taskService.restore(testProjectId, task.id, testUser1Id);

      const activity = await prisma.activityLog.findFirst({
        where: {
          entityId: task.id,
          action: 'RESTORE',
        },
      });

      expect(activity).toBeDefined();
    });
  });

  describe('Subtasks', () => {
    it('should create a subtask', async () => {
      const subtask = await taskService.createSubtask(testProjectId, testTaskTodoId, testUser1Id, {
        title: 'Nueva subtarea',
      });

      expect(subtask).toBeDefined();
      expect(subtask.title).toBe('Nueva subtarea');
      expect(subtask.taskId).toBe(testTaskTodoId);
      expect(subtask.isDone).toBe(false);
    });

    it('should find subtasks', async () => {
      const subtasks = await taskService.findSubtasks(testProjectId, testTaskTodoId, testUser1Id);

      expect(subtasks).toBeDefined();
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks.length).toBeGreaterThan(0);
    });

    it('should update a subtask', async () => {
      const subtask = await taskService.createSubtask(testProjectId, testTaskTodoId, testUser1Id, {
        title: 'Subtarea para actualizar',
      });

      const updated = await taskService.updateSubtask(
        testProjectId,
        testTaskTodoId,
        subtask.id,
        testUser1Id,
        { isDone: true }
      );

      expect(updated.isDone).toBe(true);
    });

    it('should delete a subtask', async () => {
      const subtask = await taskService.createSubtask(testProjectId, testTaskTodoId, testUser1Id, {
        title: 'Subtarea para eliminar',
      });

      await taskService.deleteSubtask(testProjectId, testTaskTodoId, subtask.id, testUser1Id);

      const found = await prisma.subtask.findUnique({
        where: { id: subtask.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Assignees', () => {
    it('should add an assignee to a task', async () => {
      // Crear tarea sin asignados
      const task = await taskService.create(testProjectId, testUser1Id, {
        title: 'Tarea sin asignar',
        status: 'TODO',
        priority: 'MEDIUM',
      });

      const assignee = await taskService.addAssignee(
        testProjectId,
        task.id,
        testUser1Id, // Usuario que asigna
        testUser2Id // Usuario asignado
      );

      expect(assignee).toBeDefined();
      expect(assignee.taskId).toBe(task.id);
      expect(assignee.userId).toBe(testUser2Id);
    });

    it('should find assignees of a task', async () => {
      const assignees = await taskService.findAssignees(
        testProjectId,
        testTaskInProgressId,
        testUser1Id
      );

      expect(assignees).toBeDefined();
      expect(Array.isArray(assignees)).toBe(true);
    });

    it('should remove an assignee from a task', async () => {
      // Primero agregar
      const assigneeResult = await taskService.addAssignee(
        testProjectId,
        testTaskTodoId,
        testUser1Id,
        testUser2Id
      );
      expect(assigneeResult).toBeDefined();

      // Luego remover
      await taskService.removeAssignee(testProjectId, testTaskTodoId, testUser1Id, testUser2Id);

      const assignees = await taskService.findAssignees(testProjectId, testTaskTodoId, testUser1Id);

      expect(assignees.some((a) => a.userId === testUser2Id)).toBe(false);
    });

    it('should throw ForbiddenError when assigning to non-member', async () => {
      const outsider = await prisma.user.create({
        data: {
          email: 'outsider-assign@example.com',
          name: 'Outsider Assign',
          password: 'hashed_password',
        },
      });

      await expect(
        taskService.addAssignee(testProjectId, testTaskTodoId, testUser1Id, outsider.id)
      ).rejects.toThrow('User is not a member of this project');

      await prisma.user.delete({ where: { id: outsider.id } });
    });

    it('should throw ForbiddenError when assigning already assigned user', async () => {
      // La tarea testTaskInProgressId ya tiene testUser2 asignado según el seed
      await expect(
        taskService.addAssignee(testProjectId, testTaskInProgressId, testUser1Id, testUser2Id)
      ).rejects.toThrow('User is already assigned to this task');
    });
  });
});
