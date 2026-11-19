# Deploying BeeDashDiner on Render

The application is a PHP 8.2 + Apache app. The database stays on Supabase
(PostgreSQL). Render builds the included `Dockerfile`; no buildpack settings are
required.

## Quick path (JolliDew organization)

1. Fast-forward `main` and push it (or push the feature branch and pick it in
   step 2):

   ```bash
   git checkout main
   git merge --ff-only feat/scene-first-ui
   git push origin main
   ```

2. In Render: **New → Blueprint**, connect `JolliDew/JolliDew`, and apply
   `render.yaml`. If you prefer a manual service, use **New → Web Service**,
   Docker, branch `main`, health check `/`.
3. Paste the Supabase **Session pooler** URI as `DATABASE_URL`.
4. Deploy, open the `https://…onrender.com` URL, and log in with
   `demo_player` / `demo_admin`.
5. Replace `YOUR-SERVICE` in `README.md`, this guide and the building document,
   then rebuild the PDF/DOCX and the submission zip.

The detailed steps and the database checks follow.

## 1. Push the repository

Render deploys from GitHub. Push `feat/scene-first-ui` (or merge it into the
branch you want to deploy) from your own machine. Never commit
`gamefile/db.php`, `gamefile/src/google-config.php`, or `.env` files.

## 2. Create the Render service

1. Sign in at <https://render.com>.
2. Choose **New → Web Service** and connect the `JolliDew/JolliDew`
   repository. It is private, so authorize the Render GitHub app for the
   JolliDew organization when GitHub asks.
3. Runtime: **Docker**.
4. Branch: the branch you pushed.
5. Plan: **Free** (or the plan your account provides).
6. Health check path: `/` (the public landing page).
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

## 3. Create the database

The app cannot create its own tables, so initialize Supabase **before** the
first request.

1. In Supabase open **SQL Editor → New query**.
2. Open the repository-root `database.sql`, paste the whole file and run it.
   It creates the schema, the reference data and the two demo accounts, and it
   is safe to run again.
3. Check that it worked:

   ```sql
   SELECT username, role FROM users ORDER BY id;
   ```

   You should see `demo_player` with the role `player` and `demo_admin` with
   the role `admin`. The demo admin is promoted by the seed data itself, so
   there is nothing else to run.
4. Optional: give the demo player a starting save, so the demo video opens on
   a restaurant that is already running:

   ```sql
   INSERT INTO player_progress
          (user_id, honey, location_no, level, diamonds, upgrades,
           mission_index, missions_done, missions_finished, stats, cosmetics)
   VALUES ((SELECT id FROM users WHERE username = 'demo_player'),
           4587.9, 2, 2, 5, '{"staff":1,"seq":0}', 6,
           '["l1_serve5","l1_recipe2","l1_hire2","l2_unlock2","l2_serve20","l2_tips3"]',
           0, '{"served":30,"earned":0,"tips":3,"tipHoney":40}',
           '{"owned":[],"equipped":{"bee":"","theme":""}}')
   ON CONFLICT (user_id) DO UPDATE
      SET honey = EXCLUDED.honey, level = EXCLUDED.level,
          diamonds = EXCLUDED.diamonds, mission_index = EXCLUDED.mission_index,
          missions_done = EXCLUDED.missions_done, stats = EXCLUDED.stats;
   ```

   The server repairs anything this leaves out, so a simpler row also works.

`gamefile/login_db_pg.sql` is the same schema **without** the demo accounts.
Use it when you want an empty database and do not want the grading accounts.

## 4. First-run checks

1. Open `https://YOUR-SERVICE.onrender.com/`; the landing page should load.
2. Log in with `demo_player` / `JolliDemo123!`.
3. Log out, then log in with `demo_admin` / `JolliDemo123!`. The **Admin**
   link should appear.
4. Start a game, exit, reload, and confirm the welcome-back toast and saved
   honey/level.
5. Upload a profile picture from **Profile**.
6. Open `admin.php` while logged in as the player and confirm the access-denied
   page appears.

## 5. Test credentials for the README

Use non-personal demo accounts and put the credentials in the README:

```text
Player: demo_player / JolliDemo123!
Admin:  demo_admin  / JolliDemo123!
```

Those accounts already exist after step 3 — do not register them again, or you
will create a second account with a different password. The password itself may
be shown to the instructor. Do not reuse a personal password.

## 6. HTTPS and cookies

Render terminates TLS at its proxy and sends `X-Forwarded-Proto: https`.
`Auth::start()` treats that as HTTPS, so the session cookie is `Secure`,
`HttpOnly`, and `SameSite=Lax`.

## 7. Important limits of the free plan

- The container filesystem is ephemeral. Uploaded avatars work during a running
  instance but can disappear after a redeploy or restart. For a permanent media
  store, move uploads to Supabase Storage (recommended next step) or attach a
  Render persistent disk on a paid plan. This is documented as a scalability
  limitation in the building document.
- Free services sleep after inactivity; the first request can take a while.
- Use one instance while sessions are stored on the local filesystem. Multiple
  instances would need shared session storage.

## 8. Troubleshooting

| Problem | Check |
|---|---|
| `Database connection failed` | `DATABASE_URL` exists, uses the session pooler, password is URL-encoded, and SSL is enabled |
| “The admin schema is missing.” | Run the repository-root `database.sql` (or `gamefile/upgrade_db.sql`) in the Supabase SQL editor |
| 502 / port error | Render sets `PORT`; the entrypoint makes Apache listen on it |
| CSS missing | `AllowOverride All` is applied in the Dockerfile and `.htaccess` is present |
| Avatar upload fails | `uploads/` is writable by `www-data`; check the Render logs |
| Admin link missing | The `users.role` value is `admin`; log out and back in |
| Google button missing | Expected: the sign-in and registration pages show it only when `gamefile/src/google-config.php` exists |

## 9. Redeploy

Push a new commit to the connected branch, or press **Manual Deploy** in
Render. The database is untouched by redeploys.
