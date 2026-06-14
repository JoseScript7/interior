# Simple Login MVC (Node + Express + EJS)

A minimal MVC (Model–View–Controller) login project built with Node.js, Express, and EJS, styled with the Bootstrap "Sign In" example template.


## Folder structure

```
project/
 ├── routes/         → the doorbell (decides who answers)
 │    └── authRoutes.js
 ├── controllers/    → the person who answers (makes decisions)
 │    └── authController.js
 ├── models/         → the filing cabinet (talks to "DB")
 │    └── userModel.js
 ├── views/          → the printed letter you hand back (HTML/EJS)
 │    ├── login.ejs
 │    └── dashboard.ejs
 ├── public/         → static files (Bootstrap CSS/JS, images)
 │    ├── css/
 │    ├── js/
 │    └── assets/brand/
 ├── app.js          → the front door (Express entry point)
 └── package.json
```

## How it works

1. **routes/authRoutes.js** maps URLs to controller functions:
   - `GET /login` → show the sign-in form
   - `POST /login` → process the submitted credentials
   - `GET /dashboard` → protected page shown after login
   - `GET /logout` → destroy the session

2. **controllers/authController.js** handles the request/response logic — it asks the model to validate credentials and decides which view to render.

3. **models/userModel.js** holds an in-memory array of users (`email` + plain-text `password`) and exposes a `validateUser(email, password)` helper. Replace this with a real database call when you're ready.

4. **views/** contains the EJS templates (the Bootstrap sign-in page and a simple dashboard).

5. **app.js** wires everything together: sets up the EJS view engine, serves static files from `public/`, configures `express-session` for login state, and mounts the routes.

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

## Test login credentials

| Email               | Password    |
|---------------------|-------------|
| Thiru@example.com   | Thiru@3106  |
| test@example.com    | test123     |


