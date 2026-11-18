let currentGame = null;
let starting = false;

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
    starting = true;

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
            document.getElementById('main-menu').style.display = 'none';

            const gameContainer = document.createElement('div');
            gameContainer.id = 'game-container-wrapper';
            gameContainer.style.cssText = 'position:fixed;inset:0;';
            gameContainer.innerHTML = html;
            document.body.appendChild(gameContainer);

            return import('./js/main.js').then(m => m.launch(gameContainer.querySelector('#bee-game')));
        })
        .then(game => { currentGame = game; })
        .catch(error => {
            console.error('Error loading game:', error);
            returnToMenu();
            // Show the reason instead of silently bouncing back to the menu
            if (error && error.message !== 'Login required') {
                showMenuError('Could not start the game: ' + error.message + ' (see the browser console, F12, for details)');
            }
        })
        .finally(() => { starting = false; });
}

function returnToMenu() {
    if (currentGame) {
        currentGame.destroy(); // stops the loop and saves
        currentGame = null;
    }
    const gameContainer = document.getElementById('game-container-wrapper');
    if (gameContainer) {
        gameContainer.remove();
    }
    document.getElementById('main-menu').style.display = 'block';
}

function quitGame() {
    if (confirm("Are you sure you want to quit?")) {
        window.close();
    }
}
