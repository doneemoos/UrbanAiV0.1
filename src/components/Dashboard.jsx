import React, { useEffect, useState } from "react";
import GoogleMapView from "./GoogleMapView.jsx";
import { Link } from "react-router-dom";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Raportare() {
  const [issues, setIssues] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Listen for issues collection updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "issues"), (snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Derive stats
  const totalReports = issues.length;
  const resolvedReports = issues.filter(i => i.status === "Rezolvate").length;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Left: Stats and Map */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>
        <h2 style={{ margin: 0, marginBottom: '8px' }}>Probleme raportate pe hartă</h2>

        {/* Stats panel */}
        <div
          style={{
            background: 'white',
            padding: '8px 12px',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '24px',
            fontSize: 16,
            marginBottom: '16px',
          }}
        >
          <div><strong>{totalReports.toLocaleString()}</strong><br />Probleme raportate</div>
          <div><strong>{resolvedReports.toLocaleString()}</strong><br />Probleme rezolvate</div>
        </div>

        {/* Map container */}
        <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
          {isLoaded && <GoogleMapView markers={issues} style={{ height: '100%', width: '100%' }} />}
        </div>
      </div>

      {/* Right: Report form placeholder */}
      <div style={{ flexBasis: '35%', padding: '32px', overflowY: 'auto', background: '#f9f9f9' }}>
        <h2>Raportare Problemă</h2>
        <p>Alege locația pe hartă și completează detaliile pentru a trimite o nouă sesizare.</p>
        <Link to="/report">
          <button
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Începe raportarea
          </button>
        </Link>
      </div>
    </div>
  );
}
