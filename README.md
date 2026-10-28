# ShopEase: Full Stack E-commerce Application

Tech stack: Java 17, Spring Boot 3, Spring Security + JWT, Spring Data JPA, MySQL, React JS, JavaScript, Axios, Bootstrap, Git.

## Features
- User registration and login with JWT authentication
- Role-based access (ROLE_USER, ROLE_ADMIN)
- Product listing with search
- Cart and order placement with stock check
- My Orders history
- Admin panel: add, edit, delete products

## Project structure
```
ShopEase/
  backend/    Spring Boot REST API (Controller, Repository, Model, Security layers)
  frontend/   React JS app (Vite)
```

## Run the backend
1. Install Java 17, Maven and MySQL.
2. Open `backend/src/main/resources/application.properties` and set your MySQL username and password.
   The `shopease` database is created automatically.
3. Run:
   ```
   cd backend
   mvn spring-boot:run
   ```
   API runs at http://localhost:8080

## Run the frontend
1. Install Node.js 18+.
2. Run:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   App runs at http://localhost:5173

## Default admin login
- Email: admin@shopease.com
- Password: admin123

(6 sample products are added automatically on first run.)

## REST API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/products?q=term | Public |
| GET | /api/products/{id} | Public |
| POST / PUT / DELETE | /api/products | Admin |
| POST | /api/orders | Logged in |
| GET | /api/orders | Logged in |

## Push to GitHub
```
git init
git add .
git commit -m "ShopEase full stack e-commerce app"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
