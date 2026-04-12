# CCS Backend — Express.js + MySQL

## Setup

### 1. Create the database
Run the schema in MySQL (phpMyAdmin, MySQL Workbench, or CLI):
```
mysql -u root -p < src/config/schema.sql
```

### 2. Configure environment
Edit `backend/.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        ← your MySQL password
DB_NAME=ccs_db
JWT_SECRET=ccs_super_secret_2026
```

### 3. Install dependencies
```
npm install
```

### 4. Seed sample data
```
npm run seed
```

### 5. Start the server
```
npm run dev      # development (auto-restart)
npm start        # production
```

Server runs at **http://localhost:5000**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/students | List students (supports ?search=&program=&yearLevel=&skill=&gender=) |
| GET | /api/students/stats | Student stats |
| GET | /api/students/:id | Get student |
| POST | /api/students | Create student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |
| GET | /api/faculty | List faculty |
| POST | /api/faculty | Create faculty |
| PUT | /api/faculty/:id | Update faculty |
| DELETE | /api/faculty/:id | Delete faculty |
| GET | /api/events | List events |
| POST | /api/events | Create event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| GET | /api/research | List research (supports ?year=&program=) |
| POST | /api/research | Create research |
| DELETE | /api/research/:id | Delete research |
| GET | /api/rooms | List rooms |
| POST | /api/rooms | Create room |
| PUT | /api/rooms/:id | Update room |
| DELETE | /api/rooms/:id | Delete room |
| GET | /api/schedules | List schedules (with joins) |
| POST | /api/schedules | Create schedule |
| DELETE | /api/schedules/:id | Delete schedule |
| GET | /api/materials | List materials |
| POST | /api/materials | Create material |
| DELETE | /api/materials/:id | Delete material |
