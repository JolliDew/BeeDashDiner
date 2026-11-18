<?php
// HTML fragment injected by Mainmenu.js when the player presses "Play Game".
require_once __DIR__ . '/src/Auth.php';
$userId = Auth::requireLogin(true);
$devMode = true; // set to false for release: hides the 🛠 dev tools
$cssV = fn(string $file): int => max(1, @filemtime(__DIR__ . '/' . $file) ?: 1);

// The injected game markup and its styles must never come from an old cache.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
?>
<link rel="stylesheet" href="css/bee-game.css?v=<?= $cssV('css/bee-game.css') ?>">
<link rel="stylesheet" href="css/bee-modals.css?v=<?= $cssV('css/bee-modals.css') ?>">
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
                        <div class="sound-wrap">
                            <button id="soundbtn" class="sound-btn" type="button" title="Audio settings" aria-label="Audio settings" aria-haspopup="dialog" aria-expanded="false" aria-controls="audio-menu" aria-pressed="true">🔊</button>
                            <div id="audio-menu" class="audio-menu" role="dialog" aria-label="Audio settings" hidden>
                                <button type="button" class="audio-row" data-audio="sfx" aria-pressed="true"><span>Sound effects</span><span class="state">On</span></button>
                                <button type="button" class="audio-row" data-audio="music" aria-pressed="true"><span>Music</span><span class="state">On</span></button>
                            </div>
                        </div>
                        <button id="devbtn" type="button" title="Dev mode" aria-label="Toggle developer tools" hidden>🛠</button>
                        <button class="menu-btn exit-btn" type="button" onclick="returnToMenu()" title="Exit to main menu" aria-label="Exit to main menu">
                            <span aria-hidden="true">🚪</span>
                        </button>
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
