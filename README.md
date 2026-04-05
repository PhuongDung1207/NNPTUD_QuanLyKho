# Warehouse Management Backend

Backend scaffold for a warehouse management system using Express and MongoDB, structured around:

- `bin/www`: HTTP server bootstrap
- `app.js`: global middleware, MongoDB connection, API mount, 404 and error handler
- `routes/`: HTTP routes and response layer
- `controllers/`: business/data orchestration
- `schemas/`: Mongoose models
- `utils/`: auth, validation, upload, mail helpers

## Quick Start

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run the dev server with `npm start`

## Product API

- `GET /api/v1/health`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

## User & Access Control API

When the app connects to MongoDB, it auto-seeds:

- permissions for user/account management
- 2 roles: `admin`, `user`
- a default admin account if the database does not have any admin user yet

Default admin credentials:

- `username`: `admin`
- `password`: `admin123456`

You can override them with:

- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_FULLNAME`

Auth endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/activate-account?token=...`
- `POST /api/v1/auth/activate-account`

User management endpoints:

- `GET /api/v1/users/me`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `POST /api/v1/users/import`
- `PATCH /api/v1/users/:id`
- `POST /api/v1/users/:id/resend-invite`
- `PATCH /api/v1/users/:id/lock`
- `PATCH /api/v1/users/:id/unlock`
- `DELETE /api/v1/users/:id`

Access-control reference endpoints:

- `GET /api/v1/roles`
- `GET /api/v1/permissions`

Notes:

- only `admin` can CRUD users, lock/unlock, and read roles/permissions
- `user` can access their own authenticated profile through `/api/v1/auth/me` or `/api/v1/users/me`
- newly created users stay in `inactive` status until they activate their account from the email invitation
- admin does not set the initial password anymore; the invited user sets it during account activation
- bulk user import accepts `.xlsx/.xls` and creates each successful row with the same inactive + activation-email flow
- locked/inactive users cannot authenticate successfully
