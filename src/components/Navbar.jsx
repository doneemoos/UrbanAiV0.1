import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Navbar.css";
import Logo from "./img/UrbanAi_logo_transparent.png";
import defaultProfile from "./img/default-profile.svg";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    // Încearcă să citești poza de profil din Firestore (colecția "users")
    const fetchProfilePic = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().profilePicUrl) {
          setProfilePic(docSnap.data().profilePicUrl);
        } else {
          setProfilePic(null);
        }
      } else {
        setProfilePic(null);
      }
    };
    fetchProfilePic();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="navStyle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <ul className="split1">
        <li>
          <Link to="/">
            <img className="logo" src={Logo} alt="Logo" />
          </Link>
        </li>
        <li>
          <a href="/news">News</a>
        </li>
        <li>
          <a href="/events">Events</a>
        </li>
      </ul>
      <nav className="navbar">
        <ul style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/account">Account</Link>
              </li>
              <li>
                <button onClick={handleLogout}>Log out</button>
              </li>
              <li>
                <Link to="/account">
                  <img
                    src={profilePic || defaultProfile}
                    alt="Profil"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #ccc",
                    }}
                  />
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/signup">Sign up</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
