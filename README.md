# 3-Tier Attendance Tracking Web Application

## 1. About This 3-Tier Web App

This is a 3-tier web application for attendance tracking with the following layers:

- **Frontend:** React-based user interface for students and admins to login/signup, mark attendance, and view attendance reports.
- **Backend:** Go (Golang) REST API server handling authentication, attendance data management, and business logic.
- **Database:** MySQL database storing user credentials, roles, and attendance records.

### How It Functions

- Users can **signup** as students (default role).
- Users can **login** with their credentials.
- **Students** can mark their attendance with status (Present, Absent, Late).
- **Admins** can view attendance reports for all students.
- The frontend communicates with the backend API to fetch and update data.
- User sessions are persisted in the browser's localStorage to maintain login state across reloads.

---

## 2. Setting Up the Frontend

### Required Tools

- Node.js (v14 or above recommended)
- npm (comes with Node.js)
- A modern web browser (Chrome, Firefox, Edge, etc.)

### Setup Instructions (Local & EC2)

1. Clone the repository or copy the frontend folder to your local machine or EC2 instance.
2. Navigate to the `frontend` directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. The app will be available at `http://localhost:3000` (or the EC2 public IP with port 3000 if configured).

---

## 3. Setting Up the Backend

### Required Tools

- Go (Golang) 1.18 or above
- MySQL server running and accessible
- Git (optional, for cloning repo)

### Setup Instructions (Local & EC2)

1. Clone the repository or copy the backend folder to your local machine or EC2 instance.
2. Update the MySQL DSN (Data Source Name) in `backend/main.go` with your MySQL credentials and host:

   ```go
   dsn := "username:password@tcp(host:3306)/attendance_db"
   ```

3. Install Go dependencies:

   ```bash
   go mod tidy
   ```

4. Build and run the backend server:

   ```bash
   go run main.go
   ```

5. The backend API will be available at `http://localhost:8080` (or the EC2 public IP with port 8080 if configured).

---

## 4. Setting Up the Database

### Required Databases and Tables

- Database: `attendance_db`

### Creating the Database and Tables

1. Connect to your MySQL server:

   ```bash
   mysql -u your_user -p
   ```

2. Create the database:

   ```sql
   CREATE DATABASE attendance_db;
   USE attendance_db;
   ```

3. Create the `users` table:

   ```sql
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(255) NOT NULL UNIQUE,
     email VARCHAR(255) NOT NULL UNIQUE,
     password_hash VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL DEFAULT 'student'
   );
   ```

4. Create the `attendance` table:

   ```sql
   CREATE TABLE attendance (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     date DATE NOT NULL,
     status VARCHAR(50) NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

---

## Additional Notes

- Ensure your MySQL server allows remote connections if backend and database are on different machines.
- Adjust CORS settings in `backend/main.go` if frontend and backend are hosted on different domains.
- For production deployment, consider securing API endpoints with proper authentication tokens (e.g., JWT).
- This app currently uses simple session persistence via localStorage; enhance security as needed.

---

## Contact

For any issues or questions, please contact the developer:

- LinkedIn: https://www.linkedin.com/in/vamsi-pithani-74708b34a
- GitHub: https://github.com/vamsi-pithani
