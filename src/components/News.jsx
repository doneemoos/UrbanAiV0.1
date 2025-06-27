import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, updateDoc, arrayUnion, arrayRemove, doc, deleteDoc, query, orderBy, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config.jsx";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import defaultProfile from "./img/default-profile.svg";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusColors = {
  "In lucru": "#ffe082",
  "Rezolvat": "#a5d6a7",
  "Nerezolvat": "#ef9a9a",
};

const categories = [
  "Drumuri",
  "Iluminat",
  "Vandalism",
  "Salubritate",
  "Deșeuri",
  "Pericole",
  "Parcări",
  "Transport",
  "Apă și canalizare",
  "Zgomot",
  "Altele",
];

function IssueCard({ issue }) {
  const navigate = useNavigate();
  const user = getAuth().currentUser;
  const isAdmin = user && user.email === "admin@admin.com";

  // Status
  const status = issue.status || "Nerezolvat";
  const latestDate = issue.created;
  const totalUpvotes = issue.upvotes || 0;
  const allImages = (issue.images || []).filter(Boolean);

  // Upvote state
  const [hasUpvoted, setHasUpvoted] = useState(
    user && issue.upvotedBy && issue.upvotedBy.includes(user.uid)
  );
  const [loading, setLoading] = useState(false);

  // Comentarii
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    setHasUpvoted(user && issue.upvotedBy && issue.upvotedBy.includes(user.uid));
    // eslint-disable-next-line
  }, [user, issue.upvotedBy]);

  // Funcție pentru upvote
  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Trebuie să fii logat pentru a da upvote!");
    setLoading(true);
    const issueRef = doc(db, "issues", issue.id);
    if (!hasUpvoted) {
      await updateDoc(issueRef, {
        upvotes: (issue.upvotes || 0) + 1,
        upvotedBy: arrayUnion(user.uid),
      });
      setHasUpvoted(true);

      // === Trimite notificare la utilizatorul care a creat postarea ===
      try {
        // Nu trimite notificare dacă userul dă upvote la propria postare
        if (issue.uid && issue.uid !== user.uid) {
          // Ia username și poza din Firestore
          let actorUsername = user.displayName || user.email;
          let actorProfilePicUrl = user.photoURL || defaultProfile;
          try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              if (data.username) actorUsername = data.username;
              if (data.profilePicUrl) actorProfilePicUrl = data.profilePicUrl;
            }
          } catch {}
          await addDoc(collection(db, "notifications"), {
            type: "upvote",
            targetUid: issue.uid,
            actorUid: user.uid,
            actorUsername,
            actorProfilePicUrl,
            issueId: issue.id,
            created: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Eroare la trimiterea notificării:", err);
      }
      // === Sfârșit notificare ===

    } else {
      await updateDoc(issueRef, {
        upvotes: (issue.upvotes || 1) - 1,
        upvotedBy: arrayRemove(user.uid),
      });
      setHasUpvoted(false);
    }
    setLoading(false);
  };

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

  // Adaugă comentariu în Firestore cu username real din profil
  const handleAddComment = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Trebuie să fii logat pentru a comenta!");
    if (!commentText.trim()) return;
    setCommentLoading(true);

    // Ia username-ul și poza reală din Firestore
    let username = user.displayName || user.email;
    let profilePicUrl = user.photoURL || defaultProfile;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.username) username = data.username;
        if (data.profilePicUrl) profilePicUrl = data.profilePicUrl;
      }
    } catch {}

    await addDoc(collection(db, "issues", issue.id, "comments"), {
      text: commentText,
      created: serverTimestamp(),
      uid: user.uid,
      displayName: username,
      profilePicUrl: profilePicUrl,
    });

    // Adaugă notificare în Firestore
    await addDoc(collection(db, "notifications"), {
      type: "comment",
      targetUid: issue.uid,
      actorUid: user.uid,
      actorUsername: username,
      actorProfilePicUrl: profilePicUrl,
      commentText: commentText,
      issueId: issue.id,
      created: serverTimestamp(),
    });

    setCommentText("");
    setCommentLoading(false);
    setShowCommentInput(false);
  };

  return (
    <div
      // Elimină onClick de pe container ca să nu trimită la issuedetails când folosești inputul
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
      <div style={{ flexShrink: 0 }} onClick={() => navigate(`/issue/${issue.id}`)}>
        <img
          src={issue.profilePicUrl || defaultProfile}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => navigate(`/issue/${issue.id}`)}>
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
        <div style={{ margin: "6px 0 8px 0", fontSize: 17, color: "#222", fontWeight: 500 }} onClick={() => navigate(`/issue/${issue.id}`)}>
          {issue.title}
        </div>
        <div style={{ color: "#444", fontSize: 15, marginBottom: 8, whiteSpace: "pre-line" }} onClick={() => navigate(`/issue/${issue.id}`)}>
          {issue.desc}
        </div>
        {/* Imagine atașată */}
        {allImages.length > 0 && (
          <div style={{ margin: "10px 0", borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }} onClick={() => navigate(`/issue/${issue.id}`)}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }} onClick={() => navigate(`/issue/${issue.id}`)}>
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
        {/* Upvotes, comentarii și admin controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
          <button
            style={{
              background: hasUpvoted ? "#1976d2" : "#f5f5f5",
              color: hasUpvoted ? "#fff" : "#222",
              border: "none",
              borderRadius: 20,
              padding: "6px 18px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleUpvote}
            disabled={loading}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <span role="img" aria-label="upvote">⬆️</span> Upvote ({issue.upvotes || 0})
          </button>
          <button
            style={{
              background: "#f5f5f5",
              color: "#222",
              border: "none",
              borderRadius: 20,
              padding: "6px 18px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
            onClick={e => {
              e.stopPropagation();
              setShowCommentInput((v) => !v);
            }}
          >
            <span role="img" aria-label="comentarii">💬</span> Comentarii
          </button>
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
        {/* Input comentariu */}
        {showCommentInput && (
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              handleAddComment(e);
            }}
            style={{ marginTop: 12, display: "flex", gap: 8 }}
          >
            <input
              type="text"
              placeholder="Adaugă un comentariu..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 20,
                border: "1px solid #ccc",
                fontSize: 15,
              }}
              disabled={commentLoading}
            />
            <button
              type="submit"
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                padding: "8px 18px",
                fontWeight: 600,
                cursor: commentLoading ? "not-allowed" : "pointer",
                opacity: commentLoading ? 0.7 : 1,
              }}
              disabled={commentLoading}
            >
              Postează
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function News() {
  const [issues, setIssues] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("created", sortOrder));
    const unsub = onSnapshot(q, (snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [sortOrder]);

  // Filtrare după categorie
  let filteredIssues = selectedCategory
    ? issues.filter((issue) => (issue.category || "Other") === selectedCategory)
    : issues;

  // Filtrare după search (titlu, descriere, adresă, categorie)
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filteredIssues = filteredIssues.filter((issue) =>
      (issue.title || "").toLowerCase().includes(s) ||
      (issue.desc || "").toLowerCase().includes(s) ||
      (issue.address || "").toLowerCase().includes(s) ||
      (issue.category || "").toLowerCase().includes(s)
    );
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Community Issues</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            style={{
              background: "#fff",
              border: "1px solid #e6ecf0",
              borderRadius: 24,
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 2px #0001",
            }}
            title="Sortează"
          >
            {sortOrder === "desc" ? "⬇️ Cele mai noi" : "⬆️ Cele mai vechi"}
          </button>
        </div>
      </div>
      {/* Searchbar */}
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Caută după titlu, descriere, locație sau categorie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 20,
            border: "1px solid #e6ecf0",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      {/* Butoane de filtrare categorie */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            style={{
              background: selectedCategory === cat ? "#1976d2" : "#f5f6fa",
              color: selectedCategory === cat ? "#fff" : "#222",
              border: "none",
              borderRadius: 16,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: selectedCategory === cat ? "0 2px 8px #1976d222" : "none",
              transition: "all 0.15s",
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              background: "#eee",
              color: "#222",
              border: "none",
              borderRadius: 16,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              marginLeft: 8,
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            Resetează filtrul
          </button>
        )}
      </div>
      {filteredIssues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

export default News;