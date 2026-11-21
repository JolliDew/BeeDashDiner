<div class="cover">
<p class="eyebrow">CC106 — Cloud-Based Application Development · Culminating Learning Evidence</p>
<h1 class="cover-title">BeeDashDiner</h1>
<p class="cover-sub">Demo Video Recording Script</p>
<p class="cover-tag">Five members · eight clips · one 11-minute video</p>
<div class="cover-meta">
<p><strong>Group AQM</strong> · BS Computer Science · 3rd Year, 1st Semester</p>
<p>University of St. La Salle · Instructor: Japhet Rocamora Pagarigan</p>
<p>November 2026</p>
</div>
<div class="cover-note">
<p><strong>How to use this script.</strong> Each member records their own clip in Zoom. Follow the SHOW and DO lines in order, read the lines in the yellow boxes, and finish with the exact handoff line. The editor joins the clips in the order on the next page.</p>
</div>
</div>

# Master plan

## The 11-minute video

| Time | Segment | Who | Clip | Starts on |
|:----------|:---------|:------|:------------------|:------------|
| 0:00–1:00 | Introduction | Iszen | `01_Iszen_Intro.mp4` | Landing page, logged out |
| 1:00–3:30 | Admin dashboard | Klein | `02_Klein_Admin.mp4` | Login page, logged out |
| 3:30–6:00 | Player walkthrough | Emman | `03_Emman_Player.mp4` | Main menu, player logged in |
| 6:00–7:00 | Database | JD | `04_JD_Database.mp4` | Supabase table editor |
| 7:00–8:00 | Security | Klein | `05_Klein_Security.mp4` | Main menu, player logged in |
| 8:00–9:00 | Cloud deployment | JD | `06_JD_Cloud.mp4` | Render dashboard |
| 9:00–10:00 | Game round + design | Ardion | `07_Ardion_Game.mp4` | Main menu, player logged in |
| 10:00–11:00 | Closing | Iszen | `08_Iszen_Closing.mp4` | Main menu or café |

The times are targets. A clip may run 10–20 seconds over; the editor trims the silence.

## Who does what

| Member | Part | Clips |
|---|---|---|
| **Iszen Paul Masculino Ventura** | Introduction and closing | 01, 08 |
| **Klein Rhee Pagulong Sioson** | Admin dashboard and security | 02, 05 |
| **Emman Glen Mendoza Wong Yan** | Player walkthrough and game mechanics | 03 |
| **John David Pascua Morandante (JD)** | Database and cloud deployment | 04, 06 |
| **Ardion Nicolas Dela Cruz Tamagos** | Game round and visual design | 07 |

If the group records on one laptop, use this order to avoid extra logins: Iszen intro → Klein admin → Klein security → Emman → Ardion → JD → Iszen closing. If each member records separately, any order works; just follow each section's start state.

## Handoff map

Each clip ends by naming the next person. The next clip starts with “Thanks, [name].” The editor cuts between those two lines.

| Clip ends with | Next clip starts with |
|---|---|
| Iszen: “Klein will start with the admin dashboard.” | Klein: “Thanks, Iszen. I’m Klein…” |
| Klein: “Emman will show the player side.” | Emman: “Thanks, Klein. I’m Emman…” |
| Emman: “JD will show the database behind the save.” | JD: “Thanks, Emman. I’m JD…” |
| JD: “Klein will show the security.” | Klein: “Thanks, JD. I’m back as the demo player…” |
| Klein: “JD will show the cloud deployment.” | JD: “Thanks, Klein. This is Render…” |
| JD: “Ardion will play a round and show the visual design.” | Ardion: “Thanks, JD. I’m Ardion…” |
| Ardion: “Iszen will close.” | Iszen: “Thank you, Ardion…” |

## Seven rules that prevent dead air

1. **Talk while you click.** Say what you are doing before the page loads, not after.
2. **Never click in silence.** If a page is slow, say: “The free instance is waking up; this takes a few seconds.”
3. **Leave three seconds of silence** at the start and end of every clip. The editor needs room to cut.
4. **One browser window**, about 1440×900, zoom at 100%, bookmarks bar hidden, DevTools closed.
5. **Camera on**, small bubble in a corner, light in front of you. Look at the camera for your first and last line; look at the screen while clicking.
6. **Do not change the demo passwords** and **never press Restart progress on `demo_player`**. It wipes the save Emman and Ardion need.
7. **If you make a mistake,** pause two seconds, say “Let me try that again,” and redo the step. The editor can cut it. If it is a large mistake, stop and restart the clip.

# Before you record

## Zoom setup (everyone)

1. Open Zoom → sign in → **Home** → **New Meeting**. Make sure **Start video** is on.
2. Click **Join with Computer Audio**.
3. Click **Share Screen** → choose your browser window (not **Desktop**) → **Share**.
   Your personal files and other apps stay private.
4. Open **Settings → Recording**.
   Turn on **Record video during screen sharing**. Leave **Place video next to the shared screen** off, so the app stays full size and your camera sits in a corner.
5. Click **Record** → **Record to this Computer**. Cloud recording needs a paid plan; local recording is fine.
6. Wait three seconds after the red dot before speaking.
7. When you finish: **Stop Recording** → wait for Zoom to convert → **Stop Share** → **End Meeting**.
8. Rename the file from `zoom_0.mp4` to the clip name from the Master plan, for example `02_Klein_Admin.mp4`.

::: tip
**Test once before the real take.** Record 20 seconds, stop, and play it back with headphones. Check that your face is visible, the camera bubble does not cover any button, and the audio is clear. On macOS, allow Zoom in **System Settings → Privacy & Security → Screen & System Audio Recording**, **Microphone** and **Camera**, then restart Zoom.
:::

## Data state before anyone records

::: checks
☐ The live site is awake: open `https://beedashdiner.onrender.com` ten minutes early.

☐ `demo_admin` / `JolliDemo123!` works and shows the **Admin** link.

☐ `demo_player` / `JolliDemo123!` works, has a saved level and honey, and shows **no** Admin link.

☐ No account named `demo_crud` exists. If it does, log in as admin and delete it before recording.

☐ The Supabase project and the Render dashboard are already logged in for JD and Klein.

☐ Notifications are off: quit Messages, Mail and Slack; turn on Do Not Disturb; silence your phone.

☐ The browser has one tab for the app, no bookmarks bar, no DevTools, and 100% zoom.
:::

# Iszen — Introduction

<div class="assign">
<strong>Recorded by:</strong> Iszen Paul Masculino Ventura · <strong>Clip:</strong> 01_Iszen_Intro.mp4 · <strong>Target:</strong> 0:00–1:00 · <strong>Start:</strong> logged out on the landing page.
</div>

### 1. Open on the landing page
**SHOW** `https://beedashdiner.onrender.com` — the hero and the top navigation.

**SAY**
> “Hi, we’re Group AQM, and this is BeeDashDiner — a cloud-based bee café game. You run three restaurants, serve guests with automatic bees, and complete ten levels.”

### 2. Point at the navigation
**DO** Move the cursor across **How to play**, **Log in** and **Create account**.

**SAY**
> “The shared navigation appears on the main pages. As a guest, I can read the rules, log in or create an account. After login, it changes to Home, Game, How to play, my profile and Log out, and admins also get an Admin link.”

### 3. Point at the landing details
**SHOW** The three stats: 3 restaurants, 10 levels, automatic bees.

**SAY**
> “The front end is HTML, CSS, JavaScript and Bootstrap. The back end is PHP with PDO. The database is PostgreSQL on Supabase, and the app is deployed with Docker on Render.”

**SAY**
> “Our team covered backend, database, game mechanics, design and QA.”

### 4. Open the login page
**DO** Click **Play now**.

**SAY**
> “The login page also supports Google sign-in.”

**SAY**
> “Klein will start with the admin dashboard.”

**STOP RECORDING.** Leave three seconds of silence after the last line.

# Klein — Admin dashboard

<div class="assign">
<strong>Recorded by:</strong> Klein Rhee Pagulong Sioson · <strong>Clip:</strong> 02_Klein_Admin.mp4 · <strong>Target:</strong> 1:00–3:30 · <strong>Start:</strong> login page, logged out.
</div>

### 1. Sign in as the admin
**DO** Type `demo_admin` and `JolliDemo123!`, then click **Log In**.

**SAY**
> “Thanks, Iszen. I’m Klein, and I’ll show the admin side. BeeDashDiner has two roles: admin and player. I’ll sign in as the demo admin.”

### 2. Show the role-aware navigation
**SHOW** The main menu and the top bar.

**SAY**
> “After login, the navigation is role-aware. As an admin, I can see the Admin link. A player does not get this link at all.”

### 3. Open the dashboard
**DO** Click **Admin**.

**SAY**
> “This is the dashboard. The three cards are live counts from the database: accounts, admins and saved games.”

**SAY**
> “The table below joins the users table with player_progress, so the Progress column shows each player’s level and honey.”

### 4. Search for the demo player
**DO** Type `demo_player` in **Search username or email**, click **Search**, and point at the **Progress** column, which shows the level and honey.

**SAY**
> “Search uses a prepared statement, so the input cannot break the SQL.”

**DO** Click **Clear**.

### 5. Create a temporary account
**DO** Fill in the create form:

- Username: `demo_crud`
- Email: `demo_crud@example.com`
- Password: `DemoCrud123!`
- Role: `player`

Click **Add**.

**SAY**
> “I’ll create a temporary account to show the full CRUD flow. The password is hashed before it is stored. The app never saves the plain text.”

### 6. Find the new account
**DO** Search `demo_crud`, click **Search**, then click **Edit**.

**SAY**
> “Here is the new account. I’ll edit its email.”

### 7. Update the email
**DO** Change the email to `demo_crud_updated@example.com`, click **Save**.

**SAY**
> “Saved. That update was a POST request with a CSRF token.”

### 8. Reset the password
**DO** In **New password**, type `DemoCrud456!`, click **Reset password**.

**SAY**
> “Admins can reset a password without knowing the old one. That is the recovery path.”

### 9. Reset the progress
**DO** Click **Reset progress**, then **OK** on the confirmation. The edit panel closes.

**SAY**
> “Reset progress deletes only that player’s save rows. The account stays.”

### 10. Delete the account
**DO** Click **Edit** on `demo_crud` again, click **Delete user**, then **OK**.

**SAY**
> “Delete removes the account and its progress. The audit log keeps a record of it.”

**DO** Click **Clear** so the list is unfiltered again.

### 11. Show the audit log
**DO** Scroll to **Recent admin actions**. Point at the newest rows: delete, reset progress, password, update, create.

**SAY**
> “Recent admin actions shows who did what, to which account, and when. It stores the username as a snapshot, so the log still makes sense after the account is deleted.”

**SAY**
> “Every admin action checks the role on the server, uses prepared statements and carries a CSRF token. That’s the admin dashboard. Emman will show the player side.”

**STOP RECORDING.** Leave three seconds of silence.

::: warn
**Never reset `demo_player`.** Reset progress only on `demo_crud`. If you reset the demo player, Emman’s saved-game segment and Ardion’s round lose their progress.
:::

# Emman — Player walkthrough

<div class="assign">
<strong>Recorded by:</strong> Emman Glen Mendoza Wong Yan · <strong>Clip:</strong> 03_Emman_Player.mp4 · <strong>Target:</strong> 3:30–6:00 · <strong>Start:</strong> main menu, logged in as `demo_player`.
</div>

### 1. Start on the main menu
**SHOW** The BeeDashDiner menu, saved level and honey.

**SAY**
> “Thanks, Klein. I’m Emman, and I’ll show the player experience. I’m signed in as the demo player, so there’s no Admin link.”

**SAY**
> “The menu shows my saved level and honey. Play Game continues my save. Restart progress is the only way to start over.”

### 2. Enter the café
**DO** Click **Play Game**.

**SAY**
> “This is the café. Guests come through the lower-left door, the bees cook and serve automatically, and the HUD shows honey, diamonds and queue seats.”

### 3. Open a food stall
**DO** Click one food stall. Point at the recipe pips, worker slots, price, cook time and milestones.

**SAY**
> “Each stall has recipe levels, worker slots, price, cook time and milestones. Milestones at two, six and ten add workers; four and eight double the profit.”

**DO** Close the stall.

### 4. Show the three dock menus
**DO** Click **Mission**, point at the three goals and the reward, then close.

**SAY**
> “The Mission panel shows the three goals for this level and the reward.”

**DO** Click **Upgrades**, point at **Hive bees** and the global upgrades, then close.

**SAY**
> “Upgrades is where I hire more hive bees and buy restaurant-wide improvements.”

**DO** Click **Shop**, point at the cosmetic items, then close.

**SAY**
> “The Shop uses diamonds for cosmetic accessories.”

### 5. Serve a guest
**DO** Let a guest reach a stall and wait for the bee to serve them. Point at the tip pop and the honey count.

**SAY**
> “When a guest is served, the tip pops up and the honey count goes up. The bees handle the cooking and serving on their own.”

**TIP** If the guest is still walking, keep talking: “The guest is walking to the stall now; the bee will take the order when they arrive.” Do not wait in silence.

### 6. Change the audio
**DO** Click the speaker button. Move the **Sound effects** and **Music** sliders. Close the panel.

**SAY**
> “The speaker button separates sound effects and music, so a player can keep the music low or turn it off.”

### 7. Save and come back
**DO** Wait for the save indicator, click **Exit**, then click **Play Game** again.

**SAY**
> “Exit saves and returns to the menu. When I come back, the welcome toast and my saved honey are still there.”

**DO** Refresh the page, then open **Play Game** again.

**SAY**
> “The save is on the server, so a refresh does not lose progress.”

### 8. Show the profile
**DO** Go back to the menu and click my avatar or username in the navigation. Point at the saved level and honey, and the password form.

**SAY**
> “My profile shows my avatar, saved level and honey, and the password form.”

**OPTIONAL:** Upload a spare picture and refresh to show the avatar in the nav.

**DO** Go back to the menu.

### 9. Show the phone layout
**DO** Narrow the browser window to phone width, or cut to the phone recording if you have one.

**SAY**
> “The layout also works at phone width. The navigation collapses and the game fits without horizontal scrolling.”

**SAY**
> “JD will show the database behind the save.”

**STOP RECORDING.** Leave three seconds of silence.

::: warn
**Do not press Restart progress.** It replaces the demo player’s save. If you want to show the confirmation dialog, open it and click **Cancel**.
:::

# JD — Database

<div class="assign">
<strong>Recorded by:</strong> John David Pascua Morandante (JD) · <strong>Clip:</strong> 04_JD_Database.mp4 · <strong>Target:</strong> 6:00–7:00 · <strong>Start:</strong> Supabase, table editor, logged in.
</div>

### 1. Open on the table editor
**SHOW** The Supabase project → **Table editor**.

**SAY**
> “Thanks, Emman. I’m JD, and I’ll show the database. The app uses PostgreSQL on Supabase.”

### 2. Show the tables
**DO** Open `users`, `player_progress`, `player_stations`, `admin_audit`, `locations` and `menu_items`. Point at the foreign keys.

**SAY**
> “These are the main tables. Users holds the accounts and roles. Player progress holds level, honey and location. Player stations holds each station’s recipe and workers. Admin audit is the append-only log.”

**SAY**
> “Player progress, player stations and admin audit reference users by id. The foreign keys keep the rows consistent.”

### 3. Run the admin join
**DO** Open the **SQL editor** and run:

```sql
SELECT u.id, u.username, u.role, p.level, p.honey
FROM users u
LEFT JOIN player_progress p ON p.user_id = u.id
ORDER BY u.id;
```

**SAY**
> “This is the same join the admin dashboard uses. It lists every account, its role, and its saved level and honey.”

### 4. Show a live write (optional, if time allows)
**DO** In the app, serve one guest or buy one upgrade, then refresh `player_progress`.

**SAY**
> “When a player serves a guest, the game saves the new honey here. The database is the source of truth, not the browser.”

**SAY**
> “Klein will show the security.”

**STOP RECORDING.** Leave three seconds of silence.

::: tip
If the SQL editor is slow, say: “The query is running against the live database.” Do not sit in silence.
:::

# Klein — Security

<div class="assign">
<strong>Recorded by:</strong> Klein Rhee Pagulong Sioson · <strong>Clip:</strong> 05_Klein_Security.mp4 · <strong>Target:</strong> 7:00–8:00 · <strong>Start:</strong> main menu, logged in as `demo_player`.
</div>

### 1. Switch to the player account
**DO** Before recording: log out of `demo_admin`, then log in as `demo_player` and open the main menu.

### 2. Start as the player
**SHOW** The main menu and the navigation.

**SAY**
> “Thanks, JD. I’m back as the demo player. Notice there is no Admin link.”

### 3. Open the admin page directly
**DO** Type `https://beedashdiner.onrender.com/admin.php` in the address bar and press Enter.

**SAY**
> “But hiding the link is not the security. The server checks my role before it loads any admin data, so I get a 403 Access denied page. It even shows my actual role: player.”

### 4. Show source protection
**DO** Open `https://beedashdiner.onrender.com/src/Auth.php`.

**SAY**
> “Direct requests into the source folder are refused by the web server, so the PHP source is never served.”

### 5. Show HTTPS
**DO** Go back to the site. Click the site information icon at the left of the address bar.

**SAY**
> “The live site runs over HTTPS, and the session cookie is marked Secure, HttpOnly and SameSite Lax.”

### 6. Show the password hash (only if you have Supabase access)
**DO** Switch to Supabase → **Table editor → users**. Point at the `password` column.

**SAY**
> “Passwords are stored as bcrypt hashes, and the app verifies them with password_verify. The plain password is never stored.”

If you do not have Supabase access, skip this step and say: “As JD showed, passwords are stored as bcrypt hashes.”

### 7. Close the segment
**SAY**
> “Forms use CSRF tokens, and the save API rejects a request without the token. That’s the security part. JD will show the cloud deployment.”

**STOP RECORDING.** Leave three seconds of silence.

# JD — Cloud deployment

<div class="assign">
<strong>Recorded by:</strong> John David Pascua Morandante (JD) · <strong>Clip:</strong> 06_JD_Cloud.mp4 · <strong>Target:</strong> 8:00–9:00 · <strong>Start:</strong> Render dashboard, service page.
</div>

### 1. Open the Render service
**SHOW** The Render dashboard → the **beedashdiner** service.

**SAY**
> “Thanks, Klein. This is Render, where the app is deployed.”

### 2. Show the live status
**DO** Point at **Live** and the public URL.

**SAY**
> “The service is live at beedashdiner.onrender.com over HTTPS.”

### 3. Explain the container
**DO** Open the service’s Docker or environment details if they are visible.

**SAY**
> “The app runs in a Docker image with PHP 8.2 and Apache. The image installs the PDO PostgreSQL driver, reads DATABASE_URL from the environment, and the entrypoint listens on Render’s port.”

**SAY**
> “The database stays on Supabase, so redeploying the app does not touch the saves.”

### 4. Close the segment
**SAY**
> “Ardion will play a round and show the visual design.”

**STOP RECORDING.** Leave three seconds of silence.

::: tip
If Render shows a deploy in progress, say: “A redeploy is running; the live URL stays the same.” Do not refresh repeatedly in silence.
:::

# Ardion — Game round and visual design

<div class="assign">
<strong>Recorded by:</strong> Ardion Nicolas Dela Cruz Tamagos · <strong>Clip:</strong> 07_Ardion_Game.mp4 · <strong>Target:</strong> 9:00–10:00 · <strong>Start:</strong> main menu, logged in as `demo_player`.
</div>

### 1. Start on the main menu
**SAY**
> “Thanks, JD. I’m Ardion, and I’ll play a short round and point out the visual design.”

### 2. Show the rules
**DO** Click **How to play**. Point at **Your goal**, **Controls** and **Winning and restarting**.

**SAY**
> “The goal is to finish the three missions on each level and reach Level 10 at the Royal Hive. There is no lose state; guests just keep coming.”

**DO** Go back to the menu.

### 3. Play a short round
**DO** Click **Play Game**. Let a few guests be served. Point at the HUD, the mission dot and the door.

**SAY**
> “The scene is the main interface: the stalls, the hive, the door, the dock and the HUD. Honey and diamonds are visible at all times, and the mission dot tells me when a goal is ready.”

### 4. Point out the design
**DO** Point at the restaurant palette, the stalls, the guests and the bee workers.

**SAY**
> “Each restaurant has its own palette. Meadow Stand is green and warm, Hive Café is golden, and Royal Hive is purple and formal.”

**SAY**
> “The layout is responsive; it works on a phone and on a desktop.”

### 5. Close the segment
**SAY**
> “Iszen will close.”

**STOP RECORDING.** Leave three seconds of silence.

::: warn
**Do not press Restart progress.** If you want to show it, use a spare account. The demo player’s save is needed for the rest of the video.
:::

# Iszen — Closing

<div class="assign">
<strong>Recorded by:</strong> Iszen Paul Masculino Ventura · <strong>Clip:</strong> 08_Iszen_Closing.mp4 · <strong>Target:</strong> 10:00–11:00 · <strong>Start:</strong> main menu or café, calm screen.
</div>

### 1. Summarize the system
**SAY**
> “Thank you, Ardion. To summarize: BeeDashDiner combines a playable JavaScript game, secure authentication, role-based CRUD and a cloud PostgreSQL database in one system.”

### 2. Name the hard parts
**SAY**
> “The hardest parts were reliable saving, calm customer pacing, audio autoplay rules and deployment.”

### 3. Name the next improvements
**SAY**
> “Next we would move avatar uploads to Supabase Storage, add login rate limiting, and use shared session storage for multiple app instances.”

### 4. Close
**SAY**
> “Thank you for watching. We’re Group AQM.”

**STOP RECORDING.** Leave three seconds of silence.

# Editor assembly

## Cut order

Use the handoff lines as the cut points. Each clip ends by naming the next person; the next clip starts with “Thanks, [name].” Cut 0.3 seconds after the handoff and 0.3 seconds before the “Thanks.”

| Order | Clip | Target start | Lower-third |
|---|---|---|---|
| 1 | `01_Iszen_Intro.mp4` | 0:00 | Iszen · Introduction |
| 2 | `02_Klein_Admin.mp4` | 1:00 | Klein · Admin dashboard |
| 3 | `03_Emman_Player.mp4` | 3:30 | Emman · Player experience |
| 4 | `04_JD_Database.mp4` | 6:00 | JD · Database |
| 5 | `05_Klein_Security.mp4` | 7:00 | Klein · Security |
| 6 | `06_JD_Cloud.mp4` | 8:00 | JD · Cloud deployment |
| 7 | `07_Ardion_Game.mp4` | 9:00 | Ardion · Game round and design |
| 8 | `08_Iszen_Closing.mp4` | 10:00 | Iszen · Closing |

## Edit recipe

1. Add a 3-second title card at 0:00: **BeeDashDiner — Group AQM**.
2. Trim the first and last silence of each clip, but keep about 0.5 seconds on each side.
3. Normalize every clip to the same loudness. Aim for about **−16 LUFS**; voices should never clip.
4. Add a small lower-third at the start of each segment using the table above.
5. Keep the screen recording full size. Do not zoom in so far that the browser controls disappear.
6. Export: **1920×1080, 30 fps, H.264, AAC 192 kbps, MP4**. Keep the file under 2 GB for Google Drive.
7. Watch the final cut once from start to finish before uploading.

## Files you should receive

| Clip | Member | Length | Received |
|---|---|---|---|
| `01_Iszen_Intro.mp4` | Iszen | ~1:00 | ☐ |
| `02_Klein_Admin.mp4` | Klein | ~2:30 | ☐ |
| `03_Emman_Player.mp4` | Emman | ~2:30 | ☐ |
| `04_JD_Database.mp4` | JD | ~1:00 | ☐ |
| `05_Klein_Security.mp4` | Klein | ~1:00 | ☐ |
| `06_JD_Cloud.mp4` | JD | ~1:00 | ☐ |
| `07_Ardion_Game.mp4` | Ardion | ~1:00 | ☐ |
| `08_Iszen_Closing.mp4` | Iszen | ~1:00 | ☐ |

## Final quality check {.page-break-before}

::: checks
☐ All five members appear or speak.

☐ Every handoff line is present; no segment starts cold.

☐ No dead air longer than two seconds.

☐ No notifications, personal tabs, bookmarks or DevTools on screen.

☐ The live URL is correct and the demo accounts work.

☐ Audio is clear, balanced and in sync.

☐ The video is 10–12 minutes and plays to the end.
:::

## Submit

::: submit-table
| # | Step |
|---|---|
| 1 | Name the final file `AQM_BeeDashDiner_Demo.mp4`. |
| 2 | Upload it to the professor’s Drive folder → `05_Demo_Video/`. |
| 3 | Delete `PUT_VIDEO_HERE.txt` and `VIDEO_SCRIPT.md` from that folder. |
| 4 | Update the video section of `00_SUBMISSION_INFO.txt` to the text below. |
| 5 | Keep the raw clips in the group’s own folder until the grade is released. |
| 6 | After grading, change the demo passwords or remove the demo accounts.
:::

```text
05_Demo_Video/AQM_BeeDashDiner_Demo.mp4
  Full 10–12 minute demonstration video.
```

# Quick reference

## Links and accounts

| Item | Value |
|---|---|
| Live site | `https://beedashdiner.onrender.com` |
| Login / admin | `/login.php` · `/admin.php` |
| Admin account | `demo_admin` / `JolliDemo123!` |
| Player account | `demo_player` / `JolliDemo123!` |
| Temporary account | `demo_crud` / `demo_crud@example.com` / `DemoCrud123!` |
| Reset password | `DemoCrud456!` |
| Source deny demo | `/src/Auth.php` |

::: never-do
• Never press **Restart progress** on `demo_player`.

• Never change the demo account passwords before grading.

• Never show the Supabase password column as plain text; show the bcrypt hash only.

• Never share the whole desktop; share only the browser window.

• Never leave a clip without the handoff line at the end.

• Never upload raw clips to the professor’s folder; only the final edited MP4 goes there.
:::

## If something goes wrong

| Problem | Fix |
|---|---|
| Render is asleep | Open the site ten minutes early; say “the free instance is waking up” if it is slow. |
| The site will not load | Wait two to three minutes; a free Render instance can restart. If it stays down, JD should check the Render dashboard. |
| `demo_crud` already exists | Log in as admin, search `demo_crud`, delete it, then record. |
| A guest is slow to arrive | Talk about the station or the HUD while you wait; do not wait in silence. |
| Wrong account on screen | Stop, log out, log in with the correct account, restart the clip. |
| Zoom records a black screen | Allow Zoom in macOS **Screen & System Audio Recording**, then restart Zoom. |
