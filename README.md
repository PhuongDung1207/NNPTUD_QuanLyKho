# Warehouse Management Backend

Backend scaffold for a warehouse management system using Express and MongoDB, structured around:

- `bin/www`: HTTP server bootstrap
- `app.js`: global middleware, MongoDB connection, API mount, 404 and error handler
- `routes/`: HTTP routes and response layer
- `controllers/`: business/data orchestration
- `schemas/`: Mongoose models
- `utils/`: auth, validation, upload, mail helpers

## Quick Start

1. Install dependencies with `npm install`
2. Run the dev server with `npm start`

## Product API

- `GET /api/v1/health`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
