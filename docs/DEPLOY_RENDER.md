# Deploying JolliDew on Render

The application is a PHP 8.2 + Apache app. The database stays on Supabase
(PostgreSQL). Render builds the included `Dockerfile`; no buildpack settings are
required.

## 1. Push the repository

Render deploys from GitHub. Push `feat/scene-first-ui` (or merge it into the
branch you want to deploy) from your own machine. Never commit
`gamefile/db.php`, `gamefile/src/google-config.php`, or `.env` files.

## 2. Create the Render service

1. Sign in at <https://render.com>.
2. Choose **New → Web Service** and connect the JolliDew repository.
3. Runtime: **Docker**.
4. Branch: the branch you pushed.
5. Plan: **Free** (or the plan your account provides).
6. Health check path: `/login.php`.
7. Add the environment variable:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase PostgreSQL **Session pooler** URI |

   Find it in Supabase under **Project Settings → Database → Connection string
   → URI**. Use the session pooler, replace `[YOUR-PASSWORD]`, and keep
   `sslmode=require` if it is present. The container also forces SSL.

8. Create the service. Render builds the `Dockerfile` and gives you a public
   `https://…onrender.com` URL.

`render.yaml` in the repository root can create the same service as a
Blueprint. The `DATABASE_URL` value is marked `sync: false`, so Render asks for
it in the dashboard instead of storing it in git.

## 3. First-run checks

1. Open `https://YOUR-APP.onrender.com/login.php`.
2. Register the demo player account.
3. Register the demo admin account.
4. Promote the admin in the Supabase SQL editor:

   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'demo_admin';
   ```

5. Log out and back in. The **Admin** link should appear.
6. Start a game, exit, reload, and confirm the welcome-back toast and saved
   honey/level.
7. Upload a profile picture from **Profile**.
8. Open `admin.php` while logged in as the player and confirm the access-denied
   page appears.

## 4. Test credentials for the README

Use non-personal demo accounts and put the credentials in the README, for
example:

```text
Player: demo_player / <password>
Admin:  demo_admin  / <password>
```

The password itself may be shown to the instructor. Do not reuse a personal
password.

## 5. HTTPS and cookies

Render terminates TLS at its proxy and sends `X-Forwarded-Proto: https`.
`Auth::start()` treats that as HTTPS, so the session cookie is `Secure`,
`HttpOnly`, and `SameSite=Lax`.

## 6. Important limits of the free plan

- The container filesystem is ephemeral. Uploaded avatars work during a running
  instance but can disappear after a redeploy or restart. For a permanent media
  store, move uploads to Supabase Storage (recommended next step) or attach a
  Render persistent disk on a paid plan. This is documented as a scalability
  limitation in the building document.
- Free services sleep after inactivity; the first request can take a while.
- Use one instance while sessions are stored on the local filesystem. Multiple
  instances would need shared session storage.

## 7. Troubleshooting

| Problem | Check |
|---|---|
| `Database connection failed` | `DATABASE_URL` exists, uses the session pooler, password is URL-encoded, and SSL is enabled |
| 502 / port error | Render sets `PORT`; the entrypoint makes Apache listen on it |
| CSS missing | `AllowOverride All` is applied in the Dockerfile and `.htaccess` is present |
| Avatar upload fails | `uploads/` is writable by `www-data`; check the Render logs |
| Admin link missing | The `users.role` value is `admin`; log out and back in |
| Google button missing | Expected: it only appears when `gamefile/src/google-config.php` exists |

## 8. Redeploy

Push a new commit to the connected branch, or press **Manual Deploy** in
Render. The database is untouched by redeploys.
