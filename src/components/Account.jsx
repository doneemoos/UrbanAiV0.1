import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
Chart.register(BarElement, CategoryScale, LinearScale);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function Account() {
  const [profile, setProfile] = useState({
    username: "user123",
    email: "user@email.com",
    phone: "0712345678",
    password: "",
    profilePic: null,
  });

  const [stats, setStats] = useState([0, 0, 0, 0, 0, 0, 0]); // Duminică-Sâmbătă

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Datele au fost actualizate!");
    // Aici poți adăuga logica de update către backend
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
      <h3>Status săptămânal</h3>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default Account;