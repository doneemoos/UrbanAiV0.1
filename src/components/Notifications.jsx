import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import defaultProfile from "./img/default-profile.svg";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const user = getAuth().currentUser;

  useEffect(() => {
    if (!user) return;
    // Ascultă notificările pentru userul curent
    const q = query(
      collection(db, "notifications"),
      where("targetUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, async (snap) => {
      // Sortează descrescător după data
      const notifs = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.created?.toMillis?.() || 0) - (a.created?.toMillis?.() || 0));
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  // Grupare notificări după zi/lună
  const grouped = { Yesterday: [], "This month": [], Earlier: [] };
  const now = new Date();
  notifications.forEach((n) => {
    const d = n.created?.toDate ? n.created.toDate() : null;
    if (!d) return;
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff < 2) grouped.Yesterday.push(n);
    else if (diff < 31) grouped["This month"].push(n);
    else grouped.Earlier.push(n);
  });

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 0", background: "#fff", borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
      </div>
      {["Yesterday", "This month", "Earlier"].map((section) =>
        grouped[section].length > 0 ? (
          <div key={section} style={{ marginBottom: 18 }}>
            <div style={{ color: "#888", fontWeight: 600, fontSize: 15, margin: "18px 0 8px 0" }}>{section}</div>
            {grouped[section].map((notif) => (
              <NotifItem key={notif.id} notif={notif} />
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "18px 0" }} />
          </div>
        ) : null
      )}
    </div>
  );
}

function NotifItem({ notif }) {
  // Tipuri: upvote, comment
  let text = "";
  if (notif.type === "upvote") {
    text = (
      <>
        <b>{notif.actorUsername}</b> upvoted your post.
      </>
    );
  } else if (notif.type === "comment") {
    text = (
      <>
        <b>{notif.actorUsername}</b> commented: "{notif.commentText}"
      </>
    );
  } else {
    text = notif.text || "";
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
      <img
        src={notif.actorProfilePicUrl || defaultProfile}
        alt="avatar"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #eee",
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ color: "#222", fontSize: 15 }}>{text}</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>{timeAgo(notif.created?.toDate?.())}</div>
      </div>
      {notif.type === "follow" ? (
        <button
          style={{
            background: notif.isFollowing ? "#222" : "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "6px 18px",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            minWidth: 80,
          }}
        >
          {notif.isFollowing ? "Following" : "Follow"}
        </button>
      ) : null}
    </div>
  );
}

export default Notifications;