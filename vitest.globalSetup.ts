/**
 * Global Setup para Tests de Integración
 *
 * Este archivo se ejecuta ANTES de todos los tests. Su responsabilidad:
 * 1. Levantar un container de PostgreSQL con Testcontainers
 * 2. Correr las migraciones de Prisma
 * 3. Ejecutar el seed de datos de prueba
 * 4. Exponer la connection string para que vitest-environment-prisma-postgres la use
 */

import { beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);

// Cargar variables de entorno para desarrollo
dotenv.config();

beforeAll(async () => {
  console.log('🔧 Iniciando Testcontainers para PostgreSQL...');

  // 1. Iniciar container de PostgreSQL
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('taskmanager_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const connectionString = container.getConnectionUri();
  console.log(`✅ PostgreSQL iniciado en ${connectionString}`);

  // 2. Guardar la connection string para que vitest la use
  process.env.DATABASE_URL = connectionString;

  // Guardar en un archivo temporal para Prisma CLI
  const dbUrl = `${connectionString}?schema=public`;
  fs.writeFileSync('.test-database-url', dbUrl);

  // 3. Correr migraciones
  console.log('📦 Ejecutando migraciones de Prisma...');
  try {
    await execAsync('pnpm prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('✅ Migraciones ejecutadas');
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    throw error;
  }

  // 4. Ejecutar seed de datos de prueba
  console.log('🌱 Ejecutando seed de datos de prueba...');
  try {
    const prisma = new PrismaClient();

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

    await prisma.task.create({
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

    // Asignar tarea
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
    await prisma.subtask.createMany({
      data: [
        { taskId: taskTodo.id, title: 'Subtarea 1', position: 0 },
        { taskId: taskTodo.id, title: 'Subtarea 2', isDone: true, position: 1 },
      ],
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

    await prisma.$disconnect();

    console.log('✅ Seed ejecutado');
    console.log(`   - Usuarios: ${user1.email}, ${user2.email}`);
    console.log(`   - Proyecto: ${project.name}`);
    console.log(`   - Tareas: ${taskTodo.title}, ${taskInProgress.title}`);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }

  // 5. Exponer el container para cleanup al final
  (globalThis as any).__TEST_CONTAINER__ = container;
}, 120_000);

// Cleanup después de todos los tests
afterAll(async () => {
  const container = (globalThis as any).__TEST_CONTAINER__;
  if (container) {
    console.log('🧹 Deteniendo container de PostgreSQL...');
    await container.stop();
    console.log('✅ Container detenido');
  }

  // Limpiar archivo temporal
  const dbUrlFile = '.test-database-url';
  if (fs.existsSync(dbUrlFile)) {
    fs.unlinkSync(dbUrlFile);
  }
});
