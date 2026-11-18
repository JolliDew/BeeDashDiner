<?php
// HTML fragment injected by Mainmenu.js when the player presses "Play Game".
require_once __DIR__ . '/src/Auth.php';
$userId = Auth::requireLogin(true);
$devMode = true; // set to false for release: hides the 🛠 dev tools
?>
<link rel="stylesheet" href="css/bee-game.css">
<link rel="stylesheet" href="css/bee-modals.css">
<div class="game-screen" id="bee-game" data-dev="<?= $devMode ? '1' : '0' ?>" data-user="<?= (int)$userId ?>">
    <div class="game-canvas-area">
        <div class="bee-app">
            <div class="game-hud">
                <div class="hud-top">
                    <div class="hud-stats">
                        <span class="hud-item" id="hud-honey">🍯 0</span>
                        <span class="hud-item" id="hud-diamonds">💎 0</span>
                        <span class="hud-item" id="hud-queue">🪑 0/4</span>
                    </div>
                    <div class="hud-actions">
                        <button id="devbtn" title="Dev mode" hidden>🛠</button>
                        <button class="menu-btn exit-btn" onclick="returnToMenu()">Exit</button>
                    </div>
                </div>
                <div class="hud-sub">
                    <span id="hud-location"></span>
                    <span id="hud-save" aria-live="polite">Loading…</span>
                </div>
            </div>
            <div id="dev" hidden></div>
            <div id="scene"></div>
            <div id="panel"></div>
        </div>
    </div>
    <div id="toasts" aria-live="polite"></div>
</div>
