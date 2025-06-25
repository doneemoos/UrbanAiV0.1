import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale);

function Account() {
  const [profile, setProfile] = useState({
    username: "user123",
    email: "user@email.com",
    phone: "0712345678",
    password: "",
    profilePic: null,
  });

  const [stats] = useState([2, 4, 1, 5, 3, 0, 2]); // Exemplu: probleme raportate pe zile

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
    labels: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
    datasets: [
      {
        label: "Probleme raportate",
        data: stats,
        backgroundColor: "#36a2eb",
      },
    ],
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
      <Bar data={chartData} />
    </div>
  );
}

export default Account;