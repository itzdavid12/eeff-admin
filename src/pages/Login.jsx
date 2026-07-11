// src/pages/Login.jsx (Part 1/3)

import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

     
  const userCredential =
  await signInWithEmailAndPassword(
    auth,
    email,
    password
  );



const uid = userCredential.user.uid;

const adminRef = doc(db, "admins", uid);

const adminSnap = await getDoc(adminRef);

// User not found in admins collection
if (!adminSnap.exists()) {

  await signOut(auth);

  setError(
    "Access Denied. You are not an authorized admin."
  );

  return;

}

// Read admin data
const adminData = adminSnap.data();

// Only Admin & Leader allowed
if (
  adminData.role !== "Admin" &&
  adminData.role !== "Leader"
) {

  await signOut(auth);

  setError(
    "You don't have permission to access this panel."
  );

  return;

}

navigate("/dashboard");


    } catch (err) {
      console.log(err);

      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">

      {/* LEFT PANEL */}

      <div className="admin-login-left">

        <div className="login-overlay" />

        <div className="brand-content">

          <div className="brand-badge">

            <ShieldCheck size={22} />

            <span>EEFF ADMIN</span>

          </div>

          <h1>

            Welcome
            <br />

            Back

          </h1>

          <p>

            Manage church offerings, members,
            announcements, events and more
            from one secure dashboard.

          </p>

          <div className="brand-card">

            <h3>Admin Portal</h3>

            <span>

              Ebenezer Faith Fellowship

            </span>

          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="admin-login-right">

        <form
          className="admin-login-form"
          onSubmit={handleLogin}
        >

          <p className="small-title">

            ADMIN LOGIN

          </p>

          <h2>

            Sign in to Dashboard

          </h2>

          <p className="subtitle">

            Authorized users only

          </p>

          {error && (

            <div className="login-error">

              {error}

            </div>

          )}

          <div className="input-group">

            <label>

              Email Address

            </label>

            <input
              type="email"
              placeholder="admin@eeff.in"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>
                    <div className="input-group">

            <label>

              Password

            </label>

            <div className="password-field">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {showPassword ? (

                  <EyeOff size={18} />

                ) : (

                  <Eye size={18} />

                )}

              </button>

            </div>

          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >

            {loading
              ? "Signing In..."
              : "Sign In"}

          </button>

          <div className="login-divider">

            <span>

              Secure Firebase Authentication

            </span>

          </div>

          <div className="login-footer">

            <p>

              EEFF Admin Portal

            </p>

            <span>

              Ebenezer Faith Fellowship

            </span>

          </div>

        </form>

      </div>

    </div>
  );
}

export default Login;