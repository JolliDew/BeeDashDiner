<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
require_once 'src/AdminRepository.php';
Auth::start();
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

try {
    $me = Auth::refresh($pdo, true);
} catch (Throwable $e) {
    http_response_code(500);
    exit('The admin schema is missing. Run gamefile/upgrade_db.sql (MySQL) or gamefile/login_db_pg.sql (PostgreSQL), then reload this page.');
}
if (!$me) {
    header('Location: login.php');
    exit();
}
if (($me['role'] ?? 'player') !== 'admin') {
    header('Location: denied.php?from=admin');
    exit();
}

$repo = new AdminRepository($pdo);
$q = trim((string)($_GET['q'] ?? ''));
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 20;
$editId = max(0, (int)($_GET['edit'] ?? 0));
$flash = $_SESSION['admin_flash'] ?? '';
unset($_SESSION['admin_flash']);

function e(mixed $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

/** PostgreSQL returns microseconds; a person only needs the minute. */
function fmt_date(?string $value): string
{
    if (!$value) {
        return '—';
    }
    $ts = strtotime($value);
    return $ts === false ? e($value) : date('j M Y, H:i', $ts);
}

/** A logging failure must never undo or hide a successful admin action. */
function record_action(
    AdminRepository $repo,
    ?int $actorId,
    string $action,
    ?int $targetId,
    string $details,
    ?string $targetUsername = null
): void {
    try {
        $repo->audit($actorId, $action, $targetId, $details, $targetUsername);
    } catch (Throwable $e) {
        error_log('admin audit: ' . $e->getMessage());
    }
}

function admin_redirect(string $q, int $page, int $editId = 0): void
{
    $args = ['q' => $q, 'page' => $page];
    if ($editId > 0) {
        $args['edit'] = $editId;
    }
    header('Location: admin.php?' . http_build_query($args));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $backQ = trim((string)($_POST['q'] ?? ''));
    $backPage = max(1, (int)($_POST['page'] ?? 1));
    $action = (string)($_POST['action'] ?? '');

    if (!Csrf::check($_POST['csrf_token'] ?? null)) {
        $_SESSION['admin_flash'] = 'Your session expired. Please try again.';
        admin_redirect($backQ, $backPage, $editId);
    }

    $id = max(0, (int)($_POST['id'] ?? 0));
    try {
        switch ($action) {
            case 'create':
                $newId = $repo->create(
                    (string)($_POST['username'] ?? ''),
                    (string)($_POST['email'] ?? ''),
                    (string)($_POST['password'] ?? ''),
                    (string)($_POST['role'] ?? 'player')
                );
                record_action($repo, (int)$me['id'], 'user.create', $newId, 'Created account');
                $_SESSION['admin_flash'] = 'Created user #' . $newId . '.';
                admin_redirect($backQ, $backPage);

            case 'update':
                $repo->update(
                    $id,
                    (string)($_POST['username'] ?? ''),
                    (string)($_POST['email'] ?? ''),
                    (string)($_POST['role'] ?? 'player')
                );
                record_action($repo, (int)$me['id'], 'user.update', $id, 'Updated username, email or role');
                $_SESSION['admin_flash'] = 'User #' . $id . ' updated.';
                admin_redirect($backQ, $backPage, $id);

            case 'password':
                $repo->setPassword($id, (string)($_POST['password'] ?? ''));
                record_action($repo, (int)$me['id'], 'user.password', $id, 'Reset password');
                $_SESSION['admin_flash'] = 'Password reset for user #' . $id . '.';
                admin_redirect($backQ, $backPage, $id);

            case 'reset_progress':
                $repo->resetProgress($id);
                record_action($repo, (int)$me['id'], 'user.progress_reset', $id, 'Deleted save rows');
                $_SESSION['admin_flash'] = 'Progress reset for user #' . $id . '.';
                admin_redirect($backQ, $backPage);

            case 'delete':
                $target = $repo->find($id);
                $name = $target['username'] ?? ('#' . $id);
                // Delete first so a blocked self/last-admin delete is not
                // recorded as a successful action. The nickname is snapshotted
                // because the account is gone by the time the audit is written.
                $repo->delete($id, (int)$me['id']);
                record_action($repo, (int)$me['id'], 'user.delete', $id, 'Deleted ' . $name, $name);
                $_SESSION['admin_flash'] = 'Deleted user ' . $name . '.';
                admin_redirect($backQ, $backPage);

            default:
                throw new InvalidArgumentException('Unknown admin action.');
        }
    } catch (InvalidArgumentException $e) {
        $_SESSION['admin_flash'] = $e->getMessage();
    } catch (Throwable $e) {
        error_log('admin.php: ' . $e->getMessage());
        $_SESSION['admin_flash'] = 'The database could not complete that action. Check the server log.';
    }
    admin_redirect($backQ, $backPage, $editId ?: $id);
}

try {
    $stats = $repo->stats();
    $result = $repo->paginate($q, $page, $perPage);
    $edit = $editId ? $repo->find($editId) : null;
    $audits = $repo->audits(40);
} catch (Throwable $e) {
    http_response_code(500);
    exit('The admin tables are not ready. Run the database migration and reload.');
}

$pages = max(1, (int)ceil($result['total'] / $perPage));
$link = fn(int $p): string => 'admin.php?' . http_build_query(['q' => $q, 'page' => $p]);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - BeeDashDiner</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="css/site-nav.css">
    <style>
        body { background: #16120c; color: #fff6df; }
        a { color: #ffd84d; }
        .card, .table, .modal-content { background: #241d12; border-color: #4a3b22; }
        .card-header, .table thead th, .table td, .table th { border-color: #4a3b22; }
        .table { color: #fff6df; }
        .table thead th { color: #cdbb8f; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
        .table-hover tbody tr:hover { background: #33291a; color: #fff6df; }
        .form-control { background: #33291a; border-color: #5a4929; color: #fff6df; }
        .form-control:focus { background: #3d3320; border-color: #ffd84d; color: #fff6df; box-shadow: none; }
        .badge-admin { background: #ffd84d; color: #241d12; }
        .badge-player { background: #5a4929; color: #fff6df; }
        .btn-honey { background: #ffd84d; color: #241d12; font-weight: 700; }
        .btn-honey:hover { background: #f0c53c; color: #241d12; }
        .stat { background: #241d12; border: 1px solid #4a3b22; border-radius: 12px; padding: 12px 16px; }
        .stat b { display: block; font-size: 1.5rem; color: #ffd84d; }
        .muted { color: #cdbb8f; }
        .table-responsive { border-radius: 10px; }
    </style>
</head>
<body class="has-nav">
<?php $navActive = 'admin'; include 'includes/nav.php'; ?>
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div>
            <h1 class="h3 mb-1">🍯 BeeDashDiner admin</h1>
            <div class="muted">Signed in as <strong><?= e($me['username']) ?></strong> (<?= e($me['role']) ?>)</div>
        </div>
        <div class="mt-2 mt-sm-0">
            <a class="btn btn-outline-warning btn-sm" href="Mainmenu.php">Back to game</a>
            <a class="btn btn-outline-light btn-sm" href="logout.php">Log out</a>
        </div>
    </div>

    <?php if ($flash): ?>
        <div class="alert alert-warning"><?= e($flash) ?></div>
    <?php endif; ?>

    <div class="row mb-3">
        <div class="col-6 col-md-4 mb-2"><div class="stat"><span class="muted">Accounts</span><b><?= (int)$stats['users'] ?></b></div></div>
        <div class="col-6 col-md-4 mb-2"><div class="stat"><span class="muted">Admins</span><b><?= (int)$stats['admins'] ?></b></div></div>
        <div class="col-12 col-md-4 mb-2"><div class="stat"><span class="muted">Saved games</span><b><?= (int)$stats['saves'] ?></b></div></div>
    </div>

    <div class="card mb-4">
        <div class="card-header font-weight-bold">Create account</div>
        <div class="card-body">
            <form method="post" class="form-row align-items-end">
                <?= Csrf::field() ?>
                <input type="hidden" name="action" value="create">
                <input type="hidden" name="q" value="<?= e($q) ?>">
                <input type="hidden" name="page" value="<?= (int)$page ?>">
                <div class="col-md-3 mb-2">
                    <label class="small muted" for="new-username">Username</label>
                    <input class="form-control" id="new-username" name="username" required pattern="[A-Za-z0-9_]{3,50}">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="small muted" for="new-email">Email</label>
                    <input class="form-control" id="new-email" name="email" type="email" required>
                </div>
                <div class="col-md-3 mb-2">
                    <label class="small muted" for="new-password">Password (8+ characters)</label>
                    <input class="form-control" id="new-password" name="password" type="password" minlength="8" required>
                </div>
                <div class="col-md-2 mb-2">
                    <label class="small muted" for="new-role">Role</label>
                    <select class="form-control" id="new-role" name="role">
                        <option value="player">player</option>
                        <option value="admin">admin</option>
                    </select>
                </div>
                <div class="col-md-1 mb-2">
                    <button class="btn btn-honey btn-block" type="submit">Add</button>
                </div>
            </form>
        </div>
    </div>

    <?php if ($edit): ?>
        <div class="card mb-4">
            <div class="card-header font-weight-bold">Edit user #<?= (int)$edit['id'] ?></div>
            <div class="card-body">
                <form method="post" class="form-row align-items-end">
                    <?= Csrf::field() ?>
                    <input type="hidden" name="action" value="update">
                    <input type="hidden" name="id" value="<?= (int)$edit['id'] ?>">
                    <input type="hidden" name="q" value="<?= e($q) ?>">
                    <input type="hidden" name="page" value="<?= (int)$page ?>">
                    <div class="col-md-4 mb-2">
                        <label class="small muted" for="edit-username">Username</label>
                        <input class="form-control" id="edit-username" name="username" required pattern="[A-Za-z0-9_]{3,50}" value="<?= e($edit['username']) ?>">
                    </div>
                    <div class="col-md-4 mb-2">
                        <label class="small muted" for="edit-email">Email</label>
                        <input class="form-control" id="edit-email" name="email" type="email" required value="<?= e($edit['email']) ?>">
                    </div>
                    <div class="col-md-2 mb-2">
                        <label class="small muted" for="edit-role">Role</label>
                        <select class="form-control" id="edit-role" name="role">
                            <option value="player" <?= $edit['role'] === 'player' ? 'selected' : '' ?>>player</option>
                            <option value="admin" <?= $edit['role'] === 'admin' ? 'selected' : '' ?>>admin</option>
                        </select>
                    </div>
                    <div class="col-md-2 mb-2">
                        <button class="btn btn-honey btn-block" type="submit">Save</button>
                    </div>
                </form>

                <hr class="border-secondary">
                <div class="form-row align-items-end">
                    <form method="post" class="col-md-7 form-row align-items-end">
                        <?= Csrf::field() ?>
                        <input type="hidden" name="action" value="password">
                        <input type="hidden" name="id" value="<?= (int)$edit['id'] ?>">
                        <input type="hidden" name="q" value="<?= e($q) ?>">
                        <input type="hidden" name="page" value="<?= (int)$page ?>">
                        <div class="col-sm-8 mb-2">
                            <label class="small muted" for="reset-password">New password (8+ characters)</label>
                            <input class="form-control" id="reset-password" name="password" type="password" minlength="8" required>
                        </div>
                        <div class="col-sm-4 mb-2">
                            <button class="btn btn-outline-warning btn-block" type="submit">Reset password</button>
                        </div>
                    </form>
                    <div class="col-md-5 mb-2 text-md-right">
                        <form method="post" class="d-inline"
                              data-confirm="Delete every saved game for this account?"
                              data-confirm-title="Reset progress?"
                              data-confirm-ok="Yes, reset"
                              onsubmit="return window.confirmDialog ? confirmDialog.open(this) : confirm('Delete every saved game for this account?');">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="action" value="reset_progress">
                            <input type="hidden" name="id" value="<?= (int)$edit['id'] ?>">
                            <input type="hidden" name="q" value="<?= e($q) ?>">
                            <input type="hidden" name="page" value="<?= (int)$page ?>">
                            <button class="btn btn-outline-warning" type="submit">Reset progress</button>
                        </form>
                        <?php if ((int)$edit['id'] !== (int)$me['id']): ?>
                            <form method="post" class="d-inline"
                                  data-confirm="Delete this account and all of its progress? This cannot be undone."
                                  data-confirm-title="Delete user?"
                                  data-confirm-ok="Delete user"
                                  onsubmit="return window.confirmDialog ? confirmDialog.open(this) : confirm('Delete this account and all of its progress? This cannot be undone.');">
                                <?= Csrf::field() ?>
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="id" value="<?= (int)$edit['id'] ?>">
                                <input type="hidden" name="q" value="<?= e($q) ?>">
                                <input type="hidden" name="page" value="<?= (int)$page ?>">
                                <button class="btn btn-outline-danger" type="submit">Delete user</button>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
            <span class="font-weight-bold">Accounts</span>
            <form method="get" class="form-inline mt-2 mt-sm-0">
                <input class="form-control form-control-sm mr-2" style="width:240px;max-width:100%" name="q" value="<?= e($q) ?>" placeholder="Search username or email">
                <button class="btn btn-sm btn-outline-warning" type="submit">Search</button>
                <?php if ($q !== ''): ?><a class="btn btn-sm btn-link" href="admin.php">Clear</a><?php endif; ?>
            </form>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-sm mb-0">
                <thead>
                <tr>
                    <th>ID</th><th>User</th><th>Role</th><th>Progress</th><th>Joined</th><th>Updated</th><th></th>
                </tr>
                </thead>
                <tbody>
                <?php if (!$result['users']): ?>
                    <tr><td colspan="7" class="text-center muted py-4">No accounts match that search.</td></tr>
                <?php endif; ?>
                <?php foreach ($result['users'] as $u): ?>
                    <tr>
                        <td><?= (int)$u['id'] ?></td>
                        <td>
                            <strong><?= e($u['username']) ?></strong>
                            <div class="small muted"><?= e($u['email']) ?></div>
                        </td>
                        <td><span class="badge <?= ($u['role'] ?? 'player') === 'admin' ? 'badge-admin' : 'badge-player' ?>"><?= e($u['role'] ?? 'player') ?></span></td>
                        <td>
                            <?php if ($u['level'] !== null): ?>
                                Level <?= (int)$u['level'] ?> · <?= number_format((float)$u['honey']) ?> 🍯
                            <?php else: ?>
                                <span class="muted">No save yet</span>
                            <?php endif; ?>
                        </td>
                        <td class="small muted"><?= fmt_date($u['created_at'] ?? null) ?></td>
                        <td class="small muted"><?= fmt_date($u['updated_at'] ?? null) ?></td>
                        <td class="text-right">
                            <a class="btn btn-sm btn-outline-warning" href="admin.php?<?= e(http_build_query(['q' => $q, 'page' => $page, 'edit' => (int)$u['id']])) ?>">Edit</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <div class="card-body d-flex justify-content-between align-items-center">
            <span class="small muted"><?= (int)$result['total'] ?> account(s) · page <?= (int)$page ?> of <?= (int)$pages ?></span>
            <div>
                <?php if ($page > 1): ?><a class="btn btn-sm btn-outline-warning" href="<?= e($link($page - 1)) ?>">Previous</a><?php endif; ?>
                <?php if ($page < $pages): ?><a class="btn btn-sm btn-outline-warning" href="<?= e($link($page + 1)) ?>">Next</a><?php endif; ?>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header font-weight-bold">Recent admin actions</div>
        <div class="table-responsive">
            <table class="table table-sm mb-0">
                <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
                <tbody>
                <?php if (!$audits): ?>
                    <tr><td colspan="5" class="text-center muted py-4">No admin actions recorded yet.</td></tr>
                <?php endif; ?>
                <?php foreach ($audits as $a): ?>
                    <tr>
                        <td class="small muted"><?= fmt_date($a['created_at'] ?? null) ?></td>
                        <td><?= $a['actor_username'] !== null ? e($a['actor_username']) : 'CLI' ?></td>
                        <td><code><?= e($a['action']) ?></code></td>
                        <td><?= e($a['target_username'] ?? ($a['target_user_id'] ? '#' . $a['target_user_id'] : '—')) ?></td>
                        <td class="small muted"><?= e($a['details'] ?? '') ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php include 'includes/confirm-dialog.php'; ?>
</body>
</html>
