import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, addDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config.jsx";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusColors = {
  "In lucru": "#ffe082",
  "Rezolvat": "#a5d6a7",
  "Nerezolvat": "#ef9a9a",
};

function IssueCard({ issue }) {
  const navigate = useNavigate();
  const user = getAuth().currentUser;
  const isAdmin = user && user.email === "admin@admin.com";

  // Status
  const status = issue.status || "Nerezolvat";

  // Data
  const latestDate = issue.created;

  // Upvotes
  const totalUpvotes = issue.upvotes || 0;

  // Imagine
  const allImages = (issue.images || []).filter(Boolean);

  // Funcție pentru ștergere
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Sigur vrei să ștergi această raportare?")) return;
    await deleteDoc(doc(db, "issues", issue.id));
  };

  // Funcție pentru schimbare status (ciclare)
  const handleChangeStatus = async (e) => {
    e.stopPropagation();
    const statuses = ["Nerezolvat", "In lucru", "Rezolvat"];
    const currentStatus = issue.status || "Nerezolvat";
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    await updateDoc(doc(db, "issues", issue.id), { status: nextStatus });
  };

  return (
    <div
      onClick={() => navigate(`/issue/${issue.id}`)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e6ecf0",
        margin: "1.5rem 0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        position: "relative",
        boxShadow: "0 1px 2px #0001",
        padding: "18px 18px 12px 18px",
        color: "#222",
        gap: 16,
        maxWidth: 650,
      }}
    >
      {/* Imagine de profil */}
      <div style={{ flexShrink: 0 }}>
        <img
          src={issue.profilePicUrl || "/default-avatar.png"}
          alt="avatar"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #eee",
            background: "#eee",
          }}
        />
      </div>
      {/* Conținut */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header: nume, status, dată */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "#222" }}>
            {issue.displayName || "Utilizator"}
          </span>
          <span style={{ color: "#888", fontSize: 13 }}>
            · {latestDate ? new Date(latestDate).toLocaleDateString("ro-RO", { month: "short", day: "numeric" }) : ""}
          </span>
          <span
            style={{
              background: statusColors[status] || "#eee",
              color: "#222",
              borderRadius: 8,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 700,
              marginLeft: 8,
            }}
          >
            {status}
          </span>
        </div>
        {/* Titlu și descriere */}
        <div style={{ margin: "6px 0 8px 0", fontSize: 17, color: "#222", fontWeight: 500 }}>
          {issue.title}
        </div>
        <div style={{ color: "#444", fontSize: 15, marginBottom: 8, whiteSpace: "pre-line" }}>
          {issue.desc}
        </div>
        {/* Imagine atașată */}
        {allImages.length > 0 && (
          <div style={{ margin: "10px 0", borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
            <img
              src={allImages[0]}
              alt="cover"
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}
        {/* Adresă și categorie */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <span style={{ color: "#888", fontSize: 14 }}>
            {issue.address
              ? issue.address
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : ""}
          </span>
          <span style={{ color: "#1976d2", fontWeight: 600, fontSize: 13 }}>
            {issue.category || "Altele"}
          </span>
        </div>
        {/* Upvotes și admin controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span role="img" aria-label="upvote" style={{ fontSize: 18 }}>
              ⬆️
            </span>
            <span style={{ fontWeight: 600, color: "#222" }}>{totalUpvotes}</span>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleChangeStatus}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Schimbă status"
              >
                Schimbă status
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Șterge"
              >
                Șterge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function News() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "issues"), (snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Nu mai grupăm, fiecare raportare este o postare separată
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "2rem 0",
      }}
    >
      <h2 style={{ marginBottom: 24 }}>Community Issues</h2>
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

export default News;