# Backend agent instructions

These instructions are for `technic-technologies-backend` only. They are not the agent instructions for the public site or the admin app.

`BACKEND.md` is the backend API documentation extracted from this code. `DESIGN.md` records backend behavior that callers depend on. When either file disagrees with the route, controller, or model source, the source wins and the docs should be updated to match. Do not invent routes, roles, or response fields.

## Runtime

Express 5, Mongoose, JWT, bcrypt, cookie-parser, multer, Cloudinary, and Gemini over `fetch`. `zod` is installed and unused. Node `24.x`.

`server.ts` loads `.env` and listens on `PORT`, or `5000` when unset. `.env.example` uses `3001`, which is what the frontends expect. On Vercel the module exports the app and does not call `listen`.

There is no `/api/v1` prefix. Mounts are in `src/app.ts`:

- `/api/auth` → login, logout, setup
- `/api` → users, blogs, careers, services, solutions, products, settings, contacts
- `/api/admin` → `/ai/...` and `/media`, `/upload`

Compiled `.js` model files next to the TypeScript sources are leftovers. Change the `.ts` files.

## Auth

`protect` reads cookie `token`, then `Authorization: Bearer`. Payload is `{ id, role }`, expiry `30d`. Missing token is `401 { error }`. A bad token is `401` with `success`, `message`, and `error`.

`authorize('admin')` is only on `/api/admin/users`. Those handlers also check `req.user.role === 'admin'`. Every other admin route only requires a valid token. `editor` and `viewer` can change content.

Login does not check `User.status`. Logout clears the cookie and does not revoke the JWT.

Public list routes (`GET /api/blogs|careers|services|products|solutions`) return every status when the `Authorization` header is present, without verifying it. They return only `Published` when the header is absent. Slug routes always require `Published`. Do not “fix” the public site by sending a dummy Authorization header.

## Writes

Content creates return `201` and the document. Updates return `200` and the document. Deletes return `200 { message }`.

`findByIdAndUpdate` does not set `runValidators`. Schema enums are enforced on `create`, not on a normal update. Service and solution slugs are the exception: the controller trims, lowercases, and checks `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. Duplicate key `11000` on those two models is `400` “Slug must be unique.”

`validateObjectId` is on the routers that have `:id`. A bad id is `400` “Invalid id” and never reaches the controller.

## Backend contracts callers already depend on

- Contact status is `PUT /api/admin/contacts/:id/status`. The admin page currently calls `PUT /api/admin/contacts/:id`, which 404s. Do not rename the backend path unless the admin client is updated in the same change.
- Applications require `applicantName`, `email`, `phone`, `experience`, and `resumeUrl`. The public form posts `applicationFields` names and does not map them. This route is JSON, not multipart.
- Career applications are accepted for any slug that exists, including Draft and Closed.
- AI routes return `{ data }` and do not save. They do not return image URLs. Career AI does not return `applicationFields` or `applicationEmail`.
- Upload field name is `image`. Folders are `blogs`, `products`, `services`, `solutions`, `media`. Max 4 MB.
- Settings `GET /api/settings` is public. `PUT /api/admin/settings` upserts one document. `whatsapp` is required on create.

## Responses

Do not introduce a new wrapper on one route only. Existing bodies are mixed: raw documents, `{ error }`, and `{ success, message, error }`. Match the controller you are editing.

## Do not add unless asked

Email, websockets, queues, cron, payments, pagination wrappers, or a permission table. None of those exist. `npm run seed` and `scripts/` are offline scripts, not routes.

Never commit `.env` or copy secret values into docs. Document variable names only.
