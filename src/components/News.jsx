import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
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

function groupIssues(issues) {
  // Cheia este adresa (fără spații la început/sfârșit, lowercase) + categorie (lowercase)
  const groups = {};
  issues.forEach((issue) => {
    const addressKey = (issue.address || "").trim().toLowerCase();
    const categoryKey = (issue.category || "Altele").trim().toLowerCase();
    const key = addressKey + "|" + categoryKey;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(issue);
  });
  // Returnează array de array-uri (fiecare grup)
  return Object.values(groups);
}

function IssueCard({ issues }) {
  const navigate = useNavigate();
  const user = getAuth().currentUser;
  const isAdmin = user && user.email === "admin@admin.com";
  const main = issues[0];

  // Adună toate imaginile din grup (fără duplicate)
  const allImages = [
    ...new Set(
      issues
        .flatMap((issue) => issue.images || [])
        .filter((img) => !!img)
    ),
  ];

  // Status: dacă toate sunt rezolvate => Rezolvat, dacă toate sunt nerezolvate => Nerezolvat, altfel In lucru
  let status = "In lucru";
  if (issues.every((i) => (i.status || "Nerezolvat") === "Rezolvat")) status = "Rezolvat";
  else if (issues.every((i) => (i.status || "Nerezolvat") === "Nerezolvat")) status = "Nerezolvat";

  // Data: cea mai recentă
  const latestDate = issues
    .map((i) => i.created)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  // Upvotes: suma tuturor upvotes din grup
  const totalUpvotes = issues.reduce((acc, i) => acc + (i.upvotes || 0), 0);

  // Descriere: concatenează titlurile problemelor din grup
  const titles = issues.map((i) => i.title).join(", ");

  // Funcție pentru ștergere toate problemele din grup
  const handleDeleteGroup = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Sigur vrei să ștergi toate raportările din acest box?")) return;
    for (const issue of issues) {
      await deleteDoc(doc(db, "issues", issue.id));
    }
  };

  // Funcție pentru schimbare status (ciclare)
  const handleChangeStatus = async (e) => {
    e.stopPropagation();
    // Statusurile posibile
    const statuses = ["Nerezolvat", "In lucru", "Rezolvat"];
    // Statusul actual (majoritar sau primul)
    const currentStatus = main.status || "Nerezolvat";
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    // Update pentru toate problemele din grup
    for (const issue of issues) {
      await updateDoc(doc(db, "issues", issue.id), { status: nextStatus });
    }
  };

  return (
    <div
      onClick={() => navigate(`/issue/${main.id}`)}
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px #0001",
        margin: "1.5rem 0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      {/* Imagine */}
      {allImages.length > 0 && (
        <img
          src={allImages[0]}
          alt="cover"
          style={{
            width: "100%",
            height: 180,
            objectFit: "cover",
          }}
        />
      )}
      <div style={{ padding: "1.2rem", position: "relative" }}>
        {/* Categorie */}
        <div
          style={{
            color: "#1976d2",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          {main.category || "Altele"}
        </div>
        {/* Titlu */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 4,
          }}
        >
          {titles}
        </div>
        {/* Descriere */}
        <div
          style={{
            color: "#555",
            fontSize: 15,
            marginBottom: 8,
          }}
        >
          {main.desc}
        </div>
        {/* Adresă */}
        <div
          style={{
            color: "#888",
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {main.address
            ? main.address
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : ""}
        </div>
        {/* Status + Data */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              background: statusColors[status] || "#eee",
              color: "#333",
              borderRadius: 8,
              padding: "2px 10px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {status}
          </span>
          <span
            style={{
              color: "#888",
              fontSize: 13,
            }}
          >
            {latestDate
              ? new Date(latestDate).toLocaleDateString("ro-RO", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
        {/* Upvotes */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="upvote">
            ⬆️
          </span>
          <span>{totalUpvotes}</span>
        </div>
        {/* Admin controls */}
        {isAdmin && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 8 }}>
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
              onClick={handleDeleteGroup}
              style={{
                background: "#e53935",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Șterge grup"
            >
              Șterge
            </button>
          </div>
        )}
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

  // Grupează problemele după adresă și categorie
  const grouped = groupIssues(issues);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "2rem 0",
      }}
    >
      <h2 style={{ marginBottom: 24 }}>Community Issues</h2>
      {grouped.map((group, idx) => (
        <IssueCard key={group[0].id + idx} issues={group} />
      ))}
    </div>
  );
}

export default News;