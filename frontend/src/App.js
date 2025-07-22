import React, { useState, useEffect } from 'react';

function App() {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('Present');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Restore login state from localStorage on app load
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn');

    if (storedIsLoggedIn === 'true' && storedUserId && storedUsername && storedEmail && storedRole) {
      setUserId(parseInt(storedUserId, 10));
      setUsername(storedUsername);
      setEmail(storedEmail);
      setRole(storedRole);
      setIsLoggedIn(true);
    }
  }, []);

  const fetchAttendance = async () => {
    try {
      let url = 'http://localhost:8080/attendance'; // Change this to your EC2 backend IP or domain in production
      if (role === 'admin' && userId) {
        // Admin can view attendance per student - for demo, fetch all records
        // Could add UI to select student
      } else if (role === 'student' && userId) {
        url += `?student_id=${userId}`;
      }
      console.log('Fetching attendance from URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch attendance:', response.statusText);
        setAttendanceRecords([]);
        return;
      }
      const data = await response.json();
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceRecords([]);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAttendance();
    }
  }, [isLoggedIn, role, userId]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      alert('Please enter username, email and password');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role: 'student' })
      });
      if (response.ok) {
        alert('Signup successful. Please login.');
        setIsSignup(false);
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        const data = await response.json();
        alert('Signup failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during signup:', error);
      alert('Error during signup');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      alert('Please enter username and password');
      return;
    }
    // Hardcoded test user for local login without API
    if (loginUsername === 'testuser' && loginPassword === 'testpass') {
      alert('Login successful (test user)');
      setIsLoggedIn(true);
      setUserId(1); // example user ID
      setRole('student');
      setLoginUsername('');
      setLoginPassword('');
      // Save to localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '1');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('email', '');
      localStorage.setItem('role', 'student');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
    if (response.ok) {
      const data = await response.json();
      alert('Login successful');
      setIsLoggedIn(true);
      setUserId(data.userId); // Use userId from backend
      setUsername(data.username || ''); // Set username from backend
      setEmail(data.email || ''); // Set email from backend
      setRole(data.role || '');
      setLoginUsername('');
      setLoginPassword('');
      // Save to localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', data.userId.toString());
      localStorage.setItem('username', data.username || '');
      localStorage.setItem('email', data.email || '');
      localStorage.setItem('role', data.role || '');
    } else {
      alert('Login failed: Invalid username or password');
    }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Error during login');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setRole('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('Please login to mark attendance');
      return;
    }
    if (role !== 'student') {
      alert('Only students can mark attendance');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, status })
      });
      if (response.ok) {
        alert('Attendance marked successfully');
        fetchAttendance();
      } else {
        alert('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance');
    }
  };

  console.log('UserId:', userId, 'Email:', email);
  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: !isLoggedIn ? (isSignup ? 'right' : 'left') : 'center', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <h1 style={{ whiteSpace: 'nowrap' }}>
        Welcome to Attendance Tracking system
      </h1>
      {isLoggedIn && (
        <div style={{ position: 'fixed', top: 10, left: 10, fontWeight: 'bold' }}>
          Username: {username || 'N/A'} | Email: {email}
        </div>
      )}
      {!isLoggedIn ? (
        isSignup ? (
          <form onSubmit={handleSignup} style={{ marginBottom: 20, backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', padding: 20, borderRadius: 8, color: 'white' }}>
            <h2>Signup</h2>
            <div>
              <label>Username: </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Email: </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Signup</button>
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsSignup(false)}>
                Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ marginBottom: 20, backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', padding: 20, borderRadius: 8, color: 'white' }}>
            <h2>Login</h2>
            <div>
              <label>Username: </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={() => setIsSignup(true)}>
                Signup
              </button>
            </p>
          </form>
        )
      ) : role === 'student' ? (
        <>
          <button onClick={handleLogout} style={{ position: 'fixed', top: 10, right: 10, backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white">
              <path d="M10.09 15.59L8.67 14.17 11.83 11H3v-2h8.83L8.67 6.83 10.09 5.41 15.67 11zM19 19h-6v-2h6v-2h-6v-2h6v-2h-6V7h6v12z"/>
            </svg>
            Logout
          </button>
          <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <div>
              <label>Status: </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <br />
            <button
              type="submit"
              style={{
                backgroundColor:
                  status === 'Present' ? 'green' : status === 'Absent' ? 'red' : 'black',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Mark Attendance
            </button>
          </form>

          <h2>Attendance Records</h2>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
          <table border="1" cellPadding="5" cellSpacing="0" width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.username}</td>
                  <td>{record.date}</td>
                  <td>{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : role === 'admin' ? (
        <>
          <button onClick={handleLogout} style={{ position: 'fixed', top: 10, right: 10, backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white">
              <path d="M10.09 15.59L8.67 14.17 11.83 11H3v-2h8.83L8.67 6.83 10.09 5.41 15.67 11zM19 19h-6v-2h6v-2h-6v-2h6v-2h-6V7h6v12z"/>
            </svg>
            Logout
          </button>
          <h2>Attendance Reports</h2>
          <table border="1" cellPadding="5" cellSpacing="0" width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.username}</td>
                  <td>{record.date}</td>
                  <td>{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <h3>Contact Information</h3>
        <a href="https://www.linkedin.com/in/vamsi-pithani-74708b34a" target="_blank" rel="noopener noreferrer" style={{ marginRight: 20 }}>
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="32" height="32" />
        </a>
        <a href="https://github.com/vamsi-pithani" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" width="32" height="32" />
        </a>
      </div>
    </div>
  );
}

export default App;
