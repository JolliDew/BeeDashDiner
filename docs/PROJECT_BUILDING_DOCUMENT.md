---
title: "BeeDashDiner — Project Building Document"
subtitle: "CC106 CLE: Cloud-Based Web Application Group Project"
author: "Group AQM · University of St. La Salle"
date: "November 2026"
---

# Cover and team

**Project title:** BeeDashDiner  
**Group:** AQM  
**Institution:** University of St. La Salle, La Salle Avenue, Bacolod City 6100, Negros Occidental, Philippines  
**Telephone:** +63 34 434 6100  
**System:** A cloud-based bee café game with an admin dashboard  
**Course:** CC106 CLE — Cloud-Based Application Development  
**Repository:** https://github.com/JohnDavidMorandante/JolliDew  
**Planned public URL:** https://YOUR-SERVICE.onrender.com (replace with the real Render URL after deployment)

| Member | Main role | Approx. contribution |
|---|---|---|
| Klein Rhee Pagulong Sioson | Backend, sound engineering, game logic, integration | 20% |
| John David Pascua Morandante | Backend, database, Google Cloud, GitHub repository owner | 20% |
| Emman Glen Mendoza Wong Yan | Game mechanics, documentation, design, QA | 20% |
| Ardion Nicolas Dela Cruz Tamagos | Design, frontend, art, QA | 20% |
| Iszen Paul Masculino Ventura | Group leader, ideas, documentation, QA | 20% |

**Group name:** AQM.

![BeeDashDiner public landing page](docs/screenshots/landing-desktop.png){width=100%}

# 1. SWOT analysis

The SWOT was completed before feature work resumed. It focused on the team and
the assigned system, not only on the game.

| Strengths | Weaknesses |
|---|---|
| Working PHP/JavaScript codebase and a tested save format. | Roles overlapped heavily; one member carried much of the integration work. |
| Experience with PHP sessions, PDO, Bootstrap and responsive CSS. | No prior Render deployment; Google OAuth credentials were not usable (redirect mismatch). |
| Supabase/PostgreSQL database already provisioned. | No dedicated artist or sound designer; visuals and audio had to be built from CSS, emoji and synthesis. |
| Strong QA habit: automated tests, headless browser checks and manual mobile checks. | Time was short and many rubric items (media upload, shared navigation, restart, deployment) were still missing. |

| Opportunities | Threats |
|---|---|
| Render’s Docker deployment can host the PHP app with HTTPS for free. | Free hosting has ephemeral storage and sleeps after inactivity. |
| Supabase provides a managed PostgreSQL database and SQL editor. | Deadline pressure; a failed deployment near submission would affect the video. |
| A relaxing, audio-rich game is more memorable than a plain CRUD demo. | Browser autoplay rules block audio until a user gesture. |
| The project guide rewards media upload and a complete building document. | Group availability was inconsistent, so work could stall if one member was unavailable. |

## Decisions that followed the SWOT

1. **Deploy with Docker on Render.** The database stays on Supabase, so no
   database migration was needed. The repository now includes a `Dockerfile`,
   a Render entrypoint and `render.yaml`.
2. **Prioritise rubric gaps over new gameplay.** Shared navigation, profile and
   avatar upload, access-denied page, restart, explicit win condition and the
   building document were added before optional content.
3. **Keep the game calm and reliable.** Save-on-close, staggered customer
   arrivals, a hive worker intro and a softer audio mix were chosen over adding
   more restaurants or cosmetics.
4. **Work in reviewable phases.** Each phase is tested and committed separately:
   UI shell, scene art, desktop/HUD, saving, room polish and audio.

# 2. Requirements and scope

## 2.1 Problem and users

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

## 2.2 Feature list

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

## 2.3 Game concept

The restaurant starts at **Meadow Stand** with one bee and four chairs. Guests
arrive through the lower-left door, sit, order, and wait. The bee takes the
order, cooks at the correct station, serves the guest, and returns. Tips and
mission rewards buy more staff, recipes and restaurant-wide upgrades. After all
three missions on a level, the player advances; after Level 10 the game is won.

# 3. System design

## 3.1 Entity–relationship diagram

![ER diagram](docs/screenshots/er-diagram.png){width=100%}

The schema has six related tables. `player_progress` and `player_stations` have
a foreign key to `users` with `ON DELETE CASCADE`; `menu_items` references
`locations`. `admin_audit` deliberately has no foreign key: it stores the
actor and target ids together with a snapshot of the usernames, so the
append-only log survives the deletion of the account it describes. The admin
dashboard uses a join:

```sql
SELECT u.id, u.username, u.role, p.level, p.honey
FROM users u
LEFT JOIN player_progress p ON p.user_id = u.id
ORDER BY u.id;
```

## 3.2 Role access matrix

| Page or feature | Guest | Player | Admin |
|---|---|---|---|
| Login / register | Yes | No (redirected to game) | No |
| Help / rules | Yes | Yes | Yes |
| Play game / save API | No | Yes | Yes |
| Profile / own avatar | No | Yes, own only | Yes, own only |
| Restart own progress | No | Yes, own only | Yes, own only |
| Admin dashboard / user CRUD / audit | No | No — 403 access-denied page | Yes |
| Delete another account | No | No | Yes |

## 3.3 Page flow

![Page flow](docs/screenshots/page-flow.png){width=100%}

## 3.4 Folder structure

```text
JolliDew/
├── Dockerfile                 # Render/PHP-Apache container
├── render.yaml                # Optional Render Blueprint
├── database.sql               # PostgreSQL schema + demo accounts
├── gamefile/
│   ├── includes/nav.php       # shared role-aware navigation
│   ├── css/                   # game, modal, nav and page styles
│   ├── js/                    # game modules, audio engine, save service
│   ├── src/                   # Auth, CSRF, repositories, API controller
│   ├── uploads/               # user avatars (non-executable)
│   ├── admin.php              # admin dashboard
│   ├── profile.php            # profile, avatar, password
│   ├── help.php               # rules, controls, win condition
│   ├── denied.php             # 403 page
│   ├── restart.php            # start over (fresh save, old save invalidated)
│   └── login/register/menu/game pages
├── tests/                     # JS + PHP test suites
└── docs/                      # guides, deployment, this document
```

## 3.5 Restaurant maps

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

![Meadow Stand](docs/screenshots/map-meadow.png){width=100%}

![Hive Café](docs/screenshots/map-hive.png){width=100%}

![Royal Hive](docs/screenshots/map-royal.png){width=100%}

# 4. Development log

| Stage | Work completed | Evidence |
|---|---|---|
| 1. Setup | Consolidated the working copy into XAMPP `htdocs`; protected `.git`, database config and notes; fixed Apache ACLs. | Login returned 200; `.git` returned 404. |
| 2. UI shell | Fixed the clipped gradient title, unlocked scrolling on auth pages, added a responsive main menu and a favicon. | Menu at 320, 360, 568×320 and 1440. |
| 3. Scene | Replaced station icons with food stalls, added a café door, kitchen wall, shelf, lamps, rug and plants. | Game phone/desktop screenshots. |
| 3b. Three maps | Meadow Stand became an outdoor market, Hive Café a warm interior and Royal Hive a regal hall. The menu sign moved into the stall row so it cannot overlap or drift. | Map measurements at 360, 568×320 and 1440: sign gap 3–8px, zero overflow. |
| 4. HUD and desktop | Grouped honey/diamonds/chairs into one bar, made Exit an icon button, widened the playfield to 1000px, slimmed the desktop dock. | 320–1440 checks with zero overflow. |
| 5. Saving | Dirty-checked serialized autosave, pagehide/visibility keepalive save, local-backup fallback, welcome-back toast. | Honey survived a pagehide + reload test. |
| 6. Pacing | Removed the door burst, delayed the first customer, enforced a calm entry gap, started workers from a hive. | Spawn log: first guest at 1.8s, then a measured interval. |
| 7. Audio | Procedural Web Audio engine with compressor, reverb, volume sliders, soft timbres, slow ambient music, ducking and tab-hide suspension. | Context running; slider persistence; no console errors. |
| 8. Rubric features | Shared nav, profile/avatar upload, password change, access-denied page, restart, help/win copy, menu progress. | Live XAMPP checks for each flow. |
| 9. Deployment package | Dockerfile, Render entrypoint, env-based DB config, `render.yaml`, deployment guide, database export. | Ready for Render; URL to be added after deploy. |
| 9b. Landing and brand | Added a public landing page, root redirect, home-first navigation, and standardised the visible product name to BeeDashDiner (repo/folder stays JolliDew). | Landing screenshots at 320 and 1440; brand check. |
| 10. Documentation | README, game rules, testing record, security/scalability proposal, reflections, video script. | This document and `docs/`. |

![Game on a phone](docs/screenshots/game-phone.png){width=48%}
![Audio panel](docs/screenshots/audio-panel.png){width=48%}

# 5. Testing record

## 5.1 Automated tests

`npm test` runs the JavaScript and PHP suites with no database required.

- **60 JavaScript tests** cover game state migration, economy, missions, worker
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

## 5.2 Manual test cases

| ID | Feature | Steps | Expected | Actual | Result |
|---|---|---|---|---|---|
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
| T12 | Deployment | Open Render URL, log in, play | App reachable over HTTPS | Pending Render deploy | Pending |
| T13 | Maps and menu sign | Switch to levels 1, 5 and 8 at 360, 568×320 and 1440 | Distinct maps; sign always 3–8px above stalls; no overflow | 3/4/5 stations, correct decor, no overlap | Pass |
| T14 | Colour contrast | Open menu, help and profile; inspect gold buttons | Dark text on gold, readable labels | Button text corrected | Pass |
| T15 | Google account password | Simulate a Google-created account; try manual login, then set a local password in Profile and log in manually | Helpful message first; local login works after setting | Both stages passed | Pass |
| T16 | Landing and home flow | Visit `/JolliDew/`, use Play/Create account, log out | Landing loads, CTAs work, logout returns home | Root 302 to landing; landing 200; flow verified | Pass |
| T17 | Mission reward | Craft a save with one mission finished, press Play, then reload | The reward is paid once and reaches the server | Server showed index 1 and 200 honey; a reload kept 200 honey | Pass |
| T18 | Save ordering | Send two saves, the older one arriving late | The newer state is kept | The server answered 409 and kept the newer progress | Pass |
| T19 | Restart race | Exit the game, restart, then let the keepalive save arrive | The restart stays | Level 1 and 50 honey after the late save | Pass |
| T20 | Exit during load | Press Exit while the save is still loading | No game keeps running | The game markup was removed and the menu came back | Pass |

## 5.3 Bugs found and fixed

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

The final audit round found four more defects, all confirmed by reproducing
them in a real browser before fixing them:

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

# 6. Security and scalability proposal

## 6.1 Security measures applied and where

| Measure | Location |
|---|---|
| `password_hash()` / `password_verify()` | `login.php`, `register.php`, `profile.php` |
| Google accounts cannot be guessed into manual login | `google-login.php` stores a random hidden password + `auth_provider=google`, `password_set=0`; Profile has a **Set a local password** flow and admin reset marks `password_set=1`. |
| Prepared statements for every query | repositories, API controller, admin/profile |
| Output escaped with `htmlspecialchars()` | all page output, nav, admin, profile |
| Server-side validation and clamping | register/login, `SaveRepository::clean`, admin actions |
| Session ID regeneration and secure cookie | `Auth::login`, `Auth::start` |
| Role check on every admin request | `admin.php` + `Auth::refresh` |
| CSRF tokens on forms | login, register, admin, profile, restart |
| Upload type, size, image and random-name checks | `profile.php` |
| Non-executable uploads + directory listing off | `uploads/.htaccess`, `.htaccess` |
| Credentials excluded from git and blocked over HTTP | `.gitignore`, `.htaccess`, `db.container.php` |
| HTTPS-aware secure cookies | `Auth::start` honours `X-Forwarded-Proto` |

## 6.2 Remaining risks

- Free Render instances have ephemeral storage, so avatar files can disappear
  after a redeploy. Supabase Storage or a paid persistent disk is the next step.
- Login rate limiting is not implemented; a public deployment could be brute-forced.
- Sessions are stored on the local filesystem, so the app should run as one instance.
- Google sign-in is hidden when credentials are not configured; the username and
  password path is fully supported.
- Admin audit is append-only, but there is no automated alerting.

## 6.3 Next improvements

1. Move avatars to Supabase Storage and store only the public path.
2. Add login-attempt throttling and optional two-factor authentication.
3. Add shared session storage (Redis/Postgres) before scaling horizontally.
4. Add automated backups and a restore drill for the Supabase database.
5. Add server-side image thumbnails and a media library for the admin.

## 6.4 Scaling plan

- Use the managed Supabase PostgreSQL tier and read replicas for reporting.
- Put the PHP app behind a load balancer and run multiple stateless containers.
- Serve static CSS, JS and uploaded media through a CDN/object storage.
- Cache the reference data (`locations`, `menu_items`) in memory or a fast KV
  store if the app ever starts reading it; today the gameplay values live in
  `gamefile/js/config.js` and the database copy is documentation only.
- Keep writes small: `player_progress` is one row per player and saves are
  serialized/debounced; add a queue if write volume grows.
- Add structured logs and metrics for API latency, save failures and login failures.

# 7. Cloud deployment record

**Platform:** Render (Docker web service)  
**Database:** Supabase PostgreSQL (managed)  
**Runtime:** PHP 8.2 + Apache, PDO PostgreSQL, HTTPS terminated by Render  
**Status:** prepared and container-tested; the Render service is created by the
repository owner, so the public URL is still a placeholder in this document.

The Docker image was built locally and run on a Render-style non-root port
against the live Supabase database. Login, the game, all four modals, autosave,
Exit, avatar upload, admin access and the 403 page all passed inside the
container, with no console errors.

Deployment steps:

1. Push the repository branch to GitHub.
2. Create a Render Web Service from the repository and select Docker.
3. Add the `DATABASE_URL` environment variable from Supabase (session pooler URI).
4. Render builds the `Dockerfile`; the entrypoint makes Apache listen on Render’s
   `PORT`; deploy.
5. Run the repository-root `database.sql` in the Supabase SQL editor. It creates
   the schema and the two demo accounts; `demo_admin` is already an admin in
   the seed data, so no promotion step is needed.
6. Verify the public URL, HTTPS, login, game, profile upload, and access-denied page.

Problems met and solutions:

- **Apache port:** Render requires the app to listen on `$PORT`. The entrypoint
  rewrites Apache’s `Listen` and VirtualHost port.
- **Database credentials:** the local `db.php` is ignored and cannot be shipped.
  The image copies `db.container.php` to `db.php` and reads `DATABASE_URL`.
- **HTTPS cookies:** Render terminates TLS at its proxy. `Auth::start()` now
  checks `X-Forwarded-Proto`.
- **Google OAuth:** the redirect URI mismatch could not be fixed without Google
  Console access. The Google button is hidden on both the sign-in and the
  registration page when no config file exists; the password path remains
  available.
- **Ephemeral uploads:** documented as a free-plan limitation; Supabase Storage
  is the recommended next step.

# 8. Individual reflections

> These sections describe each member's actual area of work. Each member should
> review their own section and add any personal detail they want before submission.

## Klein Rhee Pagulong Sioson — Backend, audio, game logic, integration

My main work was the game loop and the integration between PHP, the database and
the browser. The hardest problem was making saves feel reliable: the game had to
save when the player pressed Exit, when the tab was hidden, and when an action
changed the state, without letting two requests race. I learned how pagehide
keepalive requests, dirty checks and local fallbacks work together. I also built
the procedural audio engine, which taught me gain staging, compressors, reverb
and browser autoplay rules. The SWOT was accurate about our overlapping roles;
next time I would freeze the feature list earlier and protect more time for
deployment testing.

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
and after a reload.” The SWOT correctly predicted that time and overlapping
roles were our biggest threats. Next time I would schedule a playtest earlier
and keep a written test script beside every build.

## Ardion Nicolas Dela Cruz Tamagos — Design, frontend, art, QA

I worked on the visual direction and frontend polish. The most difficult part
was making a scene built from emoji and CSS feel like a real café: stations
became striped-awning stalls, the kitchen gained a shelf and lamps, and the
floor gained a rug and plants. I learned a lot about CSS stacking contexts,
responsive sizing and accessible contrast. The SWOT’s opportunity—making the
game visually distinctive—was real, but it also took more iterations than
expected. Next time I would lock the art direction earlier and test the smallest
phone size before adding detail.

## Iszen Paul Masculino Ventura — Group leader, ideas, documentation, QA

As group leader I helped set the direction, divide the work and review the
documentation. The hardest part was coordinating members with different
availability and overlapping skills. I learned that a clear checklist and small
reviewable commits are more useful than a large “final” merge. The SWOT’s threat
about inconsistent availability did happen, so next time we would assign
backups for every critical task and hold a short stand-up each work session.

# 9. Appendices

## 9.1 Contribution record

| Member | Main tasks | Files/pages | Approx. % |
|---|---|---|---|
| Klein | Game logic, saves, audio, integration, deployment package | `gamefile/js/*`, `in-game.php`, `Dockerfile`, `render.yaml` | 20% |
| John David | Database, PDO/Supabase, repository, cloud/Google setup | `src/SaveRepository.php`, `db.container.php`, GitHub | 20% |
| Emman | Mechanics, balance, documentation, QA | `js/config.js`, `js/Scene.js`, `docs/`, tests | 20% |
| Ardion | Visual design, frontend, art, responsive QA | `css/*`, menu, station/door styling | 20% |
| Iszen | Leadership, ideas, documentation, QA | requirements, review, presentation | 20% |

## 9.2 Test credentials

```text
Public URL: https://YOUR-SERVICE.onrender.com   (replace after deployment)
Player:    demo_player / JolliDemo123!
Admin:     demo_admin  / JolliDemo123!
```

The database export `database.sql` creates these demo accounts with hashed
passwords and gives `demo_admin` the admin role. Change the passwords before
opening the site to the public.

## 9.3 Reproducing the project locally

```bash
# Database (PostgreSQL/Supabase)
psql "$DATABASE_URL" -f database.sql

# Local config
cp gamefile/db.example.php gamefile/db.php   # then edit the values
cp gamefile/src/google-config.example.php gamefile/src/google-config.php  # optional

# Run XAMPP Apache, then open:
# http://localhost/JolliDew/gamefile/login.php

# Tests
npm test
```

## 9.4 Demo video plan

A 10–12 minute recording should follow the guide’s segments:

1. Introduction (1 min): group, purpose, tech stack.
2. Admin walkthrough (2–3 min): login, create/read/update/delete, media/avatar,
   audit log.
3. Player walkthrough (2–3 min): register/login, play, save/resume, profile,
   mobile view, blocked admin URL.
4. Database (1 min): show tables and a row changing after an action.
5. Security (1 min): hashed password and blocked URL.
6. Cloud deployment (1 min): public Render URL and HTTPS.
7. Game (1 min): rules, score, win condition, restart.
8. Closing (1 min): challenges, lessons, next improvements.
