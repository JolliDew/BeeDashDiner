# CC106 — Cloud-Based Application Development · CLE rubric self-check

Culminating Learning Evidence (CLE), end-term final project. Status as of
the current branch.

| Guide requirement | Status | Evidence |
|---|---|---|
| Two roles (admin + regular user) | ✅ | `users.role`, `admin.php`, player 403 test |
| Authentication and session management | ✅ | `login.php`, `Auth.php`, session regeneration/logout |
| Role-based access control | ✅ | Admin role checks; `denied.php` 403 page |
| Complete CRUD for main data | ✅ | Admin user create/read/update/delete + audit; the player's own restart replaces only their save |
| Reusable common navigation | ✅ | `includes/nav.php`, `css/site-nav.css` on every page |
| Proper HTML/CSS, Bootstrap, IDs/classes | ✅ | Bootstrap modals/buttons; shared page/game CSS |
| Session variables control content | ✅ | Role-aware nav and admin link |
| Cloud deployment | ⏳ package ready | `Dockerfile`, `render.yaml`, `docs/DEPLOY_RENDER.md`; deploy and add URL |
| Media upload/display | ✅ | Profile avatar upload with MIME/size/image checks and display in nav/profile |
| Security checklist | ✅ | Hash, prepared statements, escaping, CSRF, roles, uploads, HTTPS-aware cookies |
| 3+ related tables with keys + join | ✅ | `users`, `player_progress`, `player_stations`, `admin_audit`, `locations`, `menu_items`; join in `AdminRepository` |
| Playable JavaScript/Bootstrap game | ✅ | `gamefile/js/*`, injectable game screen, Bootstrap modals |
| Phone-sized usability | ✅ | 320×568 and 360×800 tests; no horizontal overflow |
| Clear rules/controls | ✅ | `help.php`, README, docs/GAMEPLAY |
| Visible score/progress | ✅ | Honey/diamonds/chairs HUD, level/location, missions |
| Win/lose condition | ✅ | Win at Level 10; completed-game banner; no lose state |
| Restart option | ✅ | `restart.php` + confirmation on the main menu |
| Source code / repository | ✅ | Local git repo; push before submission |
| Database export | ✅ | `database.sql` with schema, seed data and demo accounts |
| Live application URL | ✅ | https://beedashdiner.onrender.com |
| Test credentials | ✅ | `demo_player` / `demo_admin`; passwords in README |
| Demonstration video | ⏳ | Record with `docs/DEMO_SCRIPT.md` |
| README with setup/platform/members | ✅ | `README.md` |
| Building document (SWOT first) | ✅ | `docs/PROJECT_BUILDING_DOCUMENT.docx` + `.md` |
| ER diagram, role matrix, page flow | ✅ | Building document + `docs/screenshots/` |
| Development log and screenshots | ✅ | Building document section 5 |
| Testing record | ✅ | `docs/TESTING.md` + building document section 6 |
| Security/scalability proposal | ✅ | Building document section 7 |
| Deployment record | ✅ | Building document section 8 (URL pending) |
| Contribution record | ✅ | Building document appendix |
| Individual reflections | ✅ | Five reflections in building document section 9 |

## Before Canvas submission

1. The Render deployment is live; update the URL only if the service name changes.
2. Confirm the live URL, HTTPS, demo accounts, avatar upload and admin page.
3. Record the video using the script.
4. Regenerate the DOCX/PDF if the live URL changes.
5. Zip the source or submit the repository link; include `database.sql`.
6. Make sure no real secrets are committed (`git status`, `git grep`).
