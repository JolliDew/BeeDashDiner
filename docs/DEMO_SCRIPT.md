# BeeDashDiner demo video script (10–12 minutes)

CC106 — Cloud-Based Application Development · Culminating Learning Evidence (CLE) · Group AQM ·
BS Computer Science, 3rd Year, 1st Semester · Instructor: Japhet Rocamora
Pagarigan.

Record on the deployed Render URL, not localhost. Use two browser profiles or log
out between roles. Keep the database visible in a second tab for the database
segment.

## Before recording

1. Open `https://beedashdiner.onrender.com/login.php` **10 minutes early** so
   Render's free instance is awake.
2. Log in as `demo_admin` once to confirm the **Admin** link appears, then log
   out. Log in as `demo_player` once to confirm the saved game loads, then log
   out.
3. Test **Sign in with Google** once with the Google account you will use. If
   Google says "Access blocked", ask JD to add that Gmail as a Test user in the
   OAuth consent screen.
4. Create one spare account called `demo_crud` (or similar) for the admin CRUD
   segment. You will delete it on camera.
5. Have these tabs ready, in this order:
   - `https://beedashdiner.onrender.com/login.php`
   - the game main menu
   - Supabase → **Table editor** → `users` / `player_progress`
   - Render dashboard → the **beedashdiner** service
   - Google Cloud Console → **Credentials**, only if showing OAuth setup
6. Use a 1440×900 browser window, hide the bookmarks bar, and hard-reload once.
7. Set the game audio to a comfortable level with the speaker panel.

## Who speaks (all five must appear)

| Member | Suggested segments |
|---|---|
| Iszen Paul Masculino Ventura | Introduction and closing |
| John David Pascua Morandante | Database and cloud deployment |
| Klein Rhee Pagulong Sioson | Admin walkthrough and security |
| Emman Glen Mendoza Wong Yan | Player walkthrough and game mechanics |
| Ardion Nicolas Dela Cruz Tamagos | Game round and visual design |

If someone cannot record, they can speak over a screen recording. Every member
must be seen or heard at least once.

## Exact click path (for the person driving)

- **Login/admin:** log in as `demo_admin` → **Admin** → search `demo_player` →
  create `demo_crud` → edit its email → reset its password → reset its progress
  → delete it → show the new audit row.
- **Player:** log out → log in as `demo_player` → **Play Game** → open a stall →
  **Mission** → **Upgrades** → **Shop** → serve a guest → exit → play again.
- **403:** in a second tab while still a player, open `/admin.php`.
- **Database:** Supabase → Table editor → `users`, `player_progress`,
  `player_stations`, `admin_audit`; run the join below.
- **Security:** show a bcrypt hash in `users.password`; show the 403 page; show
  the HTTPS padlock.
- **Cloud:** Render dashboard → service **Live** → open the public URL.
- **Game:** **How to play** → mission → serve → progress HUD. Do **not** press
  **Restart progress** on `demo_player`; use a spare account if you want to show
  restart.

## Optional Google segment (30 seconds)

1. Log out to the login page.
2. Click **Sign in with Google**.
3. Choose the test Google account.
4. Show that it returns to the game, then open **Profile** and point out the
   **Set a local password** option.
5. Log out. Do not change the demo accounts' passwords before grading.

## 0:00–1:00 — Introduction

Say:

> “We are Group AQM. Our system is BeeDashDiner, a cloud-based bee café game with
> an admin dashboard. It uses HTML, CSS, JavaScript, Bootstrap, PHP and
> PostgreSQL on Supabase, deployed with Docker on Render. Our roles were backend,
> database, game mechanics, design and QA.”

Show the login page and the shared navigation.

## 1:00–3:30 — Admin walkthrough

1. Log in as **demo_admin**.
2. Point out the **Admin** link in the shared navigation.
3. Open **Admin**.
4. Show the stats cards and account list.
5. Search for `demo_player`.
6. Edit the spare account’s username or email; save.
7. Create a new temporary player; show it in the list.
8. Reset that account’s password or progress.
9. Delete the temporary account; confirm the audit entry appears.
10. Optionally, upload a profile picture from **Profile** and refresh to show it
    persisted in the shared nav.

Say: “Every admin action uses prepared statements, CSRF protection and role
checks. The audit log records the actor, target and action.”

## 3:30–6:00 — Player walkthrough

1. Log out; log in as **demo_player**.
2. Show the menu: saved level, honey, How to play, Restart progress.
3. Press **Play Game**.
4. Show the café: food stalls, hive, door, HUD, dock, audio button.
5. Open a station; show recipe pips, worker slots, price, cook time and milestones.
6. Open **Mission**, **Upgrades** and **Shop**; close each.
7. Serve a guest; point out the tip pop and sound.
8. Change the SFX/Music volume sliders; close audio.
9. Wait for a save, press **Exit**, then **Play Game** again. Show the
   **Welcome back** toast and the saved honey/level.
10. Refresh the page; show that the progress is still there.
11. Open **Profile**; show avatar, saved level/honey and password form.
12. In a second tab, open `.../admin.php` while logged in as the player; show the
    **Access denied** page.
13. Show the phone layout by narrowing the window (or use the phone recording if
    you have one).

## 6:00–7:00 — Database

1. Open Supabase → Table editor.
2. Show `users`, `player_progress`, `player_stations`, `admin_audit`,
   `locations`, `menu_items`.
3. Point at the foreign keys.
4. Show the admin join:

   ```sql
   SELECT u.username, u.role, p.level, p.honey
   FROM users u LEFT JOIN player_progress p ON p.user_id = u.id
   ORDER BY u.id;
   ```

5. Change a small game value (serve a guest or upgrade), then refresh
   `player_progress` to show the change.

## 7:00–8:00 — Security

1. In Supabase, open a user row and show that the password is a bcrypt hash.
2. Show the player getting 403 on `admin.php`.
3. Show a POST without CSRF being rejected (optional).
4. Point out `.htaccess` blocking `db.php` and the non-executable uploads folder.
5. Point out the HTTPS padlock on Render.

## 8:00–9:00 — Cloud deployment

1. Show the Render dashboard service status.
2. Show the public URL and HTTPS.
3. Say: “The Docker image uses PHP 8.2 + Apache, installs PDO PostgreSQL, reads
   `DATABASE_URL` from Render, and the entrypoint listens on Render’s port. The
   database stays on Supabase, so redeploying the app does not touch saves.”

## 9:00–10:00 — Game round

1. Show the rules from **How to play**: goal, controls, win at Level 10.
2. Start a game and serve a few guests.
3. Show the progress HUD, mission dots, score/honey and the door entry.
4. Show the **Restart progress** confirmation (this replaces the demo progress
   with a fresh game, so do not press it unless you have a backup; if you do,
   show the fresh Level 1 menu afterwards).

## 10:00–11:00 — Closing

Say:

> “We learned how to connect a game, authentication, role-based CRUD and a cloud
> database into one system. The hardest parts were reliable saving, calm customer
> pacing, audio autoplay rules and deployment. Next we would move avatar uploads
> to Supabase Storage, add login rate limiting and shared session storage for
> multiple app instances. Thank you.”

Every member should appear or speak in at least one segment. Keep the browser
console closed unless you are demonstrating a bug-free load.

## After recording

1. Save the video as `AQM_BeeDashDiner_Demo.mp4` (or upload it to Google Drive
   and copy the link).
2. Put the video or its link in the professor's Google Drive submission folder.
3. Add the video link to `SUBMISSION_INFO.txt` if you upload a link instead of a
   file.
4. Watch the first and last 15 seconds to confirm the audio and screen capture
   are clean.
