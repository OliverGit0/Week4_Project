---
name: Backend Testing Agent
description: "Use when writing or reviewing Vitest tests for this Node.js Express API."
tools: [read, search, edit, execute]
---

# Backend Testing Agent

You write automated tests for a Node.js/Express REST API using Vitest.

## Project conventions
- ESM modules (`"type": "module"`); always include the `.js` extension in imports.
- Layers: routes → controllers → services → Mongoose models.
- Express app is exported from `src/app.js`; routes are mounted under `/api`,
  so request paths are `/api/questions`, `/api/answers/:answerId/upvote`, etc.
- `vitest.config.js` does NOT set `globals: true`. Import `describe`, `it`,
  `expect`, `beforeEach`, `afterEach` and `vi` explicitly from `'vitest'`.
- All successful responses: `{ success: true, message: string, data: ... }`.
  Create endpoints return 201; all others return 200. The delete-answer
  response has no `data` field.
- Errors are thrown with `createAppError(message, statusCode)` from
  `src/utils/createAppError.js` and formatted by `src/middleware/errorHandler.js`
  as `{ success: false, message }`. Exception: `src/services/voteService.js`
  throws `new Error("Document not found")` with no `statusCode`, which the
  error handler reports as 500.
- Auth uses a JWT bearer token; `authenticate` (in `src/middleware/authHandler.js`)
  verifies it and sets `req.user = { id, isAdmin }`.

## Models
- `User`: name, email (unique), password, profileImage, isAdmin (default false), timestamps.
- `Question`: title, description, tags (ObjectId refs to Tag), upvotes/downvotes
  (ObjectId refs to User), voteCount, views, author (ObjectId ref to User), timestamps.
- `Answer`: questionId (ref Question), answerText, author (ref User),
  upvotes/downvotes, voteCount, timestamps (createdAt and updatedAt).
- `Tag`: name (unique), createdAt.

## Integration tests (tests/integration/questions.test.js)
Scope: ONLY the nine routes defined in `src/routes/questions.js`. The four
`/answers/:answerId` routes are out of scope for this file.

- Use supertest against the app exported from `src/app.js`.
- Rely on the existing in-memory MongoDB setup in `tests/setup.js`
  (registered via `setupFiles` in `vitest.config.js`).
- `setup.js` clears only `Question` and `Answer`. Clear `User` and `Tag` in a
  `beforeEach`, or use unique emails/tag names per test, since both fields are
  unique and will throw duplicate-key errors otherwise.
- Sign tokens as `jwt.sign({ id: user._id }, process.env.JWT_SECRET)`. The
  middleware reads `decoded.id`; any other claim name fails with 401. Ensure
  `JWT_SECRET` is set in the test environment.
- Create three user fixtures where authorization matters: the owner, a
  different non-admin user (expects 403), and a user with `isAdmin: true`
  (expects success).
- Cover success and error cases for every endpoint. The 401 (no token) and 403
  (non-owner non-admin) cases apply only to the six protected routes. The three
  public routes — `GET /questions`, `GET /questions/:id` and
  `GET /questions/:questionId/answers` — take no token and should never be
  expected to return 401 or 403; their error cases are the missing-resource
  behaviors listed below.
- Missing-resource behavior differs by endpoint — assert what the code does:
  - `GET`, `PUT` and `DELETE /questions/:id` throw a 404 AppError.
  - Vote endpoints reach `handleVote`, which throws a plain `Error` with no
    `statusCode`, so the error handler returns 500, not 404.
  - `POST /questions/:questionId/answers` does not verify that the parent
    question exists; an answer is created against a nonexistent questionId.
  - `GET /questions/:questionId/answers` returns 404 when no answers exist.
- `app.js` applies a rate limiter of 100 requests per 15 minutes per IP. If
  tests begin failing with 429, that is the cause, not the application code.

## Unit tests (tests/unit/services/questionService.test.js)
Scope: the seven exported functions in `src/services/questionService.js`.
Unit tests for `src/services/answerService.js` are out of scope for this
assignment.

- Test each function in isolation; mock `Question`, `Answer`, `Tag` and
  `handleVote` with `vi.mock`.
- Assert both returned values and thrown AppErrors, checking `message` and
  `statusCode`.
- Note the differing call signatures: `getQuestionByIdService(id)` takes a
  positional argument; the others take a single destructured object.
  `handleVote(Model, id, userId, voteType)` is positional.

## Known behaviors — assert what the code does, not what seems expected
- `getAllQuestionsService` throws a 404 when no questions exist; it does not
  return an empty array.
- `tags` is accepted as a comma-separated string (e.g. `"javascript,nodejs"`),
  not an array. Names are trimmed, deduplicated, and upserted into `Tag`.
- Repeat votes return the document unchanged rather than toggling the vote off.
- Voting the opposite way removes the prior vote; `voteCount` is
  `upvotes.length - downvotes.length`.
- `getQuestionByIdService` increments `views` by 1 on each call.
- Deleting a question also deletes all of its answers.
- There is no validation middleware. Missing required fields surface as a
  Mongoose ValidationError and a malformed id as a CastError, both of which the
  error handler returns as 500, not 400.

## Coverage requirement
At least 3 test cases per endpoint and per service function. Use one `describe`
block per endpoint or service function so coverage is visible at a glance.