# Admin panel

`gamefile/admin.php` is the account-management page required by the project
brief. It is available only to accounts whose `users.role` is `admin`.

---

## 1. Install the schema

### MySQL/MariaDB

Fresh install:

```bash
mysql -u root -p < gamefile/login_db.sql
```

Existing database:

```bash
mysql -u root -p jollidew_db < gamefile/upgrade_db.sql
```

The migration adds:

- `users.role` (`player` or `admin`, default `player`);
- `users.avatar`, `users.auth_provider` and `users.password_set`;
- the `admin_audit` table, with an index on `target_user_id` and one on
  `created_at`;
- the save-v3 columns on `player_progress` and `player_stations`.

It does not create an index on `users`; the account list is small enough to
scan, and the unique indexes on `username` and `email` are enough for the
duplicate checks.

### PostgreSQL/Supabase

Run `gamefile/login_db_pg.sql` in the SQL Editor. It is safe to re-run and adds
the same role/audit objects.

---

## 2. Create the first admin

Register a normal account in the browser, then run this **on the server**:

```bash
php gamefile/bin/make-admin.php your_username
```

The script refuses to run from a web request, so a public URL cannot create an
admin. It writes an audit row (`user.promote`) when the audit table exists.

After promoting, reload `Mainmenu.php`. The **Admin Panel** button appears for
admin accounts only.

---

## 3. What admins can do

Open `admin.php` directly or use the main-menu button.

| Action | Where | Notes |
|---|---|---|
| Search accounts | Accounts card | Matches username or email, case-insensitive. |
| Paginate | Accounts card | 20 accounts per page. |
| Create account | **Create account** form | Username, email, password, role. |
| Edit account | **Edit** on a row | Username, email, and role. |
| Reset password | Edit panel | New password is hashed with `PASSWORD_DEFAULT`. |
| Reset progress | Edit panel | Replaces the save with a fresh game (level 1) and keeps the account. |
| Delete account | Edit panel | Deletes the account and every progress row. |
| Review log | **Recent admin actions** | Newest first, up to 40 rows. |

### Safety rules

- You cannot delete your own account.
- You cannot demote the last admin.
- You cannot delete the last admin.
- Deleting another admin is allowed only while at least one admin remains.
- Every POST checks a per-session CSRF token with `hash_equals`.
- The page calls `Auth::refresh($pdo)` on every request, so a deleted user or a
  demoted admin loses access immediately, even with an old session file.
- Progress deletion is explicit (`player_stations`, then `player_progress`, then
  `users`), so it works on old databases without cascade foreign keys.
- A progress reset uses the same code as the player's own **Restart progress**
  action: it writes a fresh save and moves the write number far ahead, so a
  save that the player's browser still has on its way cannot bring the old
  progress back.

---

## 4. Validation rules

| Field | Rule |
|---|---|
| Username | 3–50 characters, letters/numbers/underscore only |
| Email | `FILTER_VALIDATE_EMAIL`; stored lowercase |
| Password | at least 8 characters, hashed with `PASSWORD_DEFAULT` |
| Role | exactly `player` or `admin` |

Duplicate usernames/emails are rejected by the application and by the database
unique indexes. A racing duplicate insert is caught and shown as a normal form
error.

---

## 5. Audit log

`admin_audit` stores:

| Column | Meaning |
|---|---|
| `actor_id`, `actor_username` | who performed the action (username snapshotted) |
| `action` | e.g. `user.create`, `user.update`, `user.password`, `user.progress_reset`, `user.delete`, `user.promote` |
| `target_user_id`, `target_username` | affected account (snapshotted) |
| `details` | short human-readable description |
| `created_at` | server timestamp |

Snapshots mean the log still makes sense after an account is deleted. Audit rows
are not deleted by account deletion.

---

## 6. Security notes

- `admin.php` and every helper live under `gamefile/`; `gamefile/src/.htaccess`
  blocks direct source access under Apache.
- `gamefile/db.php` and `gamefile/src/google-config.php` are ignored by git.
- Rotate any secret that was ever committed. Removing the file in a later commit
  does not invalidate a leaked password or client secret.
- The admin page is intentionally not linked for players. Hiding the link is not
  the security boundary; the role check is.
- Admin accounts can still play the game; the role only unlocks the panel.

---

## 7. Troubleshooting

| Problem | Cause / fix |
|---|---|
| “The admin panel is only available to administrator accounts.” | The logged-in account has `role = player`. Promote it with the CLI script. |
| “The admin schema is missing.” | Run `gamefile/upgrade_db.sql` or `gamefile/login_db_pg.sql`; `users.role` or `admin_audit` is absent. |
| `make-admin.php` says no account | Register the account in the browser first; usernames are case-sensitive. |
| Admin button is missing | Log out and back in after promotion, or reload `Mainmenu.php`; `Auth::refresh()` updates the session from the database. |
| Delete fails | You may be deleting yourself or the last admin. The flash message explains which rule blocked it. |
| Search returns nothing | Search matches username/email only, not display names or save contents. |
