# Full-Stack Login MVC + REST API (Node + Express + SQLite + JWT)

A secure, MVC-architected login project built with Node.js, Express, and EJS, styled with Bootstrap. 

This project supports both **traditional browser form flows** (server-side rendering) and **REST API flows** simultaneously. It uses SQLite for persistence, bcrypt for password hashing, and JWTs for authentication.

## Features

- **Dual-Mode Auth**: Supports both cookie-based JWT authentication (for browsers) and `Authorization: Bearer` headers (for REST API/Mobile clients).
- **SQLite Persistence**: Uses `better-sqlite3` for fast, synchronous database access without requiring a separate database server.
- **Security**: Passwords hashed with `bcryptjs`.
- **Role-Based Access Control (RBAC)**: Includes middleware to protect routes based on user roles (`admin` vs `user`).
- **REST API Endpoints**: Fully functional JSON API for registering, logging in, fetching profiles, and admin tasks.
- **MVC Architecture**: Clean separation of Models, Views, and Controllers.

## Folder structure

```
project/
 ├── database.js     → SQLite database initialization and seeding
 ├── middleware/     → Custom Express middleware
 │    └── authMiddleware.js (JWT validation & RBAC)
 ├── routes/         → The doorbell (decides who answers)
 │    └── authRoutes.js
 ├── controllers/    → The person who answers (makes decisions)
 │    └── authController.js
 ├── models/         → The filing cabinet (talks to "DB")
 │    └── userModel.js
 ├── views/          → The printed letter you hand back (HTML/EJS)
 │    ├── login.ejs
 │    ├── register.ejs
 │    └── dashboard.ejs
 ├── public/         → Static files (Bootstrap CSS/JS, images)
 ├── app.js          → The front door (Express entry point)
 └── package.json
```

## How it works

1. **`database.js`**: Initializes an SQLite file (`database.sqlite`) and creates the `users` table. Automatically seeds an admin account on the first run.
2. **`models/userModel.js`**: Handles SQLite database queries (`INSERT`, `SELECT`) and uses `bcrypt` to compare password hashes.
3. **`middleware/authMiddleware.js`**: Extracts JWTs from either cookies or HTTP headers. Verifies the token and attaches user data to the request. Also contains the `authorizeRole` middleware for RBAC.
4. **`controllers/authController.js`**: Fully async handlers that process logic, sign JWTs, and determine whether to render an EJS view or return raw JSON based on the route.
5. **`routes/authRoutes.js`**: Maps URLs to controller functions. Combines public routes, protected routes, REST APIs, and RBAC admin routes.
6. **`app.js`**: Wires up the Express server, `cookie-parser`, JSON parsers, EJS engine, and a global async error handler.

## Setup & run

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# (optional) run with auto-reload during development
npm run dev
```

Then open: **http://localhost:3000**

## Default Admin Credentials

On the first run, the database automatically seeds an admin user. You can use this to test the system:

| Email               | Password    | Role  |
|---------------------|-------------|-------|
| admin@example.com   | Admin@123   | admin |

## REST API Documentation

You can test these using tools like Postman:

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/api/register` | No | - | Register a new user. Body: `{ "name", "email", "password" }` |
| POST | `/api/login` | No | - | Login to receive a JWT. Body: `{ "email", "password" }` |
| GET | `/api/profile` | Yes (JWT) | - | Returns the currently authenticated user's profile |
| GET | `/api/admin/users`| Yes (JWT) | Admin | Returns a list of all users in the system |

*Note: For protected API routes, include the JWT in the `Authorization` header as `Bearer <token>`.*
