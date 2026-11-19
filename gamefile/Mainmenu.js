let currentGame = null;
let starting = false;
// Every start attempt gets a number. Leaving the game cancels the attempt,
// so a game that finishes loading after the player already left is destroyed
// instead of running in the background with listeners and an autosave timer.
let startToken = 0;

/** Create/resume the shared AudioContext inside the Play click gesture. */
function unlockAudio() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!window.__jolliAudioCtx) window.__jolliAudioCtx = new Ctx();
        if (window.__jolliAudioCtx.state === 'suspended') window.__jolliAudioCtx.resume();
    } catch (e) { /* audio is optional */ }
}

function showMenuError(message) {
    let el = document.getElementById('menu-error');
    if (!el) {
        el = document.createElement('p');
        el.id = 'menu-error';
        el.style.cssText = 'margin-top:14px;color:#ff8a8a;font-size:.9rem;';
        document.querySelector('.menu-buttons').after(el);
    }
    el.textContent = message;
}

function startGame() {
    // A fast double-click must not create two game loops.
    if (starting || currentGame) return;
    unlockAudio();
    starting = true;
    const token = ++startToken;
    const siteNav = document.querySelector('.site-nav');
    if (siteNav) siteNav.style.display = 'none';

    const old = document.getElementById('menu-error');
    if (old) old.textContent = '';

    // Fetch the in-game.php markup, inject it, then boot the OOP game (js/main.js)
    fetch('in-game.php', { credentials: 'same-origin', cache: 'no-store' })
        .then(response => {
            if (response.status === 401) {
                window.location.href = 'login.php';
                throw new Error('Login required');
            }
            return response.text();
        })
        .then(html => {
            // The player left while the page was loading: drop the markup.
            if (token !== startToken) return null;
            document.getElementById('main-menu').style.display = 'none';

            const gameContainer = document.createElement('div');
            gameContainer.id = 'game-container-wrapper';
            gameContainer.style.cssText = 'position:fixed;inset:0;';
            gameContainer.innerHTML = html;
            document.body.appendChild(gameContainer);

            return import('./js/main.js').then(m => m.launch(gameContainer.querySelector('#bee-game')));
        })
        .then(game => {
            if (!game) return;
            // The game finished loading after the player pressed Exit.
            if (token !== startToken) { game.destroy(); return; }
            currentGame = game;
        })
        .catch(error => {
            console.error('Error loading game:', error);
            returnToMenu();
            // Show the reason instead of silently bouncing back to the menu
            if (error && error.message !== 'Login required') {
                showMenuError('Could not start the game: ' + error.message + ' (see the browser console, F12, for details)');
            }
        })
        .finally(() => { if (token === startToken) starting = false; });
}

function returnToMenu() {
    // Cancel a start that is still loading so it cannot revive itself later.
    startToken++;
    starting = false;
    if (currentGame) {
        const pending = currentGame.destroy(); // stops the loop and saves
        currentGame = null;
        // Tell the player when the last change could not be stored.
        if (pending && typeof pending.then === 'function') {
            pending.then(ok => {
                if (!ok) showMenuError('Your last change could not be saved. Check your connection and play again.');
            });
        }
    }
    const gameContainer = document.getElementById('game-container-wrapper');
    if (gameContainer) {
        gameContainer.remove();
    }
    document.getElementById('main-menu').style.display = 'block';
    const siteNav = document.querySelector('.site-nav');
    if (siteNav) siteNav.style.display = '';
}
