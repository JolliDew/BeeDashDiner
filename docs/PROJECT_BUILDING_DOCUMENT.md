---
title: "BeeDashDiner — Project Building Document"
subtitle: "CC106 — Cloud-Based Application Development"
author:
  - "Group AQM · University of St. La Salle"
  - "BS Computer Science · 3rd Year, 1st Semester"
  - "La Salle Avenue, Bacolod City 6100, Negros Occidental, Philippines · +63 34 434 6100"
  - "Instructor: Japhet Rocamora Pagarigan"
date: "November 2026"
---

# 1. Cover and team

**Project title:** BeeDashDiner\
**Group:** AQM\
**Assigned system:** A cloud-based bee café game with an admin dashboard\
**Course:** CC106 — Cloud-Based Application Development\
**Project type:** Culminating Learning Evidence (CLE) — end-term final project\
**Program:** Bachelor of Science in Computer Science\
**Year and term:** 3rd Year, 1st Semester\
**Instructor:** Japhet Rocamora Pagarigan\
**Institution:** University of St. La Salle, La Salle Avenue, Bacolod City 6100, Negros Occidental, Philippines\
**Telephone:** +63 34 434 6100\
**Repository:** https://github.com/JolliDew/BeeDashDiner\
**Public URL:** https://beedashdiner.onrender.com

| Member | Main role | Approx. contribution |
|---|---|---|
| Klein Rhee Pagulong Sioson | Backend, sound engineering, game logic, integration | 20% |
| John David Pascua Morandante | Backend, database, Google Cloud, GitHub repository owner | 20% |
| Emman Glen Mendoza Wong Yan | Game mechanics, documentation, design, QA | 20% |
| Ardion Nicolas Dela Cruz Tamagos | Design, frontend, art, QA | 20% |
| Iszen Paul Masculino Ventura | Group leader, ideas, documentation, QA | 20% |


![BeeDashDiner public landing page](docs/screenshots/landing-desktop.png){width=82%}

# 2. SWOT analysis

The Week 1 deliverable compared two reference games from **NEPTUNE (TREEPLLA)**:
*Cat Snack Bar: Cute Food Games* (2022) and *Cat Mafia: Idle Tycoon Games*
(2026). Both are mobile idle-management games; BeeDashDiner is a browser game,
so the comparison focuses on design, pacing and market position rather than
platform parity. The goal was to decide what BeeDashDiner should imitate, avoid,
exploit and defend against.

| Area | Cat Snack Bar | Cat Mafia |
|---|---|---|
| **Strengths** | Polished, unified pastel art and smooth animation; frictionless onboarding with no tutorial; ten long levels, event maps, gear and offline rewards that retain players. | A distinctive parody identity that mixes cozy cat art with a mob theme; accessible but lightly strategic crew, hideout and territory management; rewarding offline progression that respects casual play. |
| **Weaknesses** | Exponential upgrade costs create artificial late-game walls that require days of idle waiting; later progress depends on paying or watching ads; monthly passes and limited events create FOMO. | Progression slows into long idle time-walls; aggressive microtransactions and ads bypass the grind; the loop recycles the standard idle-tycoon formula used in the developer's other games. |
| **Opportunities** | Expand the cat universe into other genres or merchandise; add guilds, leaderboards or friend visits to reduce the isolation of the idle genre. | Add gang-versus-gang PvP, leaderboards or cooperative syndicates; run seasonal events with new bosses, territories and themed gear. |
| **Threats** | The mobile market is saturated with idle-management clones such as *Lumber Empire* and *Eatventure*; players burn out when the later loop adds no new mechanical depth. | The market is crowded with clones, and the game also competes with the developer's own portfolio; players churn when progress becomes only numerical grinding. |

## 2.1 Decisions that followed the SWOT

1. **Compete on polish and identity, not scale.** BeeDashDiner uses a cohesive bee-café identity: three distinct restaurant maps, striped-awning stalls, a persistent menu sign and procedural audio built from CSS, emoji and Web Audio rather than a large art budget.
2. **Avoid the late-game wall.** The game has ten levels with three missions each. Recipe milestones at 2, 6 and 10 open worker slots, milestones at 4 and 8 double a station's profit, and the next goal is always visible; there are no days-long idle gates.
3. **No pay-to-win, ads, passes or FOMO.** Every station, recipe, cosmetic and level is earned with honey, diamonds or mission progress. There are no purchases, ad boosts or limited-time exclusive items.
4. **Respect the player's time.** Progress saves automatically, on Exit and when the page is hidden; a local backup covers a failed request. The game has no lose state, and Restart progress replaces only the player's own save.
5. **Make onboarding frictionless.** The landing page, How to Play page and in-game mission panel explain the goal and controls without a forced tutorial. The HUD keeps honey, diamonds, seats and the next mission visible.
6. **Differentiate, but keep the scope finishable.** The bee café, three-map progression, mission structure, procedural audio and complete admin/cloud stack distinguish the project from a generic idle clone. Multiplayer, PvP, leaderboards, merchandise and seasonal events were deliberately left out of this version.

# 3. Requirements and scope

## 3.1 Problem and users

BeeDashDiner is a small idle restaurant game. A player runs a bee café: guests
arrive automatically, bees cook and serve, and honey buys upgrades. The site
also has a full administrator area for account management.

| Role | Capabilities |
|---|---|
| Guest | Register, log in, read the rules. Cannot enter the game or admin area. |
| Player | Play the game, save progress, view profile, upload an avatar, change password, restart their own progress. |
| Administrator | All player capabilities plus user CRUD, role changes, password resets, progress resets, account deletion and the audit log. |

### Entry flow

A visitor first sees a public landing page with the game preview, three-map
gallery, rules summary and clear **Play now / Create account** actions. The
shared navigation is present from that first page. After login, the player lands
on the main menu; **Exit** returns there, and **Log out** returns to the landing
page. Local XAMPP `/JolliDew/` redirects to the landing page, while Render serves
it at `/`.

![Main menu](docs/screenshots/menu-desktop.png){width=78%}

## 3.2 Feature list

- Registration, login by username or email, logout, CSRF protection.
- Server-side validation and hashed passwords.
- Role-based navigation and access-denied page.
- Player profile: account summary, saved level/honey, avatar upload and password change.
- Admin dashboard: search, pagination, create, edit, delete, role changes, password reset, progress reset and audit history.
- Playable JavaScript game: 10 levels, three restaurants, automatic bees, station upgrades, global upgrades, missions, cosmetics, queue seats.
- Clear scoring (honey, diamonds, level, mission progress), a win condition at Level 10, and a restart option.
- Procedural sound effects and ambient music with separate volume controls.
- Responsive menu, auth pages, game HUD, dock and modals from 320px phones to desktop.
- Automatic save/resume, including save-on-close and a local backup fallback.

## 3.3 Game concept

The restaurant starts at **Meadow Stand** with one bee and four chairs. Guests
arrive through the lower-left door, sit, order, and wait. The bee takes the
order, cooks at the correct station, serves the guest, and returns. Tips and
mission rewards buy more staff, recipes and restaurant-wide upgrades. After all
three missions on a level, the player advances; after Level 10 the game is won.

# 4. System design

## 4.1 Entity–relationship diagram

![ER diagram](docs/screenshots/er-diagram.png){width=78%}

The schema has six related tables. `player_progress` and `player_stations` have
a foreign key to `users` with `ON DELETE CASCADE`; `menu_items` references
`locations`. `admin_audit` deliberately has no foreign key: it stores the
actor and target ids together with a snapshot of the usernames, so the
append-only log survives the deletion of the account it describes. The admin dashboard uses this join: `SELECT u.id, u.username, u.role, p.level, p.honey FROM users u LEFT JOIN player_progress p ON p.user_id = u.id ORDER BY u.id;`

## 4.2 Role access matrix

| Page or feature | Guest | Player | Admin |
|---|---|---|---|
| Login / register | Yes | No (redirected to game) | No |
| Help / rules | Yes | Yes | Yes |
| Play game / save API | No | Yes | Yes |
| Profile / own avatar | No | Yes, own only | Yes, own only |
| Restart own progress | No | Yes, own only | Yes, own only |
| Admin dashboard / user CRUD / audit | No | No — 403 access-denied page | Yes |
| Developer tools (🛠) | No | No | Yes |
| Delete another account | No | No | Yes |

## 4.3 Page flow

![Page flow](docs/screenshots/page-flow.png){width=92%}

## 4.4 Folder structure

```text
JolliDew/
├── Dockerfile                 # Render/PHP-Apache container
├── render.yaml                # Optional Render Blueprint
├── database.sql               # PostgreSQL schema + demo accounts
├── gamefile/
│   ├── index.php               # public landing page (Home)
│   ├── Mainmenu.php / .js      # menu, progress and game launcher
│   ├── in-game.php             # game markup injected by Mainmenu.js
│   ├── api.php                 # save/load JSON endpoint
│   ├── includes/nav.php        # shared role-aware navigation
│   ├── css/                    # game, modal, nav and page styles
│   ├── js/                     # game modules, audio engine, save service
│   ├── src/                    # Auth, CSRF, repositories, API controller
│   ├── uploads/                # user avatars (non-executable)
│   ├── admin.php               # admin dashboard and user CRUD
│   ├── profile.php             # profile, avatar, password
│   ├── help.php                # rules, controls, win condition
│   ├── denied.php              # 403 page
│   ├── restart.php             # start over (fresh save, old save invalidated)
│   ├── login.php / register.php / logout.php / google-login.php
│   └── login_db.sql, login_db_pg.sql, upgrade_db.sql  # schema variants
├── tests/                     # JS + PHP test suites
└── docs/                      # guides, deployment, this document
```

## 4.5 Restaurant maps

Each location has its own visual identity while keeping the same game rules and
the lower-left guest door:

- **Meadow Stand** is an outdoor market: sky wall, bunting, sun, clouds, green
  picnic floor and a farm-style menu sign.
- **Hive Café** is a warm indoor café: peach tiled walls, pendant lamps, jar
  shelf, café window, woven rug and a chalkboard-style menu.
- **Royal Hive** is a regal hall: plum-and-gold walls, velvet curtains,
  chandelier, crown crest, marble floor, red carpet and a royal menu.

The menu sign is anchored to the stall row rather than to a fixed percentage of
the kitchen. This guarantees an 8px gap above the awnings on phone and desktop
and a 3–4px gap in short landscape mode, so it can never be covered by a stall
or drift far away from them.

![The three restaurant maps: Meadow Stand, Hive Café and Royal Hive](docs/screenshots/maps-composite.png){width=100%}

# 5. Development log

The table follows the five weekly delivery periods. Week 1 began on
26 October 2026; the individual commits remain available with
`git log --date=short`.

| Week | Stage | Work completed | Owner | Evidence |
|:--------------------|:-----------|:-----------------------------------|:----------|:-------------------|
| Week 1 (Oct 26–30) | 1. Reference SWOT | Compared Cat Snack Bar and Cat Mafia, completed the comparative SWOT, requirements and game concept, and agreed the scope. | Klein, Iszen | Comparative SWOT in this section. |
| Week 1 (Oct 26–30) | 2. Design and repository | Created the GitHub repository and base HTML/CSS/Bootstrap pages; finalized the game design document and main-menu layout. | Ardion, JD | Repository; menu and auth screens. |
| Week 1 (Oct 26–30) | 3. Core game loop | Built the first timer and customer-queue loop, seats and station scene skeleton. | Emman | Early playable loop. |
| Week 2 (Nov 2–6) | 4. Setup and authentication | Consolidated the XAMPP copy, protected `.git` and credentials, added login/register with sessions and CSRF. | JD, Klein | Login returned 200; `.git` returned 404. |
| Week 2 (Nov 2–6) | 5. Database and save API | Designed the schema, PDO save/load API and server-side validation; added local XAMPP testing for every member. | JD, Klein | Save/load round-trip; PHP tests. |
| Week 2 (Nov 2–6) | 6. Gameplay core | Ten-level progression, automatic workers, global staff, save v3 and PostgreSQL/Supabase support beside MySQL. | Klein, JD | `npm test`; live Supabase round-trip. |
| Week 3 (Nov 9–13) | 7. Locations and workers | Finalized Meadow Stand, Hive Café and Royal Hive, station unlocks and worker assignments. | Emman | Three maps; worker AI tests. |
| Week 3 (Nov 9–13) | 8. Upgrade economy and admin | Implemented recipe/tip/queue/walk/cook/profit formulas and the admin CRUD with the audit log. | JD, Klein | Admin CRUD checks; economy tests. |
| Week 3 (Nov 9–13) | 9. Visual assets | Replaced placeholder emoji stations with food stalls, café door, kitchen wall, shelf, lamps, rug and plants. | Ardion | Game phone/desktop screenshots. |
| Week 4 (Nov 16–20) | 10. Scene-first UI | Grouped the HUD, widened the playfield, built the desktop dock, three distinct maps and the procedural audio engine. | Ardion, Klein | 320–1440 checks; audio panel; map screenshots. |
| Week 4 (Nov 16–20) | 11. Saving and restart | Serialized autosave, pagehide/visibility keepalive, local fallback, write-number ordering, server-first loading and restart replacement. | Klein | 14/14 browser checks; live PostgreSQL suite. |
| Week 4 (Nov 16–20) | 12. QA, dev tools and polish | Restricted developer tools to admins, fixed the admin page, aligned the profile form, polished the UI and corrected the documentation. | Klein, Emman, Ardion | 61 JavaScript tests; admin and profile checks. |
| Week 5 (Nov 23–26) | 13. Cloud deployment | Deployed the Docker/Apache app to Render, connected Supabase PostgreSQL and configured Google OAuth and environment variables. | JD, Klein | Live at https://beedashdiner.onrender.com. |
| Week 5 (Nov 23–26) | 14. Documentation and submission | Finalized the README, testing record, security/scalability proposal, reflections and project building document; prepared the Drive package. | Emman, Iszen | This document and `docs/`. |
| Week 5 (Nov 23–26) | 15. Demo video and presentation | Prepared the recording script and speaker split for the Week 5 gameplay demo and mock presentation. | All five | `docs/DEMO_SCRIPT.md`. |

## 5.1 Short code excerpts

The four pieces the guide asks for, quoted from the final code.

**Login** (`gamefile/login.php`) — one prepared query accepts either the
username or the email, and the session is regenerated only after the password
is verified:

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
        $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
    Auth::login($user);
    header("Location: Mainmenu.php");
    exit();
}
```

**Sessions** (`gamefile/src/Auth.php`) — the cookie is `HttpOnly`,
`SameSite=Lax` and `Secure` behind HTTPS (including Render's proxy), and the
session id changes on login:

```php
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'secure' => $secure,
    'httponly' => true, 'samesite' => 'Lax',
]);
session_start();

// Auth::login()
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['role'] = ($user['role'] ?? 'player') === 'admin' ? 'admin' : 'player';
```

**CRUD** (`gamefile/src/AdminRepository.php`) — every write is a prepared
statement, and only the `INSERT ... RETURNING` differs between the engines:

```php
$sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
$params = [$username, $email, password_hash($password, PASSWORD_DEFAULT), $role];
if ($this->isPostgres()) {
    $stmt = $this->pdo->prepare($sql . ' RETURNING id');
    $stmt->execute($params);
    return (int)$stmt->fetchColumn();
}
$this->pdo->prepare($sql)->execute($params);
return (int)$this->pdo->lastInsertId();
```

**Game** (`gamefile/js/Game.js`) — the frame step is capped so a slow frame
cannot jump the guests forward, the dev ×5/×20 mode repeats the update instead
of shrinking the step, and the panels refresh five times a second:

```js
loop(t) {
  if (!this.running) return;
  const dt = Math.min(.05, (t - this.last) / 1000);
  this.last = t;
  this.scene.quiet = this.timeScale > 1;
  for (let i = 0; i < this.timeScale; i++) this.scene.update(dt);
  this.scene.render();
  this.acc += dt;
  if (this.acc > .2) {
    this.acc = 0;
    this.tracker.check();
    this.scene.refreshStations();
    this.panel.refresh();
    this.refreshHud();
  }
  this.raf = requestAnimationFrame(x => this.loop(x));
}
```

![Game on a phone](docs/screenshots/game-phone.png){width=30%}
![Audio panel](docs/screenshots/audio-panel.png){width=30%}

## 5.2 Screenshots of key pages

The admin dashboard shows the live account list, the CRUD form and the audit
log. The profile page and the how-to-play page cover avatar upload, password
change and the rules. The landing page is in Section 1, the main menu in
Section 3, the three restaurant maps in Section 4, and the in-game HUD and
audio panel above.

![Admin dashboard with the account list, create form and audit log](docs/screenshots/admin-desktop.png){width=80%}

![Profile: avatar upload, password change and saved progress](docs/screenshots/profile-desktop.png){width=44%}
![How to play: rules, controls and the win condition](docs/screenshots/help-desktop.png){width=44%}

# 6. Testing record

## 6.1 Automated tests

`npm test` runs the JavaScript and PHP suites with no database required.

- **61 JavaScript tests** cover game state migration, economy, missions, worker
  selection, customer lifecycle, seat layout, cosmetics, save queueing and
  invalid saves.
- **PHP SaveRepository checks** cover v1/v2 migration, station chains, staff
  clamping, mission repair, write-number ordering and round-trips.
- **PHP AdminRepository checks** cover create/edit/search/pagination/password,
  progress reset, last-admin and self-delete guards, and audit snapshots.
- **A live PostgreSQL suite** (`npm run test:pg`) runs the same save checks
  against Supabase, including the rejection of an older save.
- **PHP lint** passes on every PHP file.
- **Headless Chrome/CDP** checks cover 320×568, 360×800, 568×320, 768×1024 and
  1440×900: no unintended horizontal overflow, modals one at a time, 1000px
  desktop playfield, audio context and sliders, save/resume, and console errors.
- **A headless end-to-end run through XAMPP** registers an account, crafts a
  save, plays, reloads, restarts and exits during the load; all 14 checks
  pass, including "the mission reward is paid exactly once" and "a save that
  is still on its way cannot undo the restart".

## 6.2 Manual test cases

| ID | Feature | Steps | Expected | Actual | Result |
|:----|:-----------|:------------------------|:------------------|:------------------|:------|
| T1 | Login | Enter valid player account | Main menu opens | Main menu + saved progress | Pass |
| T2 | Role block | Log in as player, open `admin.php` | Access denied | 403 denied page | Pass |
| T3 | Admin CRUD | Create, edit, reset password, delete a test user | Row changes + audit entry | All operations worked | Pass |
| T4 | Save/resume | Play, add honey, hide page, reload | Same honey/level returns | Honey increased by the exact amount | Pass |
| T5 | Door pacing | Start with 4 seats and watch | No crowd at the door | First guest after 1.8s, measured gap | Pass |
| T6 | Worker intro | Enter game | Worker leaves the hive | Bee started at hive and flew to station | Pass |
| T7 | Avatar upload | Upload PNG under 2 MB | Image appears in profile/nav | Uploaded and displayed | Pass |
| T8 | Invalid upload | Rename a text file as `.png` | Rejected, no file written | Server rejected it | Pass |
| T9 | Restart | Confirm restart from menu | Own save replaced by a fresh game | Level 1, 50 honey, one open station; a save still on its way cannot undo it | Pass |
| T10 | Audio | Open speaker, change sliders, reload | Volumes persist | 70/45 restored; music timer resumed | Pass |
| T11 | Mobile layout | 320×568 and 568×320 | No clipped UI | No horizontal overflow | Pass |
| T12 | Deployment | Open the Render URL, log in, play | App reachable over HTTPS | Live at https://beedashdiner.onrender.com; both demo roles verified | Pass |
| T13 | Maps and menu sign | Switch to levels 1, 5 and 8 at 360, 568×320 and 1440 | Distinct maps; sign always 3–8px above stalls; no overflow | 3/4/5 stations, correct decor, no overlap | Pass |
| T14 | Colour contrast | Open menu, help and profile; inspect gold buttons | Dark text on gold, readable labels | Button text corrected | Pass |
| T15 | Google account password | Simulate a Google-created account; try manual login, then set a local password in Profile and log in manually | Helpful message first; local login works after setting | Both stages passed | Pass |
| T16 | Landing and home flow | Visit `/JolliDew/`, use Play/Create account, log out | Landing loads, CTAs work, logout returns home | Root 302 to landing; landing 200; flow verified | Pass |
| T17 | Mission reward | Craft a save with one mission finished, press Play, then reload | The reward is paid once and reaches the server | Server showed index 1 and 200 honey; a reload kept 200 honey | Pass |
| T18 | Save ordering | Send two saves, the older one arriving late | The newer state is kept | The server answered 409 and kept the newer progress | Pass |
| T19 | Restart race | Exit the game, restart, then let the keepalive save arrive | The restart stays | Level 1 and 50 honey after the late save | Pass |
| T20 | Exit during load | Press Exit while the save is still loading | No game keeps running | The game markup was removed and the menu came back | Pass |
| T21 | Admin page render | Open `admin.php` as an admin | Summary, create form, account list and audit log all render | Full page rendered after the nav variable clash was fixed | Pass |
| T22 | API CSRF | POST a save without the `X-CSRF-Token` header | Rejected | `403 {"error":"csrf"}`; the game's own save still returns 200 | Pass |

## 6.3 Bugs found and fixed

- The main-menu title was clipped because gradient text was painted outside its
  box. Fixed with responsive `clamp()` sizing and wrapping.
- Auth pages used `overflow:hidden`, hiding the register button on short screens.
- The first bee was pushed off the left edge by a percentage offset that was not
  scaled to the station width.
- Saves could overlap and report stale status; saves are now serialized and
  dirty-checked.
- Closing the tab could lose the last few seconds of play; pagehide now sends a
  keepalive save.
- Customers arrived in a burst at one door pixel; arrivals are now staggered.
- Two modals could stack if opened programmatically; Bootstrap’s jQuery
  `show.bs.modal` now closes any other dialog.

The final audit round found six more defects, all confirmed by reproducing
them before fixing them:

- **A mission reward could be paid again on every reload.** The game took its
  "already saved" baseline *after* the opening change, so the reward paid while
  loading was never pushed and was paid again next time. The baseline is now
  taken before the first change.
- **A late save could undo a newer one.** Every save now carries a write
  number that only grows; the server keeps the newest number and answers
  `409` instead of overwriting it.
- **"Restart progress" could be undone by the keepalive from Exit.** The restart
  now replaces the save with a fresh game whose write number is far ahead, so
  a save that is still on its way is too old to be stored.
- **The upgrade shop promised less than the game delivered.** The walking and
  cooking upgrades shorten the time rather than adding a percentage of speed.
  Both the shop text and the simulation now use the same helper functions, so
  they cannot drift apart.
- **The admin page stopped rendering halfway through.** The shared navigation
  partial is included into every page's variable scope, and it used `$q` for
  its own profile query. On `admin.php` that replaced the search text with a
  `PDOStatement`, so `htmlspecialchars()` threw and the response ended after
  the "Create account" heading. The partial's locals are now `$nav*`, and the
  whole page renders again.
- **The save API accepted a cross-site POST.** It now requires the session's
  CSRF token in `X-CSRF-Token`; the token is written into the injected game
  markup and sent by `SaveService`, so a different site cannot overwrite a
  player's progress.

# 7. Security and scalability proposal

## 7.1 Security measures applied and where

| Measure | Location |
|---|---|
| `password_hash()` / `password_verify()` | `login.php`, `register.php`, `profile.php` |
| Google accounts cannot be guessed into manual login | `google-login.php` stores a random hidden password + `auth_provider=google`, `password_set=0`; Profile has a **Set a local password** flow and admin reset marks `password_set=1`. |
| Prepared statements for every query | repositories, API controller, admin/profile |
| Output escaped with `htmlspecialchars()` | all page output, nav, admin, profile |
| Server-side validation and clamping | register/login, `SaveRepository::clean`, admin actions |
| Session ID regeneration and secure cookie | `Auth::login`, `Auth::start` |
| Role check on every admin request | `admin.php` + `Auth::refresh` |
| CSRF tokens on forms and on the save API | login, register, admin, profile, restart, `api.php?action=save` (`X-CSRF-Token`) |
| Upload type, size, image and random-name checks | `profile.php` |
| Non-executable uploads + directory listing off | `uploads/.htaccess`, `.htaccess` |
| Credentials excluded from git and blocked over HTTP | `.gitignore`, `.htaccess`, `db.container.php` |
| HTTPS-aware secure cookies | `Auth::start` honours `X-Forwarded-Proto` |
| Security headers | `Auth::start` sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and a strict referrer policy |
| Developer tools are admin-only | `in-game.php` re-reads the role and omits the 🛠 button/panel for players (`data-dev="0"`) |

## 7.2 Remaining risks

- Free Render instances have ephemeral storage, so avatar files can disappear
  after a redeploy. Supabase Storage or a paid persistent disk is the next step.
- Login rate limiting is not implemented; a public deployment could be brute-forced.
- Sessions are stored on the local filesystem, so the app should run as one instance.
- Google sign-in is hidden when credentials are not configured; the username and
  password path is fully supported.
- Admin audit is append-only, but there is no automated alerting.

## 7.3 Next improvements

1. Move avatars to Supabase Storage and store only the public path.
2. Add login-attempt throttling and optional two-factor authentication.
3. Add shared session storage (Redis/Postgres) before scaling horizontally.
4. Add automated backups and a restore drill for the Supabase database.
5. Add server-side image thumbnails and a media library for the admin.

## 7.4 Scaling plan

- Use the managed Supabase PostgreSQL tier and read replicas for reporting.
- Put the PHP app behind a load balancer and run multiple stateless containers.
- Serve static CSS, JS and uploaded media through a CDN/object storage.
- Cache the reference data (`locations`, `menu_items`) in memory or a fast KV
  store if the app ever starts reading it; today the gameplay values live in
  `gamefile/js/config.js` and the database copy is documentation only.
- Keep writes small: `player_progress` is one row per player and saves are
  serialized/debounced; add a queue if write volume grows.
- Add structured logs and metrics for API latency, save failures and login failures.

# 8. Cloud deployment record

**Platform:** Render (Docker web service)\
**Database:** Supabase PostgreSQL (managed)\
**Runtime:** PHP 8.2 + Apache, PDO PostgreSQL, HTTPS terminated by Render\
**Status:** **live** at <https://beedashdiner.onrender.com>.

The Docker image was built locally and run on a Render-style non-root port
against the live Supabase database before the deploy. Login, the game, all four
modals, autosave, Exit, avatar upload, admin access and the 403 page all passed
inside the container, with no console errors. The live service was then checked
over HTTPS with both demo roles: player login and menu, admin login and
dashboard, the player-only 403 block, no developer tools for the player, and
CSRF rejection on the save API.

Deployment steps:

1. Push the repository branch to GitHub.
2. Create a Render Web Service from the repository and select Docker.
3. Add `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
   `GOOGLE_REDIRECT_URI` in Render. The database value is the Supabase session
   pooler URI; the Google callback is
   `https://beedashdiner.onrender.com/google-login.php`.
4. Register `https://beedashdiner.onrender.com/google-login.php` as an
   **Authorized redirect URI** in the Google OAuth client. Without this exact
   entry Google answers `redirect_uri_mismatch`.
5. Render builds the `Dockerfile`; the entrypoint makes Apache listen on Render’s
   `PORT`; deploy.
6. Run the repository-root `database.sql` in the Supabase SQL editor. It creates
   the schema and the two demo accounts; `demo_admin` is already an admin in
   the seed data, so no promotion step is needed.
7. Verify the public URL, HTTPS, login, game, profile upload, and access-denied page.

Problems met and solutions:

- **Apache port:** Render requires the app to listen on `$PORT`. The entrypoint
  rewrites Apache’s `Listen` and VirtualHost port.
- **Database credentials:** the local `db.php` is ignored and cannot be shipped.
  The image copies `db.container.php` to `db.php` and reads `DATABASE_URL`.
- **HTTPS cookies:** Render terminates TLS at its proxy. `Auth::start()` now
  checks `X-Forwarded-Proto`.
- **Google OAuth:** Render needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
  `GOOGLE_REDIRECT_URI`; the callback must also be registered for the deployed
  domain in Google Cloud Console. The Google button appears only when a client
  ID and secret are configured, and the username/password path remains
  available.
- **Ephemeral uploads:** documented as a free-plan limitation; Supabase Storage
  is the recommended next step.

# 9. Individual reflections

## Klein Rhee Pagulong Sioson — Backend, audio, game logic, integration

My main work was the game loop and the integration between PHP, the database and
the browser. The hardest problem was making saves feel reliable: the game had to
save when the player pressed Exit, when the tab was hidden, and when an action
changed the state, without letting two requests race. I learned how pagehide
keepalive requests, dirty checks and local fallbacks work together. I also built
the procedural audio engine, which taught me gain staging, compressors, reverb
and browser autoplay rules. The reference-game SWOT showed that a polished identity and fair pacing
matter more than feature count; next time I would freeze the feature list
earlier and protect more time for deployment testing.

## John David Pascua Morandante — Backend, database, Google Cloud, repository

I owned the repository and the database side. The hardest part was keeping the
same PDO code working against both MySQL/MariaDB and PostgreSQL/Supabase while
preserving old saves. The migration tests and the `SaveRepository` clamping
logic were important because a bad save could break a player’s progress. I
learned how connection pooling, SSL and cloud environment variables differ from
a local XAMPP setup. Next time I would set up the cloud database and deployment
credentials earlier, and add automated backups before the first public demo.

## Emman Glen Mendoza Wong Yan — Mechanics, documentation, design, QA

My contribution was the game mechanics and the quality/documentation pass. The
hardest problem was balancing a restaurant that could serve many customers
without turning the screen into a crowd at the door. We changed the arrival
burst into a measured entry gap and made the opening quieter. I learned that
good QA is not only “does it run” but “does it feel right at 320px, at 1440px,
and after a reload.” The reference-game SWOT showed that late-game grind and
monetization are the fastest ways to lose players; we kept the mission structure
and avoided those. Next time I would schedule a playtest earlier and keep a
written test script beside every build.

## Ardion Nicolas Dela Cruz Tamagos — Design, frontend, art, QA

I worked on the visual direction and frontend polish. The most difficult part
was making a scene built from emoji and CSS feel like a real café: stations
became striped-awning stalls, the kitchen gained a shelf and lamps, and the
floor gained a rug and plants. I learned a lot about CSS stacking contexts,
responsive sizing and accessible contrast. The SWOT showed that a distinctive visual identity is the
main opportunity in a saturated idle market, but it also took more iterations
than expected. Next time I would lock the art direction earlier and test the smallest
phone size before adding detail.

## Iszen Paul Masculino Ventura — Group leader, ideas, documentation, QA

As group leader I helped set the direction, divide the work and review the
documentation. The hardest part was coordinating members with different
availability and overlapping skills. I learned that a clear checklist and small
reviewable commits are more useful than a large “final” merge. The SWOT showed that market saturation and player burnout are
the main external threats; the same lesson applied to our schedule when
availability slipped, so next time we would assign backups for every critical
task and hold a short stand-up each work session.

# 10. Appendices

## 10.1 Contribution record

| Member | Main tasks | Files/pages | Approx. % |
|---|---|---|---|
| Klein | Game logic, saves, audio, integration, deployment package | `gamefile/js/*`, `in-game.php`, `Dockerfile`, `render.yaml` | 20% |
| John David | Database, PDO/Supabase, repository, cloud/Google setup | `src/SaveRepository.php`, `db.container.php`, GitHub | 20% |
| Emman | Mechanics, balance, documentation, QA | `js/config.js`, `js/Scene.js`, `docs/`, tests | 20% |
| Ardion | Visual design, frontend, art, responsive QA | `css/*`, menu, station/door styling | 20% |
| Iszen | Leadership, ideas, documentation, QA | requirements, review, presentation | 20% |

## 10.2 Source code and working sessions

**Repository:** <https://github.com/JolliDew/BeeDashDiner>\
**Branch:** `feat/scene-first-ui`

The group worked in the sessions below. The dates are the commit dates, and the
decision column records what the group agreed to at that point.

| Date | Members | Focus | Decisions |
|---|---|---|---|
| Nov 2–5 | JD, Klein, Iszen | Setup and login | Keep one XAMPP copy, protect the credentials, split auth from the game |
| Nov 6 | Klein, JD | Gameplay core | Ten levels, automatic workers and save format v3; support PostgreSQL beside MySQL |
| Nov 17 | Klein, JD, Emman | Redesign and admin | Keep the redesign, repair its save format, add full admin CRUD and the audit log |
| Nov 18 | Ardion, Emman, Klein | Scene, pacing, audio | Three distinct maps, calm arrivals, procedural audio, shared navigation |
| Nov 19 | All five | Final audit and submission | Fix save ordering and restart, record the fixes, freeze the document and record the video |

## 10.3 Test credentials

```text
Public URL: https://beedashdiner.onrender.com
Player:    demo_player / JolliDemo123!
Admin:     demo_admin  / JolliDemo123!
```

The database export `database.sql` creates these demo accounts with hashed
passwords and gives `demo_admin` the admin role. Change the passwords before
opening the site to the public.
