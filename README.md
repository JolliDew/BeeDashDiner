# 🍳 JolliDew (BeeDashDiner)

> A web-based cooking game featuring a secure user authentication system and an interactive main menu dashboard.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** PHP (PHP PDO)
* **Database:** Supabase (PostgreSQL)
* **Server Environment:** XAMPP (Apache)
* **Version Control:** Git & GitHub

---

## 📁 Project Structure

```text
JolliDew/
│
├── LoginSystem/               # User Authentication Module
│   ├── db.php                 # Database connection (Supabase PostgreSQL via PDO)
│   ├── login.php              # User login handling & interface
│   ├── register.php           # User registration handling & interface
│   ├── google-login.php       # Google OAuth login integration
│   ├── logout.php             # Session destruction & logout handler
│   ├── login_db.sql           # SQL schema backup
│   └── logindesign.css        # Styling for authentication pages
│
└── Mainmenu/                  # Main Game Dashboard
    ├── Mainmenu.php           # Main menu view
    ├── Mainmenu.js            # Interactive dashboard scripts
    └── Mainmenu.css           # Styling for the main dashboard
