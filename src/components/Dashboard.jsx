import React, { useEffect, useState } from "react";
import GoogleMapView from "./GoogleMapView.jsx";
import { Link } from "react-router-dom";
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function getUserTitles(user, userIssues, accountCreatedAt) {
  const total = userIssues.length;
  const iluminat = userIssues.filter(i => (i.category || "").toLowerCase().includes("iluminat")).length;
  const parcuri = userIssues.filter(i => (i.category || "").toLowerCase().includes("spațiu verde") || (i.category || "").toLowerCase().includes("parc")).length;
  const gropi = userIssues.filter(i => (i.category || "").toLowerCase().includes("groap") || (i.category || "").toLowerCase().includes("denivel")).length;
  const eco = userIssues.filter(i => (i.category || "").toLowerCase().includes("deșeu") || (i.category || "").toLowerCase().includes("gunoi") || (i.category || "").toLowerCase().includes("depozit")).length;
  const primulRaport = total >= 1;
  const vechime = accountCreatedAt ? (Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;

  const titles = [];

  if (total >= 1 && total <= 9) titles.push("Reporter Începător");
  if (total >= 10 && total <= 49) titles.push("Reporter Experimentat");
  if (total >= 50 && total <= 99) titles.push("Reporter Expert");
  if (total >= 100) titles.push("Campion al Rapoartelor");
  if (iluminat >= 100) titles.push("Gardianul Străzii");
  if (parcuri >= 50) titles.push("Protectorul Parcurilor");
  if (gropi >= 100) titles.push("Salvatorul Gropilor");
  if (eco >= 50) titles.push("Expert Eco");
  if (primulRaport) titles.push("Primul Pas");
  if (vechime >= 1) titles.push("Veteran al Comunității");

  return titles;
}

const titleIcons = {
  "Reporter Începător": "/icons/beginner.png",
  "Reporter Experimentat": "/icons/intermediate.png",
  "Reporter Expert": "/icons/expert.png",
  "Campion al Rapoartelor": "/icons/champion.png",
  "Gardianul Străzii": "/icons/street_guardian.png",
  "Protectorul Parcurilor": "/icons/park_protector.png",
  "Salvatorul Gropilor": "/icons/hole_savior.png",
  "Expert Eco": "/icons/eco_expert.png",
  "Primul Pas": "/icons/first_step.png",
  "Veteran al Comunității": "/icons/veteran.png"
};

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [xp, setXp] = useState(0);
  const [user, setUser] = useState(null);
  const [usersXP, setUsersXP] = useState([]);
  const [rank, setRank] = useState(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ascultă autentificarea
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        // Citește XP-ul curent și data creării contului din Firestore
        const userRef = doc(db, "users", u.uid);
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            setXp(docSnap.data().xp || 0);
            setAccountCreatedAt(docSnap.data().createdAt || u.metadata.creationTime);
          } else {
            setXp(0);
            setAccountCreatedAt(u.metadata.creationTime);
            setDoc(userRef, { xp: 0, createdAt: u.metadata.creationTime }); // Inițializează dacă nu există
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Ascultă problemele
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "issues"), (snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Actualizează XP-ul utilizatorului curent
  useEffect(() => {
    if (!user) return;
    const userIssues = issues.filter((issue) => issue.uid === user.uid);
    const newXp = userIssues.length * 5;
    setXp(newXp);
    const userRef = doc(db, "users", user.uid);
    setDoc(userRef, { xp: newXp }, { merge: true });
  }, [issues, user]);

  // Ascultă toți userii pentru leaderboard
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const all = snap.docs.map((doc) => ({
        uid: doc.id,
        xp: doc.data().xp || 0,
      }));
      // Sortează descrescător după xp
      all.sort((a, b) => b.xp - a.xp);
      setUsersXP(all);
    });
    return () => unsub();
  }, []);

  // Calculează locul utilizatorului curent
  useEffect(() => {
    if (!user || usersXP.length === 0) {
      setRank(null);
      return;
    }
    const idx = usersXP.findIndex((u) => u.uid === user.uid);
    setRank(idx >= 0 ? idx + 1 : null);
  }, [user, usersXP]);

  // Setează starea de încărcare după ce problemele sunt încărcate
  useEffect(() => {
    setIsLoaded(true);
  }, [issues]);

  // Detectează dacă e admin
  const isAdmin = user && user.email === "admin@admin.com";

  return (
    <div>
      <h1>Dashboard</h1>
      {user && !isAdmin && (
        <div style={{ marginBottom: "1rem", fontWeight: "bold", fontSize: "1.2rem" }}>
          XP-ul tău: <span style={{ color: "#007bff" }}>{xp}</span>
          <br />
          {rank && (
            <span>
              Locul tău în clasament: <span style={{ color: "#28a745" }}>{rank}</span>
            </span>
          )}
          <br />
          {/* Titluri */}
          <div style={{ marginTop: 8 }}>
            {getUserTitles(user, issues.filter(i => i.uid === user.uid), accountCreatedAt).map((title, idx) => (
              <div key={idx} style={{ color: "#ff9800", fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}>
                <img src={titleIcons[title]} alt="" style={{ width: 24, height: 24 }} />
                {title}
              </div>
            ))}
          </div>
        </div>
      )}
      {isLoaded && <GoogleMapView key={user?.uid || "nou"} markers={issues} />}
      <Link to="/report">
        <button style={{ margin: "1rem 0" }}>Report Issue</button>
      </Link>
    </div>
  );
}

export default Dashboard;