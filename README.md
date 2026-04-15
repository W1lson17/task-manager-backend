# Task Manager Backend

RESTful API para gestión de tareas construida con Express, TypeScript y Prisma.

## Tech Stack

- Node.js 20+
- Express 5
- TypeScript (ESModules)
- Prisma ORM
- PostgreSQL
- Vitest
- pnpm

## Primeros Pasos

### Requisitos

- Node.js 20+
- pnpm
- Docker (para desarrollo local)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servicios con Docker
docker compose up -d

# Generar cliente Prisma
pnpm prisma generate

# Aplicar migraciones
pnpm prisma migrate dev

# Iniciar en desarrollo
pnpm dev
```

## API Endpoints

Prefix: `/api/v1`

### Auth
- `POST /auth/signup` - Registrar usuario
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/me` - Usuario actual

### Projects
- `GET /projects` - Listar proyectos
- `POST /projects` - Crear proyecto
- `GET /projects/:id` - Ver proyecto
- `PUT /projects/:id` - Actualizar proyecto
- `DELETE /projects/:id` - Eliminar proyecto
- `POST /projects/:id/members` - Agregar miembro
- `DELETE /projects/:id/members/:userId` - Remover miembro

## Testing

```bash
pnpm test
```

## License

ISC
