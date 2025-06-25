import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, deleteDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config.jsx";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const statusColors = {
  "In lucru": "#ffe082",
  "Rezolvat": "#a5d6a7",
  "Nerezolvat": "#ef9a9a",
  "Pending": "#ffe082",
};

function capitalizeWords(str) {
  return str
    ? str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";
}

function IssueDetails() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [groupedIssues, setGroupedIssues] = useState([]);
  const user = getAuth().currentUser;
  const isAdmin = user && user.email === "admin@admin.com";

  useEffect(() => {
    const fetchIssueAndGroup = async () => {
      // 1. Ia issue-ul principal
      const docRef = doc(db, "issues", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setIssue({ id: docSnap.id, ...data });
      if (user && data.upvotedBy && data.upvotedBy.includes(user.uid)) {
        setHasUpvoted(true);
      } else {
        setHasUpvoted(false);
      }

      // 2. Găsește toate problemele cu aceeași adresă și categorie
      const allIssuesSnap = await getDocs(collection(db, "issues"));
      const addressKey = (data.address || "").trim().toLowerCase();
      const categoryKey = (data.category || "Altele").trim().toLowerCase();
      const groupedIssues = allIssuesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (i) =>
            (i.address || "").trim().toLowerCase() === addressKey &&
            (i.category || "Altele").trim().toLowerCase() === categoryKey
        );

      setGroupedIssues(groupedIssues);

      // 3. Adună toate pozele din grup (fără duplicate)
      const images = [
        ...new Set(
          groupedIssues
            .flatMap((i) => i.images || [])
            .filter((img) => !!img)
        ),
      ];
      setAllImages(images);
      setCurrentImg(0);
    };
    fetchIssueAndGroup();
    // eslint-disable-next-line
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user) return alert("Trebuie să fii logat pentru a da upvote!");
    setLoading(true);
    const issueRef = doc(db, "issues", id);
    if (!hasUpvoted) {
      await updateDoc(issueRef, {
        upvotes: (issue.upvotes || 0) + 1,
        upvotedBy: arrayUnion(user.uid),
      });
      setIssue((prev) => ({
        ...prev,
        upvotes: (prev.upvotes || 0) + 1,
        upvotedBy: [...(prev.upvotedBy || []), user.uid],
      }));
      setHasUpvoted(true);
    } else {
      await updateDoc(issueRef, {
        upvotes: (issue.upvotes || 1) - 1,
        upvotedBy: arrayRemove(user.uid),
      });
      setIssue((prev) => ({
        ...prev,
        upvotes: (prev.upvotes || 1) - 1,
        upvotedBy: (prev.upvotedBy || []).filter((uid) => uid !== user.uid),
      }));
      setHasUpvoted(false);
    }
    setLoading(false);
  };

  // Galerie: funcții pentru navigare
  const handlePrev = () => {
    if (!allImages.length) return;
    setCurrentImg((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  const handleNext = () => {
    if (!allImages.length) return;
    setCurrentImg((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Șterge toate problemele din grup
  const handleDeleteGroup = async () => {
    if (!window.confirm("Sigur vrei să ștergi toate raportările din acest box?")) return;
    for (const issue of groupedIssues) {
      await deleteDoc(doc(db, "issues", issue.id));
    }
    window.location.href = "/news";
  };

  // Schimbă statusul la toate problemele din grup
  const handleChangeStatus = async () => {
    const statuses = ["Nerezolvat", "In lucru", "Rezolvat"];
    const currentStatus = issue.status || "Nerezolvat";
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    for (const i of groupedIssues) {
      await updateDoc(doc(db, "issues", i.id), { status: nextStatus });
    }
    // Refetch
    window.location.reload();
  };

  if (!issue) return <div style={{ padding: 40 }}>Se încarcă...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 0" }}>
      <h2 style={{ marginBottom: 16 }}>{issue.title}</h2>
      {/* Galerie de imagini din toate problemele grupate */}
      {allImages.length > 0 && (
        <div style={{ position: "relative", width: "100%", height: 220, marginBottom: 24 }}>
          <img
            src={allImages[currentImg]}
            alt={`cover-${currentImg}`}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
            }}
          />
          {/* Săgeată stânga */}
          {allImages.length > 1 && (
            <button
              onClick={handlePrev}
              style={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.7)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 22,
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label="Imagine anterioară"
            >
              &#8592;
            </button>
          )}
          {/* Săgeată dreapta */}
          {allImages.length > 1 && (
            <button
              onClick={handleNext}
              style={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.7)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 22,
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label="Imagine următoare"
            >
              &#8594;
            </button>
          )}
          {/* Buline pentru galerie */}
          {allImages.length > 1 && (
            <div style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}>
              {allImages.map((_, idx) => (
                <span
                  key={idx}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: idx === currentImg ? "#1976d2" : "#ccc",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Status */}
      <span
        style={{
          background: statusColors[issue.status] || "#eee",
          color: "#333",
          borderRadius: 8,
          padding: "2px 10px",
          fontSize: 13,
          fontWeight: 600,
          float: "right",
        }}
      >
        {issue.status || "Nerezolvat"}
      </span>
      {/* Categorie */}
      <div style={{ color: "#1976d2", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
        {issue.category || "Altele"}
      </div>
      {/* Titlu */}
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
        {issue.title}
      </div>
      {/* Adresă și dată */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
        <span style={{ color: "#1976d2", fontSize: 15 }}>
          <span role="img" aria-label="locatie">📍</span>{" "}
          {capitalizeWords(issue.address)}
        </span>
        <span style={{ color: "#888", fontSize: 15 }}>
          <span role="img" aria-label="calendar">📅</span>{" "}
          Reported on{" "}
          {issue.created
            ? new Date(issue.created).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : ""}
        </span>
      </div>
      <hr />
      {/* Descriere */}
      <div style={{ margin: "18px 0" }}>
        <b>Description</b>
        <div style={{ color: "#444", marginTop: 6 }}>{issue.desc}</div>
      </div>
      <hr />
      {/* Buton Upvote */}
      <div style={{ display: "flex", gap: 32, marginTop: 24 }}>
        <button
          style={{
            background: hasUpvoted ? "#1976d2" : "#f5f5f5",
            color: hasUpvoted ? "#fff" : "#222",
            border: "none",
            borderRadius: 20,
            padding: "10px 24px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleUpvote}
          disabled={loading}
        >
          <span role="img" aria-label="upvote">⬆️</span> Upvote ({issue.upvotes || 0})
        </button>
      </div>
      {isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
  );
}

export default IssueDetails;