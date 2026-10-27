
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [page, setPage] = useState("login");
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  useEffect(() => {
    api("/courses")
      .then(setCourses)
      .catch((e) => setError(e.message));
  }, []);

  async function authenticate(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      if (page === "register") {
        await api("/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setMessage("Registration successful! Please log in.");
        setPage("login");
        setPassword("");
      } else {
        const data = await api("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setStudent(data.student);
        setPage("feedback");
        setMessage(`Welcome, ${data.student.name}!`);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitFeedback(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api("/feedback", {
        method: "POST",
        body: JSON.stringify({
          student_id: student.id,
          course_id: Number(courseId),
          rating,
          comments,
        }),
      });
      setMessage("Feedback submitted successfully!");
      setCourseId("");
      setRating(5);
      setComments("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function openDashboard() {
    try {
      setFeedback(await api("/feedback"));
      setPage("admin");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  function logout() {
    setStudent(null);
    setPage("login");
    setMessage("");
    setError("");
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h2>🎓 Student Feedback</h2>
          <p>Learning experience portal</p>
        </div>
        {student && (
          <nav>
            <button onClick={() => setPage("feedback")}>Feedback</button>
            <button onClick={openDashboard}>Faculty View</button>
            <button onClick={logout}>Logout</button>
          </nav>
        )}
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">ACADEMIC FEEDBACK PORTAL</p>
          <h1>Your feedback.<br /><span>Better learning.</span></h1>
          <p>Share your experience and help improve teaching quality.</p>
        </section>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        {!student && (
          <section className="panel">
            <h2>{page === "register" ? "Create account" : "Welcome back"}</h2>
            <p>Access your course feedback portal.</p>
            <form onSubmit={authenticate}>
              {page === "register" && (
                <label>
                  Full name
                  <input value={name} onChange={e => setName(e.target.value)} required />
                </label>
              )}
              <label>
                Email address
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
              </label>
              <button className="primary" type="submit">
                {page === "register" ? "Register" : "Log in"}
              </button>
            </form>
            <p>
              {page === "register" ? "Already registered?" : "New student?"}{" "}
              <button className="link" onClick={() => {
                setPage(page === "register" ? "login" : "register");
                setError("");
                setMessage("");
              }}>
                {page === "register" ? "Log in" : "Create account"}
              </button>
            </p>
          </section>
        )}

        {student && page === "feedback" && (
          <section className="panel">
            <h2>Submit course feedback</h2>
            <p>Choose a course and rate your learning experience.</p>
            <form onSubmit={submitFeedback}>
              <label>
                Course
                <select value={courseId} onChange={e => setCourseId(e.target.value)} required>
                  <option value="">Select a course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </label>
              <label>Rating</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <button type="button" key={n} className={n <= rating ? "star active" : "star"} onClick={() => setRating(n)}>
                    ★
                  </button>
                ))}
              </div>
              <label>
                Comments
                <textarea rows="4" value={comments} onChange={e => setComments(e.target.value)} placeholder="Share your thoughts..." />
              </label>
              <button className="primary" type="submit">Submit feedback</button>
            </form>
          </section>
        )}

        {student && page === "admin" && (
          <section className="panel dashboard">
            <h2>Faculty feedback dashboard</h2>
            <div className="stats">
              <div><span>Total responses</span><h2>{feedback.length}</h2></div>
              <div><span>Average rating</span><h2>{feedback.length ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) + " / 5" : "—"}</h2></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Course</th><th>Rating</th><th>Comments</th></tr></thead>
                <tbody>
                  {feedback.map(f => (
                    <tr key={f.id}>
                      <td>{f.student_name}</td><td>{f.course_name}</td><td>{f.rating}/5</td><td>{f.comments || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!feedback.length && <p>No feedback submitted yet.</p>}
            </div>
          </section>
        )}
      </main>
      <footer>Student Feedback System | AAT-I | 2026</footer>
    </div>
  );
}
