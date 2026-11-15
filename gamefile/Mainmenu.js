let currentGame = null;

function startGame() {
    // Fetch the in-game.php markup, inject it, then boot the OOP game (js/main.js)
    fetch('in-game.php', { credentials: 'same-origin' })
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
        });
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
