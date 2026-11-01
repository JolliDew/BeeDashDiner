<<<<<<< HEAD
function startGame() {
    // Fetch from the ingame folder relative to Mainmenu.php
    fetch('../ingame/game.php') // Adjust 'game.php' to whatever your actual ingame file name is
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Hide the main menu
            document.getElementById('main-menu').style.display = 'none';
            
            // Inject the in-game UI into the body
            const gameContainer = document.createElement('div');
            gameContainer.id = 'game-container-wrapper';
            gameContainer.innerHTML = html;
            document.body.appendChild(gameContainer);
            
            console.log("Game started successfully!");
        })
        .catch(error => console.error('Error loading game:', error));
}

function returnToMenu() {
    // Remove the injected game UI container
    const gameContainer = document.getElementById('game-container-wrapper');
    if (gameContainer) {
        gameContainer.remove();
    }
    // Show the main menu again
    document.getElementById('main-menu').style.display = 'block';
}

function quitGame() {
    if (confirm("Are you sure you want to quit?")) {
        window.location.href = "../LoginSystem/logout.php";
    }
=======
function startGame() {
    // Fetch the in-game.php content dynamically
    fetch('in-game.php')
        .then(response => response.text())
        .then(html => {
            // Hide the main menu
            document.getElementById('main-menu').style.display = 'none';
            
            // Inject the in-game UI into the body
            const gameContainer = document.createElement('div');
            gameContainer.id = 'game-container-wrapper';
            gameContainer.innerHTML = html;
            document.body.appendChild(gameContainer);
            
            console.log("Game started via in-game.php!");
        })
        .catch(error => console.error('Error loading game:', error));
}

function returnToMenu() {
    // Remove the injected game UI container
    const gameContainer = document.getElementById('game-container-wrapper');
    if (gameContainer) {
        gameContainer.remove();
    }
    // Show the main menu again
    document.getElementById('main-menu').style.display = 'block';
}

function quitGame() {
    if (confirm("Are you sure you want to quit?")) {
        window.close();
    }
>>>>>>> 34b31a7b8664b5df7dd166804c984880f1465f09
}