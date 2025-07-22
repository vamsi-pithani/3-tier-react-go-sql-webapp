package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/rs/cors"
)

type Attendance struct {
	ID     int    `json:"id"`
	UserID int    `json:"user_id"`
	Date   string `json:"date"`
	Status string `json:"status"`
}

type User struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	Password     string `json:"password,omitempty"`
	PasswordHash string `json:"-"`
	Role         string `json:"role"`
}

var db *sql.DB

func main() {
	var err error
	// Update the DSN with your MySQL credentials
	dsn := "vamsi:Vamsi@1996!@tcp(13.126.217.8:3306)/attendance_db"
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Cannot reach database: ", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/attendance", attendanceHandler)
	mux.HandleFunc("/signup", signupHandler)
	mux.HandleFunc("/login", loginHandler)

	// Use rs/cors middleware to handle CORS
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://13.233.223.68", "http://localhost:3000"}, // Add your frontend origins here
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(mux)

	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func attendanceHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		var att Attendance
		err := json.NewDecoder(r.Body).Decode(&att)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}
		// Check if user is a student before allowing attendance marking
		var role string
		err = db.QueryRow("SELECT role FROM users WHERE id = ?", att.UserID).Scan(&role)
		if err != nil {
			log.Printf("Error fetching user role: %v", err)
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		}
		if role != "student" {
			http.Error(w, "Only students can mark attendance", http.StatusForbidden)
			return
		}
		att.Date = time.Now().Format("2006-01-02")
		_, err = db.Exec("INSERT INTO attendance (user_id, date, status) VALUES (?, ?, ?)", att.UserID, att.Date, att.Status)
		if err != nil {
			log.Printf("Error inserting attendance: %v", err)
			http.Error(w, "Failed to insert attendance", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Attendance marked"})
	case "GET":
		// Admin endpoint to get attendance reports per student
		studentID := r.URL.Query().Get("student_id")
		if studentID != "" {
			// Verify requester is admin (for simplicity, skipping auth here)
			rows, err := db.Query(`
				SELECT a.id, a.user_id, u.username, a.date, a.status
				FROM attendance a
				JOIN users u ON a.user_id = u.id
				WHERE a.user_id = ?
			`, studentID)
			if err != nil {
				http.Error(w, "Failed to fetch attendance", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			type AttendanceWithUsername struct {
				ID       int    `json:"id"`
				UserID   int    `json:"user_id"`
				Username string `json:"username"`
				Date     string `json:"date"`
				Status   string `json:"status"`
			}

			var records []AttendanceWithUsername
			for rows.Next() {
				var att AttendanceWithUsername
				err := rows.Scan(&att.ID, &att.UserID, &att.Username, &att.Date, &att.Status)
				if err != nil {
					http.Error(w, "Error scanning records", http.StatusInternalServerError)
					return
				}
				records = append(records, att)
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(records)
			return
		}
		// If no student_id param, return all attendance records (could restrict to admin)
		rows, err := db.Query(`
			SELECT a.id, a.user_id, u.username, a.date, a.status
			FROM attendance a
			JOIN users u ON a.user_id = u.id
		`)
		if err != nil {
			http.Error(w, "Failed to fetch attendance", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type AttendanceWithUsername struct {
			ID       int    `json:"id"`
			UserID   int    `json:"user_id"`
			Username string `json:"username"`
			Date     string `json:"date"`
			Status   string `json:"status"`
		}

		var records []AttendanceWithUsername
		for rows.Next() {
			var att AttendanceWithUsername
			err := rows.Scan(&att.ID, &att.UserID, &att.Username, &att.Date, &att.Status)
			if err != nil {
				http.Error(w, "Error scanning records", http.StatusInternalServerError)
				return
			}
			records = append(records, att)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(records)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var user User
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	err = json.Unmarshal(body, &user)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if user.Username == "" || user.Password == "" || user.Email == "" {
		http.Error(w, "Username, email and password required", http.StatusBadRequest)
		return
	}
	if user.Role == "" {
		user.Role = "student"
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error processing password", http.StatusInternalServerError)
		return
	}
	_, err = db.Exec("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)", user.Username, user.Email, string(hashedPassword), user.Role)
	if err != nil {
		log.Printf("Error inserting user: %v", err)
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var user User
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	err = json.Unmarshal(body, &user)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if user.Username == "" || user.Password == "" {
		http.Error(w, "Username and password required", http.StatusBadRequest)
		return
	}
	var storedHash, role, email, username string
	var id int
	err = db.QueryRow("SELECT id, password_hash, role, email, username FROM users WHERE username = ?", user.Username).Scan(&id, &storedHash, &role, &email, &username)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusUnauthorized)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Login successful", "role": role, "userId": id, "email": email, "username": username})
}

