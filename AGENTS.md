# DevAnswers Backend

## Project

This repository contains a Q&A REST API for questions, answers, tags, users, and voting. It is built with Express 5, Mongoose, and MongoDB.

## Architecture

Keep the request flow in this order:

`routes -> controllers -> services -> models`

- [src/app.js](src/app.js) exports the Express app.
- [src/routes/index.js](src/routes/index.js) aggregates routers and mounts them below `/api`.
- Route handlers should delegate application logic to services.
- Services own database operations and domain rules; models define the Mongoose schemas.
- Shared authentication and error behavior lives in [src/middleware](src/middleware/).

## Modules

The project is ESM (`"type": "module"` in [package.json](package.json)). Use `import` and `export`; every relative import must include its `.js` extension.

## API Conventions

- Successful responses use `{ success, message, data }`.
- Create endpoints return HTTP `201`; all other successful endpoints return HTTP `200`.
- The delete-answer response intentionally omits `data`.
- Preserve the existing `/api` route prefix and the route parameter names used by each router.

## Errors

For intentional application errors, services should throw `createAppError(message, statusCode)` from [src/utils/createAppError.js](src/utils/createAppError.js). Controllers do not catch service errors; Express 5 forwards rejected async handlers to [src/middleware/errorHandler.js](src/middleware/errorHandler.js), which is registered after the routes in [src/app.js](src/app.js).

Unhandled Mongoose validation, cast, and other errors may be formatted as HTTP `500` by the error handler unless the relevant service translates them to an application error.

## Authentication

Authentication uses JWT bearer tokens. [src/middleware/authHandler.js](src/middleware/authHandler.js) verifies the token with `JWT_SECRET`, loads the user, and sets:

```js
req.user = { id, isAdmin };
```

Protected routes apply `authenticate` before their controller. Ownership and admin checks belong in the relevant service.

## Commands

- `npm run dev` starts the local server with Nodemon.
- `npm test` runs the Vitest suite.
- `npm start` starts the server with Node.
- `npm run populate` runs the database population script.

Unit tests mock models and service dependencies. Integration tests use Supertest against the exported app and the in-memory MongoDB configured by [tests/setup.js](tests/setup.js) and [vitest.config.js](vitest.config.js).

## Environment

Use a local `.env` file based on [.env.example](.env.example). The application expects `MONGODB_URI` for the MongoDB connection and `JWT_SECRET` for token verification. `PORT`, `NODE_ENV`, and `JWT_EXPIRATION` are also defined by the template. Do not commit `.env` or secrets.
