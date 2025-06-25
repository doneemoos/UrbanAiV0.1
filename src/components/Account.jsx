import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, getDoc, deleteDoc, getDocs } from "firebase/firestore";
import { getAuth, updatePassword, deleteUser } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
Chart.register(BarElement, CategoryScale, LinearScale);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function Account() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    profilePic: null,
  });

  const [stats, setStats] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [passwordMessage, setPasswordMessage] = useState("");
  const navigate = useNavigate();

  // Detectează dacă e admin
  const user = auth.currentUser;
  const isAdmin = user && user.email === "admin@admin.com";

  useEffect(() => {
    if (!user) return;

    // Încarcă datele reale din Firestore
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile((prev) => ({
          ...prev,
          username: data.username || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          email: user.email || "",
        }));
      }
    });

    const q = query(collection(db, "issues"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.created);
        const day = date.getDay(); // 0 = Duminică, 1 = Luni, ...
        counts[day]++;
      });
      setStats(counts);
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    // Actualizează doar dacă s-a introdus o parolă nouă
    if (profile.password) {
      try {
        await updatePassword(auth.currentUser, profile.password);
        setPasswordMessage("Parola a fost schimbată cu succes!");
      } catch (error) {
        setPasswordMessage("Eroare la schimbarea parolei: " + error.message);
      }
    } else {
      setPasswordMessage("Datele au fost actualizate!");
    }
    // Poți adăuga și logica de update pentru alte date dacă vrei

    const storage = getStorage();
    const userRef = doc(db, "users", auth.currentUser.uid);

    if (profile.profilePic) {
      // Upload imagine
      const storageRef = ref(storage, `profilePics/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, profile.profilePic);
      const url = await getDownloadURL(storageRef);
      // Salvează URL-ul în Firestore
      await setDoc(userRef, { profilePicUrl: url }, { merge: true });
    }

    // Actualizează și celelalte date ale profilului
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
    }, { merge: true });
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Sigur vrei să ștergi contul? Această acțiune este ireversibilă!")) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Șterge datele din Firestore (profil)
      await deleteDoc(doc(db, "users", user.uid));
      // Șterge toate problemele raportate de utilizator
      const issuesSnap = await getDocs(query(collection(db, "issues"), where("uid", "==", user.uid)));
      const batch = db.batch ? db.batch() : null;
      issuesSnap.forEach((docu) => {
        if (batch) batch.delete(docu.ref);
        else deleteDoc(docu.ref);
      });
      if (batch) await batch.commit();

      // Șterge userul din Authentication
      await deleteUser(user);

      // Redirect la landing page
      navigate("/");
    } catch (err) {
      alert("Eroare la ștergerea contului: " + err.message);
    }
  };

  const chartData = {
    labels: days,
    datasets: [
      {
        label: "Probleme raportate",
        data: stats,
        backgroundColor: "#36a2eb",
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="account-container">
      <h2>Profilul meu</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input name="username" value={profile.username} onChange={handleChange} />
        </div>
        <div>
          <label>Email:</label>
          <input name="email" type="email" value={profile.email} onChange={handleChange} />
        </div>
        <div>
          <label>Telefon:</label>
          <input name="phone" value={profile.phone} onChange={handleChange} />
        </div>
        <div>
          <label>Parolă nouă:</label>
          <input name="password" type="password" value={profile.password} onChange={handleChange} />
        </div>
        <div>
          <label>Poza de profil:</label>
          <input name="profilePic" type="file" accept="image/*" onChange={handleChange} />
        </div>
        <button type="submit">Salvează modificările</button>
      </form>
      {passwordMessage && (
        <div style={{ color: passwordMessage.includes("succes") ? "green" : "red", marginTop: 8 }}>
          {passwordMessage}
        </div>
      )}
      <button
        type="button"
        style={{
          marginTop: 24,
          background: "#e53935",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "10px 20px",
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={handleDeleteAccount}
      >
        Șterge contul
      </button>
      {/* Chart doar pentru utilizatorii normali */}
      {!isAdmin && (
        <>
          <h3>Status săptămânal</h3>
          <Bar data={chartData} options={chartOptions} />
        </>
      )}
    </div>
  );
}

export default Account;