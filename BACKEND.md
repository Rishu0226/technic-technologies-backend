# Technic Technologies — Backend documentation

This file documents the **backend** in `technic-technologies-backend`. It describes the Express API, authentication, authorization, models, and responses as implemented in this repository. It is not the public-site or admin frontend documentation. Those live in `technic-technologies` and `technic-technologies-admin`.

The public site and the admin app call this backend. Where either client disagrees with a route here, this backend is what actually runs.

There is no API version prefix. There is no OpenAPI file.

---

## 1. Overview

Express 5 application. `server.ts` loads `.env`, connects to MongoDB, and listens. `src/app.ts` mounts JSON parsing, cookies, CORS, Helmet, a database gate, the routers, then 404 and 500 handlers.

Default listen port in code is `5000` when `PORT` is unset. `.env.example` sets `PORT=3001`. The public site and the admin app default `NEXT_PUBLIC_API_URL` to `http://localhost:3001`. Set this backend’s `PORT` to that origin.

Node engine: `24.x`. Database: MongoDB through Mongoose. There is no SQL, no Redis, no queue, no cron, no WebSocket, and no email sender in this repository.

---

## 2. Stack

| Piece | Implementation |
| --- | --- |
| HTTP | Express `^5.2.1` |
| Database | Mongoose `^9.9.4` |
| Auth | `jsonwebtoken` (30-day JWT) and `bcryptjs` |
| Cookies | `cookie-parser` |
| Validation | Mongoose schemas. Service and solution slugs also use a regex in the controller. `zod` is in `package.json` and is not imported |
| Upload | `multer` memory storage, then Cloudinary |
| AI | Google Gemini REST (`generativelanguage.googleapis.com`) |
| Security headers | `helmet`, with `crossOriginResourcePolicy: cross-origin` |

---

## 3. Structure

```text
server.ts
src/app.ts
src/routes/          one router per area, mounted in app.ts
src/controllers/
src/models/
src/middleware/      protect, authorize, upload, validateObjectId, errorHandler
src/config/          db.ts, cloudinary.ts
src/utils/jwt.ts
seed.ts              local script, not an HTTP route
```

Mounts in `src/app.ts`:

| Mount | Router |
| --- | --- |
| `/api/auth` | `authRoutes` |
| `/api` | users, careers, services, solutions, products, blogs, settings, contacts |
| `/api/admin` | `aiRoutes` (`/ai/...`) and `uploadRoutes` (`/media`, `/upload`) |

`validateObjectId` rejects a non-ObjectId `:id` with HTTP 400 before the controller. It does not apply to `:slug`.

---

## 4. Response shape

There is no single wrapper. Most success bodies are the Mongoose document or a raw array.

Two error styles appear:

```json
{ "error": "Human readable message" }
```

```json
{ "success": false, "message": "Human readable message", "error": "same text" }
```

Login success is a user object plus `token`, not `{ success, data }`. AI success is `{ "data": { ...fields } }`.

List endpoints return a JSON array. They do not return `page`, `limit`, or `total`. The media list is the only capped query (`limit(100)`).

`publishedAt` exists on Blog and Career schemas and is not set by the controllers when status becomes `Published`.

---

## 5. Authentication

### Login

`POST /api/auth/login`

Body: `{ "email": string, "password": string }`. Both required and must be strings. Otherwise 400 `{ success: false, message, error }` with “Email and password are required”.

Looks up `User` by the email string as sent. The schema lowercases email on save, and the login query does not lowercase the input, so `Admin@…` does not match a stored `admin@…`. `status` is not checked. An `inactive` user can still log in.

Success `200`:

```json
{ "_id": "...", "name": "...", "email": "...", "role": "admin", "token": "<jwt>" }
```

Also sets cookie `token`:

| Attribute | Value |
| --- | --- |
| httpOnly | true |
| secure | true only when `NODE_ENV=production` |
| sameSite | `none` in production, `strict` otherwise |
| maxAge | 30 days |

The JWT payload is `{ id, role }`, signed with `JWT_SECRET`, `expiresIn: '30d'`.

Failure `401`: `{ "error": "Invalid email or password" }`.

The admin app stores `token` in a JavaScript-readable cookie on the admin origin and sends `Authorization: Bearer`. That Bearer value is what `protect` accepts. The httpOnly cookie is set on the API origin. In non-production, `SameSite=Strict` does not send that cookie from `localhost:3006` to `localhost:3001`. Do not rely on the cookie alone for cross-origin admin calls unless the browser and `sameSite` actually allow it.

### Logout

`POST /api/auth/logout`

No auth check. Clears the `token` cookie (`expires` epoch 0, same flags as login). Body: `{ "message": "Logged out successfully" }`. It does not revoke the JWT. A Bearer token remains valid until it expires.

### Setup

`POST /api/auth/setup`

No body. Disabled with 403 when `NODE_ENV=production`. Otherwise creates one user from `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` with name `Super Admin` and role `admin`, only if no user with role `admin` exists. 201 `{ "message": "Super Admin created successfully..." }`. 403 if an admin already exists. 500 if the env pair is missing.

### How protected routes read the token

`protect` in `src/middleware/authMiddleware.ts`:

1. Cookie `token`, if present.
2. Else `Authorization` starting with `Bearer `, the second segment.

Missing token: `401 { "error": "Not authorized, no token" }`.

Invalid or expired JWT: `401 { success: false, message: "Not authorized, token failed", error: "Not authorized, token failed" }`.

Missing `JWT_SECRET` while verifying: `500` “Server authentication is not configured”.

There is no register, refresh, OTP, forgot-password, or email-verification route.

### Public list filter

`GET /api/blogs`, `/api/careers`, `/api/services`, `/api/products`, and `/api/solutions` treat the caller as public when the `Authorization` header is absent, and then return only `status: "Published"`.

If the header is present, they return every status. They do not verify the JWT on those list routes. The public site must not send `Authorization`. The admin must send it if the list should include drafts.

Slug detail routes always require `status: "Published"`, even if a token is sent. Drafts and `Closed` jobs are not available by slug.

---

## 6. Authorization

Roles stored on `User.role`: `admin`, `editor`, `viewer`. Default on the schema is `admin`. `createUser` defaults a missing role to `editor`.

`authorize('admin')` is applied only to `/api/admin/users`. Those handlers also check `req.user.role === 'admin'` again.

Every other `/api/admin/*` route uses `protect` only. A valid `editor` or `viewer` token can create, update, and delete content, contacts, applications, media, and settings.

There is no permission string, no ownership check beyond “has a valid token”, and no check that `User.status` is `active`.

| Module | Method | Endpoint | Required |
| --- | --- | --- | --- |
| Users | GET, POST | `/api/admin/users` | `protect` + role `admin` |
| Users | PUT, DELETE | `/api/admin/users/:id` | `protect` + role `admin` |
| All other `/api/admin/*` | * | listed below | `protect` only |
| Public reads and public writes | * | `/api/blogs`, `/api/contact`, applications, and the other public paths | none |

User rules that are extra to the role check:

- Cannot create or promote a user to `admin`. 400 “Cannot create another admin…” or “Cannot promote a user to admin…”.
- Cannot update or delete a user whose current role is `admin`. 403.
- Create rejects a duplicate email. 400.
- Password is hashed with bcrypt salt 10. Responses omit `passwordHash`.

---

## 7. Endpoint inventory

Prefixes are fully resolved.

| Method | Endpoint | Controller | Auth | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/health` | inline | Public | DB health |
| GET | `/api/health` | inline | Public | DB health |
| POST | `/api/auth/login` | `login` | Public | Sign in |
| POST | `/api/auth/logout` | `logout` | Public | Clear cookie |
| POST | `/api/auth/setup` | `setupAdmin` | Public, blocked in production | Create the first admin |
| GET | `/api/admin/users` | `getUsers` | Admin role | List users |
| POST | `/api/admin/users` | `createUser` | Admin role | Create editor or viewer |
| PUT | `/api/admin/users/:id` | `updateUser` | Admin role | Update name, email, role, status |
| DELETE | `/api/admin/users/:id` | `deleteUser` | Admin role | Delete a non-admin |
| GET | `/api/blogs` | `getBlogs` | Public; header changes the filter | List blogs |
| GET | `/api/blogs/:slug` | `getBlogBySlug` | Public | Published blog |
| POST | `/api/admin/blogs` | `createBlog` | Token | Create blog |
| PUT | `/api/admin/blogs/:id` | `updateBlog` | Token | Replace blog fields |
| DELETE | `/api/admin/blogs/:id` | `deleteBlog` | Token | Delete blog |
| GET | `/api/careers` | `getCareers` | Public; header changes the filter | List jobs |
| GET | `/api/careers/:slug` | `getCareerBySlug` | Public | Published job |
| POST | `/api/careers/:slug/applications` | `submitApplication` | Public | Apply |
| POST | `/api/admin/careers` | `createCareer` | Token | Create job |
| PUT | `/api/admin/careers/:id` | `updateCareer` | Token | Update job |
| DELETE | `/api/admin/careers/:id` | `deleteCareer` | Token | Delete job |
| GET | `/api/admin/applications` | `getApplications` | Token | List applications |
| PUT | `/api/admin/applications/:id/status` | `updateApplicationStatus` | Token | Status and notes |
| GET | `/api/services` | `getServices` | Public; header changes the filter | List services |
| GET | `/api/services/:slug` | `getServiceBySlug` | Public | Published service |
| GET | `/api/admin/services/:id` | `getServiceById` | Token | Any status, by id |
| POST | `/api/admin/services` | `createService` | Token | Create service |
| PUT | `/api/admin/services/:id` | `updateService` | Token | Update service |
| DELETE | `/api/admin/services/:id` | `deleteService` | Token | Delete service |
| GET | `/api/solutions` | `getSolutions` | Public; header changes the filter | List solutions |
| GET | `/api/solutions/:slug` | `getSolutionBySlug` | Public | Published solution |
| GET | `/api/admin/solutions/:id` | `getSolutionById` | Token | Any status, by id |
| POST | `/api/admin/solutions` | `createSolution` | Token | Create solution |
| PUT | `/api/admin/solutions/:id` | `updateSolution` | Token | Update solution |
| DELETE | `/api/admin/solutions/:id` | `deleteSolution` | Token | Delete solution |
| GET | `/api/products` | `getProducts` | Public; header changes the filter | List products |
| GET | `/api/products/:slug` | `getProductBySlug` | Public | Published product |
| POST | `/api/admin/products` | `createProduct` | Token | Create product |
| PUT | `/api/admin/products/:id` | `updateProduct` | Token | Update product |
| DELETE | `/api/admin/products/:id` | `deleteProduct` | Token | Delete product |
| POST | `/api/contact` | `submitContact` | Public | Inquiry |
| GET | `/api/admin/contacts` | `getContacts` | Token | List inquiries |
| PUT | `/api/admin/contacts/:id/status` | `updateContactStatus` | Token | Set status |
| DELETE | `/api/admin/contacts/:id` | `deleteContact` | Token | Delete inquiry |
| GET | `/api/settings` | `getSettings` | Public | Site settings or defaults |
| PUT | `/api/admin/settings` | `updateSettings` | Token | Upsert the one settings document |
| GET | `/api/admin/media` | `listMedia` | Token | Latest 100 media rows |
| POST | `/api/admin/upload` | `uploadAsset` | Token | Multipart upload |
| POST | `/api/admin/ai/generate-blog` | `generateBlogContent` | Token | Gemini JSON for a blog |
| POST | `/api/admin/ai/generate-career` | `generateCareerContent` | Token | Gemini JSON for a job |
| POST | `/api/admin/ai/generate-service` | `generateServiceContent` | Token | Gemini JSON for a service |
| POST | `/api/admin/ai/generate-solution` | `generateSolutionContent` | Token | Gemini JSON for a solution |

No PATCH routes. No export or download routes.

---

## 8. Backend request and response contracts

### Health

`GET /health` and `GET /api/health`

`200` when `mongoose.connection.readyState === 1`, else `503`:

```json
{ "success": true, "status": "healthy", "environment": "development" }
```

`status` is `unhealthy` and `success` is false when the database is down. These routes still answer if the connection attempt failed. Other routes then return `500` `{ success: false, message: "Database connection failed", error: "Database connection failed" }`.

### Content writes

Create returns `201` and the document. Update returns `200` and the document. Delete returns `200` `{ "message": "<Resource> deleted" }` (career message is “Job deleted”, contact “Contact deleted”, user “User removed”).

Missing id: `404 { "error": "<Resource> not found" }`. Bad id format: `400 { success: false, message: "Invalid id", error: "Invalid id" }`.

`Model.create` runs the schema. A required-field, enum, or unique-index failure on blog, career, product, and settings create/update is `400 { "error": "Invalid data" }`. Contact create uses a different string: `400 { "error": "Failed to submit contact form. Please check your data." }`. User create, update, and delete catch every throw as `500 { "error": "Server error" }`. Duplicate email on user create is checked first and returns `400 { "error": "User with this email already exists" }`.

`findByIdAndUpdate` is called without `runValidators`. Enum and required checks therefore run on create, and they are not applied again on a normal update. A unique index can still reject an update. Do not treat an update `200` as proof that `status` is one of the enum values.

Controllers pass `req.body` into `Model.create` / `findByIdAndUpdate`. They do not strip unknown fields except for the service and solution slug normalization. Mongoose still drops fields that are not in the schema.

Required schema fields:

| Model | Required |
| --- | --- |
| Blog | `title`, `slug` (unique), `excerpt`, `content`, `author`, `category` |
| Career | `title`, `slug` (unique), `department`, `location`, `employmentType`, `experience`, `description`. Each `applicationFields[]` item needs `name`, `label`, `type` |
| Service | `title`, `slug` (unique), `description`, `icon` |
| Solution | `title`, `slug` (unique), `description`, `icon` |
| Product | `name`, `slug` (unique), `tagline`, `description`, `icon`. Optional: `shortDescription`, `longDescription` (sanitized HTML), `type` (`app`, `website`, `both`), `websiteUrl`, `playStoreUrl`, `appStoreUrl`, `category`, `heroDescription`, `heroImage`, `logo`, `dashboardImage`, `websitePreviewImage`, `gallery[]`, `features[]` (string or `{ title, description, icon }`), `metrics[]`, `benefits[]`, `technologyStack[]`, `mobileScreenshots[]`, `ctaTitle`, `ctaDescription`, `seo` |
| Contact | `firstName`, `lastName`, `email`, `interest`, `message` |
| Application | `applicantName`, `email`, `phone`, `experience`, `resumeUrl`, and `jobId` (set by the server from the slug) |
| User | `name`, `email` (unique, lowercased), `password` on create (stored as `passwordHash`) |
| Site settings | `companyName`, `address`, `email`, `phone`, `whatsapp` when creating the document |
| Media | Filled by the upload controller |

Enums:

| Field | Values | Default |
| --- | --- | --- |
| Blog, Service, Solution, Product `status` | `Draft`, `Published` | `Draft` |
| Career `status` | `Draft`, `Published`, `Closed` | `Draft` |
| Contact `status` | `New`, `Read`, `Responded`, `Archived` | `New` |
| Application `status` | `New`, `Reviewing`, `Shortlisted`, `Interview`, `Rejected`, `Hired` | `New` |
| User `role` | `admin`, `editor`, `viewer` | schema default `admin`; create API default `editor` |
| User `status` | `active`, `inactive` | `active` |
| Career field `type` | `text`, `email`, `tel`, `select`, `file`, `textarea` | required on the subdocument |

Controllers do not enforce a transition graph. Any stored status can be replaced by any other value the update accepts. Create rejects a value outside the enum. Update does not re-run that check.

Service, solution, product, blog, and career slugs, on create and when `slug` is sent on update: trim, lowercase, then `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. Failure: `400 { "error": "Slug must be lowercase words separated by hyphens." }`. Duplicate key `11000`: `400 { "error": "Slug already exists. Please choose another slug." }`.

`longDescription` on products, services, solutions, and careers, and HTML `content` on blogs, is sanitized before save. Allowed tags are headings, paragraphs, lists, links, images, tables, and basic emphasis. `script`, event handlers, and `javascript:` URLs are removed. Draft records stay off the public slug routes.

Sort:

| List | Order |
| --- | --- |
| Blogs | `publishedAt` desc, then `createdAt` desc |
| Careers, contacts, applications, media | `createdAt` desc |
| Services, solutions, products | `order` asc, then `createdAt` desc |
| Users | `createdAt` desc |

No `search`, `page`, `limit`, `sort`, or `status` query parameters, except `jobId` on `GET /api/admin/applications`.

### Applications

`POST /api/careers/:slug/applications`

Finds the career by slug with no status filter, so a draft or closed slug still accepts an application if the caller knows the slug. The public detail route will not show those jobs.

Creates `Application` with `req.body` plus `jobId`. Success `201`:

```json
{ "message": "Application submitted successfully", "id": "<application _id>" }
```

The body must include the model fields `applicantName`, `email`, `phone`, `experience`, and `resumeUrl`. `jobId` is set by the server. Optional: `fields` (mixed object), `notes`, `status`. Unknown top-level keys are dropped. The controller does not copy dynamic form names into `applicantName` or `resumeUrl`.

The public career page posts JSON built from `job.applicationFields` names. Seeded jobs use names such as `fullName`, `email`, `phone`, `experience`, `resumeUrl`, `linkedin`, and `portfolio`. `fullName` is not `applicantName`, and the second seeded job has no `phone` or `resumeUrl`. Those submissions return `400 { "error": "Invalid application data" }` unless the client also sends the required model fields. A `file` field is not uploaded here. This route is JSON only. There is no multipart application endpoint.

`GET /api/admin/applications`

Optional query `jobId`. Populates `jobId` with `title` and `department`. Sorted newest first.

`PUT /api/admin/applications/:id/status`

Body `{ "status": "<enum>", "notes"?: string }`. `notes` is written only when the key is present. Returns the application document.

### Contacts

`POST /api/contact` creates the document and returns `201`:

```json
{ "message": "Message sent successfully. We will be in touch shortly." }
```

It does not return the saved document and it does not send email.

`PUT /api/admin/contacts/:id/status` with `{ "status" }`. There is no `PUT /api/admin/contacts/:id`. The current admin page calls the path without `/status`. That request hits the 404 handler.

### Settings

`GET /api/settings` returns the single `SiteSettings` document. If none exists, it returns this object and does not insert it:

```json
{
  "companyName": "Technic Technologies",
  "address": "100 Innovation Drive\nTech District, CA 94043",
  "email": "hello@technic.dev",
  "phone": "+1 (555) 000-0000",
  "whatsapp": "+1 (555) 000-0001",
  "socialLinks": {},
  "googleMaps": "",
  "footerInformation": "© 2026 Technic Technologies. All rights reserved."
}
```

`socialLinks` may include `facebook`, `twitter`, `linkedin`, `instagram`, `github`.

`PUT /api/admin/settings` creates the document or updates the existing one with `req.body`. `whatsapp` is required by the schema on create.

### Upload

`POST /api/admin/upload`

`multipart/form-data`. File field name: `image`. Optional text fields: `folder`, `alt`.

Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `video/quicktime`. Max size 4 MB. Other types or a Multer error: `400 { "error": "<multer or filter message>" }`.

`folder` must be `blogs`, `products`, `services`, `solutions`, or `media`. Anything else is stored as `media`. Cloudinary folder is `technic/{folder}`.

Missing file: `400` `{ success: false, message: "Choose a file to upload.", error: "Choose a file to upload." }`.

`201`:

```json
{ "url": "https://...", "publicId": "technic/...", "id": "<media _id>" }
```

`500` if Cloudinary env vars are missing (`{ "error": "Cloudinary is not configured." }`) or the upload throws (`success: false`, “Upload failed.”). A token that verifies but has no `id` returns `401 { "error": "Not authorized." }`. Login tokens include `id`.

`GET /api/admin/media` failure is `500 { "error": "Could not load media." }`.

There is no delete-media route and no download route. The URL is the Cloudinary `secure_url`.

`GET /api/admin/media` returns the newest 100 `Media` documents: `filename`, `url`, `type` (`image` or `video`), `mimeType`, `size`, `alt`, `uploadedBy`, timestamps.

### AI

`POST /api/admin/ai/generate-blog|career|service|solution`

Body `{ "prompt": string }`. Empty or non-string: `400 { "error": "Valid prompt is required" }`.

Success `200`: `{ "data": <normalized object> }`. The handlers do not save to MongoDB.

Blog `data`: `title`, `slug`, `excerpt`, `content`, `author` (default `Technic Team`), `category` (default `Technology`), `tags[]`, `featuredImage` (`""`), `gallery` (`[]`), `video` (`""`), `seo.title`, `seo.description` (max 160 characters). Slugs are lowercased and hyphenated by the normalizer.

Career `data`: `title`, `slug`, `department`, `location`, `employmentType`, `experience`, `experienceOptions[]`, `description`, `responsibilities[]`, `requirements[]`, `skills[]`, `salary`. No `applicationEmail` and no `applicationFields`.

Service `data`: `title`, `slug`, `shortDescription`, `description`, `icon`, `heroEyebrow`, `heroTitle`, `heroDescription`, `benefits[]`, `overview`, `features[]`, `technologies[]`, `process[]`, `deliverables[]`, `useCases[]`, `faqs[]`, `cta`, `seo`. No `image`, `heroImage`, `order`, or `status`. Icons are kept only when they are one of `Layout`, `Smartphone`, `Terminal`, `Sparkles`, `Code`, `Server`, `ShieldCheck`, `Layers`, `Cpu`, `Bot`, `Rocket`. Anything else becomes `Code` (or `""` on a nested item).

Solution `data`: `title`, `slug`, `shortDescription`, `description`, `industry`, `icon`, `heroTitle`, `heroDescription`, `overview`, `benefits[]`, `features[]`, `useCases[]`, `process[]`, `technologies[]`, `faqs[]`, `cta`, `seo`. No `metrics`, `cardImage`, `heroImage`, or `overviewImage`. Solution icons add `HeartPulse`, `GraduationCap`, `ShoppingCart`, `Factory`, `Truck`, `Landmark`. The fallback icon is `Layers`.

Failure `500`. In production the message is “AI generation failed. Try again shortly.” Otherwise it is the Gemini or timeout message. Body: `{ success: false, message, error }`.

Gemini is called with a 25s timeout. Models tried, in order: `gemini-flash-latest`, then `gemini-2.5-flash`.

### Users

`POST /api/admin/users` body: `name`, `email`, `password`, optional `role` (`editor` or `viewer` only).

`PUT /api/admin/users/:id` body: `name`, `email`, `role`, `status`. It does not update the password. Passing `role: "admin"` is rejected even for a non-admin target.

List and mutation responses never include `passwordHash`.

---

## 9. Clients that call this backend

This section lists which apps call which backend routes. It is not a frontend specification. Verified against the two client repositories in this workspace.

### Public site (`technic-technologies`)

The public client does not send `Authorization`, so list routes return published rows only.

| Page | Method | Endpoint |
| --- | --- | --- |
| Home, services section, footer, contact interest labels | GET | `/api/services` |
| Service detail and related | GET | `/api/services/:slug`, `/api/services` |
| Home products, footer, contact interest labels | GET | `/api/products` |
| Solutions list and related | GET | `/api/solutions` |
| Solution detail | GET | `/api/solutions/:slug` |
| Contact, solutions, privacy, terms | GET | `/api/settings` |
| Contact, services, and solutions forms | POST | `/api/contact` |
| Blog list | GET | `/api/blogs` |
| Blog article | GET | `/api/blogs/:slug` |
| Careers list | GET | `/api/careers` |
| Career detail | GET | `/api/careers/:slug` |
| Career application | POST | `/api/careers/:slug/applications` |

The public product cards do not call `GET /api/products/:slug`.

### Admin (`technic-technologies-admin`)

The admin sends `Authorization: Bearer` from its cookie, so the list routes include drafts.

| Screen | Method | Endpoint |
| --- | --- | --- |
| Login | POST | `/api/auth/login` |
| Logout | POST | `/api/auth/logout` |
| Dashboard counts | GET | `/api/careers`, `/api/blogs`, `/api/services`, `/api/products`, `/api/admin/contacts` |
| Blogs | GET, POST, PUT, DELETE | `/api/blogs`, `/api/admin/blogs`, `/api/admin/blogs/:id` |
| Blog AI | POST | `/api/admin/ai/generate-blog` |
| Careers | GET, POST, PUT, DELETE | `/api/careers`, `/api/admin/careers`, `/api/admin/careers/:id` |
| Career AI | POST | `/api/admin/ai/generate-career` |
| Services | GET, POST, PUT, DELETE | `/api/services`, `/api/admin/services`, `/api/admin/services/:id` |
| Service AI | POST | `/api/admin/ai/generate-service` |
| Solutions | GET, POST, PUT, DELETE | `/api/solutions`, `/api/admin/solutions`, `/api/admin/solutions/:id` |
| Solution AI | POST | `/api/admin/ai/generate-solution` |
| Products | GET, POST, PUT, DELETE | `/api/products`, `/api/admin/products`, `/api/admin/products/:id` |
| Applications | GET, PUT | `/api/admin/applications`, `/api/admin/applications/:id/status` |
| Contacts list and delete | GET, DELETE | `/api/admin/contacts`, `/api/admin/contacts/:id` |
| Contact status in the current admin page | PUT | `/api/admin/contacts/:id` — **this path is not implemented** |
| Contact status on the backend | PUT | `/api/admin/contacts/:id/status` |
| Media | GET | `/api/admin/media` |
| Upload | POST | `/api/admin/upload` |
| Settings | GET, PUT | `/api/settings`, `/api/admin/settings` |

Not called by either client: `/health`, `/api/health`, `/api/auth/setup`, all `/api/admin/users` routes, `GET /api/products/:slug`, `GET /api/admin/applications?jobId=`.

---

## 10. Business flows

### Public catalog

```text
Browser (no Authorization)
  → GET /api/{blogs|careers|services|products|solutions}
  → controller sets status Published
  → JSON array
```

Detail by slug adds `status: Published` in the query. 404 `{ "error": "..." }` when missing. The public service and solution pages also treat `Draft` as not found if a draft body were returned. The slug endpoints do not return drafts.

### Inquiry

```text
POST /api/contact
  → Contact.create
  → 201 { message }
```

No email, no WhatsApp send. WhatsApp is only a string on settings.

### Application

```text
POST /api/careers/:slug/applications
  → career by slug, any status
  → Application.create(body + jobId)
  → 201 { message, id } or 400
```

### Admin edit

```text
Bearer token
  → GET list with Authorization (all statuses) or GET /api/admin/services|solutions/:id
  → PUT /api/admin/{resource}/:id
  → document or 400/404
```

Service and solution ids that are not ObjectIds fail in `validateObjectId` with 400 before the controller.

### Publish

Status is a field on create/update. There is no `/publish` route and no check that `publishedAt` is set. Public slug and unauthenticated list queries hide anything that is not `Published`, including `Closed` jobs.

### Contact review

Intended: `PUT /api/admin/contacts/:id/status` with `{ status }`. The admin UI currently omits `/status`.

Opening a message does not change status on the server by itself. The admin page tries a PUT when status is `New`.

### Application review

`PUT /api/admin/applications/:id/status` with `{ status, notes }`. The admin page auto-sends `Reviewing` when the loaded status is `New`, then saves the chosen status and notes.

---

## 11. Backend error responses

| Situation | Status | Body |
| --- | --- | --- |
| Missing or bad login fields | 400 | `success`, `message`, `error` |
| Bad credentials | 401 | `{ error: "Invalid email or password" }` |
| No token | 401 | `{ error: "Not authorized, no token" }` |
| Bad or expired token | 401 | `success: false`, “Not authorized, token failed” |
| Role is not admin on user routes | 403 | `{ error: "..." }` |
| Setup in production | 403 | `success: false`, “Setup is disabled in production” |
| Admin already exists | 403 | `{ error: "Setup locked: An admin user already exists in the system." }` |
| Unknown route, including `PUT /api/admin/contacts/:id` | 404 | `success: false`, “Not found” |
| Missing document | 404 | `{ error: "<Name> not found" }` |
| Bad ObjectId | 400 | `success: false`, “Invalid id” |
| Blog, career, product, or settings schema failure | 400 | `{ error: "Invalid data" }` |
| Contact create schema failure | 400 | `{ error: "Failed to submit contact form. Please check your data." }` |
| Application schema failure | 400 | `{ error: "Invalid application data" }` |
| User create, update, or delete throw | 500 | `{ error: "Server error" }` |
| Login throw | 500 | `{ error: "Server error" }` |
| Setup throw | 500 | `{ error: "Server error during setup" }` |
| Service or solution slug shape | 400 | `{ error: "Slug must be lowercase words separated by hyphens." }` |
| Service or solution duplicate slug | 400 | `{ error: "Slug must be unique." }` |
| Upload type or size | 400 | `{ error: "<message>" }` |
| AI prompt missing | 400 | `{ error: "Valid prompt is required" }` |
| AI or unexpected throw | 500 | production: generic “AI generation failed…” or “Something went wrong”; development: the error message |
| Database down on a normal route | 500 | “Database connection failed” |
| Database down on health | 503 | `success: false`, `status: "unhealthy"` |

The global handler hides exception text when `NODE_ENV=production`.

CORS: credentialed requests. Allowed origins are localhost and `127.0.0.1` on ports 3000, 3005, 3006, and 5000, plus `FRONTEND_URL` and `ADMIN_URL` with a trailing slash stripped. A browser origin that is not in that set is rejected. Requests with no `Origin` are allowed. JSON body limit is 1 MB. Upload limit is 4 MB and is separate from the JSON limit.

---

## 12. Data model

```text
User
Media.uploadedBy → User

Career
Application.jobId → Career

Blog
Service
Solution
Product
Contact
SiteSettings   (one document, not linked)
```

No soft delete. Timestamps `createdAt` and `updatedAt` on every schema. Deletes are hard `findByIdAndDelete`. Deleting a career does not delete its applications.

---

## 13. What is not in this backend

Not found in the implementation:

- Registration, password reset, OTP, refresh tokens
- Email, SMS, push, or in-app notification APIs
- WebSockets
- Queues, workers, or cron
- CSV, Excel, or PDF import/export
- Payment providers
- Search, pagination metadata, or a status query parameter
- A dedicated publish, approve, or restore endpoint
- Rate limiting

`zod` is installed and unused. Compiled `.js` copies of some models sit next to the TypeScript sources. The running app imports the `.ts` models through `tsx` in development and `dist/` after `npm run build`.

`npm run seed` is a script, not an HTTP API. When `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` are set, it creates that user as `admin` / `active`, or replaces the password hash if the email already exists. If the careers, services, solutions, or products collections are empty, it inserts published sample rows. It does not seed blogs, contacts, settings, or media. `scripts/ensureSolutions.ts` inserts `defaultSolutions` only when the solutions collection is empty. `scripts/copyLocalDb.ts` is a local copy script. Neither is mounted on the HTTP app.

---

## 14. Environment names

Values are not listed here.

| Name | Where it is used |
| --- | --- |
| `PORT` | `server.ts`. Unset means `5000`. `.env.example` sets `3001` |
| `MONGODB_URI` | `src/config/db.ts`. Required. A localhost URI is rejected when `VERCEL` is set |
| `JWT_SECRET` | JWT sign and verify. Missing secret fails login and `protect` |
| `FRONTEND_URL` | Extra CORS origin. Trailing slash is stripped |
| `ADMIN_URL` | Extra CORS origin. Trailing slash is stripped |
| `DEFAULT_ADMIN_EMAIL` | `POST /api/auth/setup` and `npm run seed` |
| `DEFAULT_ADMIN_PASSWORD` | Same |
| `GEMINI_API_KEY` | AI routes. Sent as `X-goog-api-key`. Never return it to the browser |
| `CLOUDINARY_CLOUD_NAME` | Upload. Required or upload returns 500 |
| `CLOUDINARY_API_KEY` | Upload |
| `CLOUDINARY_API_SECRET` | Upload |
| `CLOUDINARY_URL` | Present in `.env.example`. The Cloudinary client in `src/config/cloudinary.ts` uses the three variables above, not this URL |
| `NODE_ENV` | Cookie `secure` / `sameSite`, setup lock, and whether 500 text is generic |
| `VERCEL` | Skips `app.listen` and rejects a localhost Mongo URI |

---

## 15. Second-pass audit

Every `router.get/post/put/delete` and both `app.get` health routes were listed again and matched to section 7.

| Method | Count |
| --- | --- |
| GET | 19 |
| POST | 16 |
| PUT | 9 |
| PATCH | 0 |
| DELETE | 7 |
| Total | 51 |

`validateObjectId` is registered on the user, blog, career, service, solution, product, and contact routers. It is not registered on auth, settings, AI, or upload. Those routers have no `:id` param.

Not found, confirmed on the second pass: PATCH, refresh tokens, registration, password reset, OTP, email, SMS, WebSockets, queues, cron, payments, export, import, search query params, and pagination metadata. The only list cap is media `limit(100)`. The only list query param is `jobId` on `GET /api/admin/applications`.
