/* Shared confirmation dialog.
 *
 * A form opts in with data-confirm="message" (and optionally
 * data-confirm-title / data-confirm-ok). Clicking its submit button opens this
 * styled dialog instead of the browser's native confirm().
 *
 * The form's own onsubmit still falls back to confirm() when this script is
 * not available, so a destructive action can never be submitted without a
 * confirmation. When this script is present it returns false to stop the
 * browser's own submit; the dialog's "confirm" button then submits the form.
 */
(function () {
    'use strict';

    var overlay = null;
    var titleEl = null;
    var msgEl = null;
    var okBtn = null;
    var cancelBtn = null;
    var pendingForm = null;
    var lastFocus = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function init() {
        overlay = byId('cd-overlay');
        if (!overlay) return; // No dialog on this page; open() falls back to confirm().
        titleEl = byId('cd-title');
        msgEl = byId('cd-msg');
        okBtn = byId('cd-ok');
        cancelBtn = byId('cd-cancel');

        cancelBtn.addEventListener('click', close);
        okBtn.addEventListener('click', confirm);
        // A click on the dim backdrop (but not inside the box) cancels.
        overlay.addEventListener('mousedown', function (e) {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', onKey);
    }

    /** Visible, enabled controls inside the dialog, in tab order. */
    function focusables() {
        var nodes = overlay.querySelectorAll('button, [href], input, select, textarea');
        return Array.prototype.filter.call(nodes, function (node) {
            return !node.disabled && node.offsetParent !== null;
        });
    }

    function onKey(e) {
        if (!overlay.classList.contains('is-open')) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        // Keep Tab inside the dialog.
        var list = focusables();
        if (!list.length) return;
        var first = list[0];
        var last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    /** Called from the form's onsubmit. Returning false blocks the submission. */
    function open(form) {
        var message = (form && form.getAttribute('data-confirm')) || 'Are you sure?';
        // No dialog markup on this page: use the browser's own confirm.
        if (!overlay) return window.confirm(message);

        titleEl.textContent = (form.getAttribute('data-confirm-title')) || 'Please confirm';
        msgEl.textContent = message;
        okBtn.textContent = (form.getAttribute('data-confirm-ok')) || 'Confirm';
        var tone = form.getAttribute('data-confirm-tone') === 'normal' ? 'cancel' : 'danger';
        okBtn.className = 'cd-btn cd-btn-' + tone;

        pendingForm = form;
        lastFocus = document.activeElement;

        overlay.classList.add('is-open');
        document.body.classList.add('cd-open');
        // Focus Cancel, the safe choice, so a held Enter cannot re-confirm.
        cancelBtn.focus();
        return false;
    }

    function restore() {
        overlay.classList.remove('is-open');
        document.body.classList.remove('cd-open');
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        lastFocus = null;
        pendingForm = null;
    }

    function close() {
        restore();
    }

    function confirm() {
        var form = pendingForm;
        restore();
        // form.submit() skips the inline onsubmit, so we do not reopen this dialog.
        if (form) form.submit();
    }

    window.confirmDialog = {
        open: open,
        close: close
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
