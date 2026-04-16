/**
 * Seed de datos para Tests de Integración
 *
 * Este archivo contiene los datos de prueba que se cargan antes de cada batch de tests.
 * Los datos persisten durante todo el batch gracias a la transacción de
 * vitest-environment-prisma-postgres (no hay rollback hasta el final).
 */

import { PrismaClient } from '@prisma/client';

export interface SeedResult {
  users: {
    user1: { id: string; email: string; name: string };
    user2: { id: string; email: string; name: string };
  };
  project: { id: string; slug: string };
  tasks: { [key: string]: { id: string; title: string } };
}

export async function seedIntegration(): Promise<SeedResult> {
  const prisma = new PrismaClient();

  try {
    // Limpiar datos existentes
    await prisma.activityLog.deleteMany();
    await prisma.taskDependency.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.taskLabel.deleteMany();
    await prisma.label.deleteMany();
    await prisma.subtask.deleteMany();
    await prisma.taskAssignee.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Crear usuarios de prueba
    const user1 = await prisma.user.create({
      data: {
        email: 'test-user-1@example.com',
        name: 'Test User 1',
        password: 'hashed_password_1',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'test-user-2@example.com',
        name: 'Test User 2',
        password: 'hashed_password_2',
      },
    });

    // Crear proyecto de prueba
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        slug: 'test-project',
        description: 'Proyecto de pruebas para integración',
        color: '#3B82F6',
        ownerId: user1.id,
      },
    });

    // Agregar miembro al proyecto
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user2.id,
        role: 'MEMBER',
      },
    });

    // Crear labels
    const labelBug = await prisma.label.create({
      data: {
        projectId: project.id,
        name: 'Bug',
        color: '#EF4444',
      },
    });

    const labelFeature = await prisma.label.create({
      data: {
        projectId: project.id,
        name: 'Feature',
        color: '#10B981',
      },
    });

    // Crear tareas de prueba
    const taskTodo = await prisma.task.create({
      data: {
        projectId: project.id,
        createdById: user1.id,
        title: 'Tarea pendiente',
        description: 'Descripción de tarea pendiente',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    });

    const taskInProgress = await prisma.task.create({
      data: {
        projectId: project.id,
        createdById: user1.id,
        title: 'Tarea en progreso',
        description: 'Descripción de tarea en progreso',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
    });

    const taskDone = await prisma.task.create({
      data: {
        projectId: project.id,
        createdById: user2.id,
        title: 'Tarea completada',
        description: 'Descripción de tarea completada',
        status: 'DONE',
        priority: 'LOW',
        completedAt: new Date(),
      },
    });

    // Asignar tareas
    await prisma.taskAssignee.create({
      data: {
        taskId: taskInProgress.id,
        userId: user2.id,
      },
    });

    // Agregar labels a tareas
    await prisma.taskLabel.create({
      data: {
        taskId: taskTodo.id,
        labelId: labelBug.id,
      },
    });

    await prisma.taskLabel.create({
      data: {
        taskId: taskInProgress.id,
        labelId: labelFeature.id,
      },
    });

    // Crear comentarios
    await prisma.comment.create({
      data: {
        taskId: taskInProgress.id,
        authorId: user2.id,
        content: 'Comentario de prueba en tarea en progreso',
      },
    });

    // Crear subtareas
    await prisma.subtask.create({
      data: {
        taskId: taskTodo.id,
        title: 'Subtarea 1',
        position: 0,
      },
    });

    await prisma.subtask.create({
      data: {
        taskId: taskTodo.id,
        title: 'Subtarea 2',
        isDone: true,
        position: 1,
      },
    });

    // Crear actividad
    await prisma.activityLog.create({
      data: {
        userId: user1.id,
        action: 'created',
        entityType: 'task',
        entityId: taskTodo.id,
        metadata: { title: taskTodo.title },
      },
    });

    console.log('✅ Seed de integración completado');
    console.log(`   - Usuarios: ${user1.email}, ${user2.email}`);
    console.log(`   - Proyecto: ${project.name}`);
    console.log(`   - Tareas: ${taskTodo.title}, ${taskInProgress.title}, ${taskDone.title}`);

    return {
      users: {
        user1: { id: user1.id, email: user1.email, name: user1.name || '' },
        user2: { id: user2.id, email: user2.email, name: user2.name || '' },
      },
      project: { id: project.id, slug: project.slug },
      tasks: {
        todo: { id: taskTodo.id, title: taskTodo.title },
        inProgress: { id: taskInProgress.id, title: taskInProgress.title },
        done: { id: taskDone.id, title: taskDone.title },
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}
