<?php
/**
 * Shared confirmation dialog.
 *
 * Include this once, just before </body>, on any page with destructive forms.
 * A form opts in with data-confirm="message" (optionally data-confirm-title and
 * data-confirm-ok). The form keeps its native confirm() onsubmit as a fallback
 * for when JavaScript is unavailable, so the action is never left unguarded.
 *
 * css/confirm-dialog.css and js/confirm-dialog.js are versioned by file time so
 * an updated file is never served from an old cache.
 */
if (defined('CONFIRM_DIALOG_RENDERED')) {
    return;
}
define('CONFIRM_DIALOG_RENDERED', true);

$cdCssV = @filemtime(__DIR__ . '/../css/confirm-dialog.css') ?: 1;
$cdJsV  = @filemtime(__DIR__ . '/../js/confirm-dialog.js') ?: 1;
?>
<link rel="stylesheet" href="css/confirm-dialog.css?v=<?= $cdCssV ?>">
<div class="cd-overlay" id="cd-overlay">
    <div class="cd-box" role="dialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-msg">
        <h2 class="cd-title" id="cd-title">Please confirm</h2>
        <p class="cd-msg" id="cd-msg"></p>
        <div class="cd-actions">
            <button type="button" class="cd-btn cd-btn-cancel" id="cd-cancel">Cancel</button>
            <button type="button" class="cd-btn cd-btn-danger" id="cd-ok">Confirm</button>
        </div>
    </div>
</div>
<script src="js/confirm-dialog.js?v=<?= $cdJsV ?>"></script>
