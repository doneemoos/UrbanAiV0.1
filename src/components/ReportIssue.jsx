import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const GOOGLE_API_KEY = "AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw"; // folosește cheia ta

async function geocodeAddress(address) {
  const resp = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_API_KEY}`
  );
  const data = await resp.json();
  if (data.status === "OK") {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  throw new Error("Adresa nu a putut fi găsită!");
}

function ReportIssue() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const coords = await geocodeAddress(address);
      await addDoc(collection(db, "issues"), {
        title,
        address,
        lat: coords.lat,
        lng: coords.lng,
        desc,
        created: new Date().toISOString(),
        uid: user ? user.uid : null, // sau undefined dacă nu e logat
      });
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "2rem auto" }}
    >
      <h2>Raportează o problemă</h2>
      <input
        placeholder="Titlu"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        placeholder="Adresă (stradă și număr)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <textarea
        placeholder="Descriere"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Se trimite..." : "Trimite"}
      </button>
    </form>
  );
}

export default ReportIssue;