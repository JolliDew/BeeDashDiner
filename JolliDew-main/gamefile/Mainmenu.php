<?php
session_start();
// If the user hasn't logged in, redirect them back to the login page
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JolliDew - Game</title>
    <!-- Bootstrap first so Mainmenu.css wins any clash. The game modals need Bootstrap 4 + jQuery. -->
    <link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="Mainmenu.css">
</head>
<body>

    <!-- Main Menu Screen -->
    <div id="main-menu" class="menu-container">
        <h1 class="game-title">BeeDashDiner</h1>
        
        <?php 
            $playerName = isset($_SESSION['username']) ? $_SESSION['username'] : "Player";
            echo "<p class='welcome-text'>Welcome back, <strong>" . htmlspecialchars($playerName) . "</strong>!</p>";
        ?>

        <div class="menu-buttons">
            <button class="menu-btn play-btn" onclick="startGame()">Play Game</button>
            <a href="logout.php" class="menu-btn quit-btn" style="text-decoration: none; display: inline-block;">Log Out</a>
        </div>
    </div>

    <!-- Link to your JavaScript file -->
    <script src="vendor/jquery/jquery.min.js"></script>
    <script src="vendor/bootstrap/bootstrap.bundle.min.js"></script>
    <script src="Mainmenu.js"></script>
</body>
</html>