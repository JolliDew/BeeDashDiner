# JolliDew demo video script (10–12 minutes)

Record on the deployed Render URL, not localhost. Use two browser profiles or log
out between roles. Keep the database visible in a second tab for the database
segment.

## Before recording

- Deploy and open `https://YOUR-SERVICE.onrender.com/login.php`.
- Log in as `demo_admin` once to confirm the admin link appears.
- Create/confirm `demo_player` and one spare test account for admin CRUD.
- Have Supabase → Table editor and Render dashboard open in other tabs.
- Hard reload once; the game now sends no-cache headers.
- Set the game audio to a comfortable level with the speaker panel.

## 0:00–1:00 — Introduction

Say:

> “We are Group [name]. Our system is JolliDew, a cloud-based bee café game with
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
4. Show the **Restart progress** confirmation (do not delete the demo progress
   unless you have a backup; if you do, show the fresh Level 1 menu afterwards).

## 10:00–11:00 — Closing

Say:

> “We learned how to connect a game, authentication, role-based CRUD and a cloud
> database into one system. The hardest parts were reliable saving, calm customer
> pacing, audio autoplay rules and deployment. Next we would move avatar uploads
> to Supabase Storage, add login rate limiting and shared session storage for
> multiple app instances. Thank you.”

Every member should appear or speak in at least one segment. Keep the browser
console closed unless you are demonstrating a bug-free load.
