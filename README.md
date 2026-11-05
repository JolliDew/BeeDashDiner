# 🍳 JolliDew (BeeDashDiner)

A web-based cooking and restaurant management game featuring an object-oriented frontend, secure PHP backend handlers, and Supabase (PostgreSQL) data persistence.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Modular OOP Architecture)
- **Backend:** PHP (PDO, Session-based Authentication)
- **Database:** Supabase (PostgreSQL) / MySQL schema support
- **Environment:** XAMPP (Apache)
- **Version Control:** Git & GitHub

---

## 📁 Project Structure (`gamefile/`)

```text
gamefile/
├── Mainmenu.php               # User dashboard & main menu interface
├── Mainmenu.css               # Dashboard styling
├── Mainmenu.js                # Menu scripts and game launcher
├── in-game.php                # Game screen markup container
├── api.php                    # REST API endpoint for save states & load requests
├── login.php                  # User login (Username/Email + Google OAuth)
├── register.php               # Account creation and password hashing
├── logout.php                 # Session destruction handler
├── login_db.sql               # Database schema setup (users, progress, stations, items)
├── logindesign.css            # Styling for authentication views
│
├── css/
│   └── bee-game.css           # Scoped game UI and kitchen styles
│
├── js/
│   ├── main.js                # Game bootstrapper
│   ├── Game.js                # Core game loop and state controller
│   ├── GameState.js           # Station models and state parser
│   ├── Economy.js             # Pricing, cook times, and balancing logic
│   ├── Scene.js               # Restaurant scene, entities, and customer queue
│   ├── UpgradePanel.js        # Dynamic station and bee upgrade management
│   ├── DevTools.js            # Developer debugging and test overlay
│   └── SaveService.js         # Local storage and server autosave service
│
└── src/
    ├── Auth.php               # Session & authentication guards
    ├── SaveRepository.php     # Data mapper for player progress and stations
    ├── ApiController.php      # Request dispatcher for game save endpoints
    └── google-config.php      # Google OAuth credentials template
