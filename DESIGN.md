# Backend design

This file belongs to `technic-technologies-backend`. It records how this backend behaves for the apps that call it. It is not a visual design system. Colors, layout, and components live in the public site and the admin app.

## Base URL

The process listens on `PORT`, default `5000` in code and `3001` in `.env.example`. The public site and admin app call `NEXT_PUBLIC_API_URL`, default `http://localhost:3001`. CORS allows credentialed browser calls from localhost ports `3000`, `3005`, `3006`, and `5000`, plus `FRONTEND_URL` and `ADMIN_URL`.

Send JSON as `Content-Type: application/json` except for upload.

## Sign-in

`POST /api/auth/login` with `{ email, password }`.

Success is `200` and `{ _id, name, email, role, token }`. There is no `success` flag. Store `token` and send `Authorization: Bearer <token>` on later calls. The API also sets an httpOnly `token` cookie. In development that cookie is `SameSite=Strict`, so a page on another port will not send it. The admin app’s own cookie plus the Bearer header is what actually authenticates.

Empty fields are `400`. Wrong email or password is `401 { error: "Invalid email or password" }`. Email matching is case-sensitive against the stored lowercase address. `inactive` users are not blocked.

`POST /api/auth/logout` clears the API cookie and returns `{ message }`. Discard the Bearer token in the client as well. The server does not invalidate it.

There is no registration, forgot-password, OTP, or refresh call.

## Who can do what

Roles are `admin`, `editor`, and `viewer`. Only user management requires `admin`. A valid token of any role can create, edit, and delete blogs, jobs, services, solutions, products, contacts, applications, media, and settings. The admin UI does not need a permission matrix for those screens. It does need to treat `401` as “send the user to login.”

`403` on user routes means the token’s role is not `admin`, or the target user is the existing admin. The API will not create or promote another `admin`.

## Lists and drafts

Public pages must omit `Authorization`. Those list calls return only `Published` rows.

Admin list calls must send `Authorization`. Any value in that header, including an expired token, makes the list include drafts. Slug URLs still return only `Published`. Draft services and solutions are loaded with `GET /api/admin/services/:id` and `GET /api/admin/solutions/:id`. Blogs, careers, and products have no get-by-id route. The admin editor finds them in the list.

Lists are arrays sorted as documented in `BACKEND.md`. There is no `page`, `limit`, `search`, or `status` query, except `jobId` on the applications list. The media list stops at 100 rows. Empty is `[]`, not an error.

## Forms

Create is `201` plus the document. Update is `200` plus the document. Delete is `200 { message }`. A missing id is `404 { error }`. A non-ObjectId `:id` is `400` “Invalid id”.

Required fields are the Mongoose required paths in `BACKEND.md`. The API usually answers `400 { error: "Invalid data" }` and does not return per-field errors. Contact create says “Failed to submit contact form. Please check your data.” Applications say “Invalid application data.” Service and solution slugs must match lowercase hyphenated words. Show that exact error when it comes back.

Status values:

| Resource | Values | Default on create |
| --- | --- | --- |
| Blog, service, solution, product | `Draft`, `Published` | `Draft` |
| Career | `Draft`, `Published`, `Closed` | `Draft` |
| Contact | `New`, `Read`, `Responded`, `Archived` | `New` |
| Application | `New`, `Reviewing`, `Shortlisted`, `Interview`, `Rejected`, `Hired` | `New` |
| User | `active`, `inactive` | `active` |

There is no separate publish endpoint. Setting `status` to `Published` is the publish action. Updates do not re-check the enum. The public site hides anything that is not `Published`, including `Closed` jobs, on both the list (without Authorization) and the slug page.

## Contact status

The working call is `PUT /api/admin/contacts/:id/status` with `{ status }`. `PUT /api/admin/contacts/:id` is not implemented and returns `404` “Not found”. The current admin contact screen uses the unimplemented path. A status change will not persist until that client calls `/status`.

Submitting the public contact form is `POST /api/contact`. Success is `201` and a message only. Nothing is emailed.

## Applications

`POST /api/careers/:slug/applications` needs `applicantName`, `email`, `phone`, `experience`, and `resumeUrl`. Field names on the job’s `applicationFields` array are not remapped. Seeded jobs use `fullName` and, on one job, omit `phone` and `resumeUrl`, so the default public form body does not satisfy the model.

The route accepts a draft or closed slug if the caller knows it. The public slug page will not show those jobs.

Review is `PUT /api/admin/applications/:id/status` with `{ status, notes }`. `notes` is written only when the key is present. There is no delete.

## Upload

`POST /api/admin/upload` as `multipart/form-data`, file field `image`, optional `folder` and `alt`. Allowed types: JPEG, PNG, WEBP, GIF, MP4, WEBM, QuickTime. Max 4 MB. Unknown folders are stored as `media`. Success `201` is `{ url, publicId, id }`. Put `url` on the content field (`featuredImage`, `image`, `heroImage`, and so on). There is no delete-media or download route.

## AI fill

`POST /api/admin/ai/generate-blog|career|service|solution` with `{ prompt }`. Fill the form from `response.data`. Do not expect images, ids, or status. Career generation does not return the application form. Failure is `500`. In production the message is generic.

## Settings

`GET /api/settings` is public and returns defaults when no document exists, including `whatsapp`. `PUT /api/admin/settings` creates or replaces the single document. Send `whatsapp` on the first save. The API does not open WhatsApp or send mail.

## Backend error responses

Read `error`, then `message`. Both are usually the same string.

| Status | What the caller receives |
| --- | --- |
| 400 | Show `error`. Do not assume a field map |
| 401 | Clear the session and go to login, except on the login request itself |
| 403 | The user is signed in and is not allowed to do this |
| 404 | Missing record, or a path the API does not have |
| 500 | Generic failure. In production the text is “Something went wrong” except AI, which says to try again shortly |
| 503 | Health only. The database is down |

Health is `GET /api/health` and `GET /health`. Neither frontend calls them today.
