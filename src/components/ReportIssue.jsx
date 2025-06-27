import React, { useState } from "react";
import { getFirestore, doc, getDoc, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage(app);
const auth = getAuth();

const GOOGLE_API_KEY = "AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw";

// Coordonatele limită pentru Timișoara (folosite și în GoogleMapView)
const TIMISOARA_BOUNDS = {
  north: 45.810,
  south: 45.690,
  east: 21.320,
  west: 21.140,
};

function isInTimisoaraBounds({ lat, lng }) {
  return (
    lat <= TIMISOARA_BOUNDS.north &&
    lat >= TIMISOARA_BOUNDS.south &&
    lng <= TIMISOARA_BOUNDS.east &&
    lng >= TIMISOARA_BOUNDS.west
  );
}

function ReportIssue() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]); // File[]
  const [gallery, setGallery] = useState([]); // Data URLs pentru preview
  const [addressWarning, setAddressWarning] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Galerie preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // combină cu imaginile deja selectate
    let newImages = [...images, ...files];
    // păstrează maxim 5
    if (newImages.length > 5) newImages = newImages.slice(0, 5);
    setImages(newImages);

    // Galerie preview
    const readers = newImages.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) => setGallery(urls));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAddressWarning("");
    try {
      // 1. Cere categoria de la AI
      const aiResp = await fetch("http://localhost:5000/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: desc }),
      });
      if (!aiResp.ok) throw new Error("Eroare la clasificarea AI");
      const aiData = await aiResp.json();
      const category = aiData.categorie || "Necunoscut";

      // 2. Geocode address
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_API_KEY}`
      );
      const data = await resp.json();
      if (data.status !== "OK") throw new Error("Adresa nu a putut fi găsită!");

      // 3. Caută rezultate din Timișoara
      let loc = null;
      let foundTimisoara = false;
      for (const result of data.results) {
        const addressComponents = result.address_components.map((c) => c.long_name.toLowerCase());
        const isTimisoara =
          addressComponents.includes("timișoara") ||
          addressComponents.includes("timisoara");
        const { lat, lng } = result.geometry.location;
        if (isTimisoara && isInTimisoaraBounds({ lat, lng })) {
          loc = { lat, lng };
          foundTimisoara = true;
          break;
        }
      }
      // Dacă nu a găsit Timișoara, ia primul rezultat
      if (!loc) {
        loc = data.results[0].geometry.location;
      }

      // 4. Verifică dacă e în limitele Timișoarei
      if (!isInTimisoaraBounds(loc)) {
        setAddressWarning("Se acceptă doar adrese din Timișoara!");
        setLoading(false);
        return;
      }
      if (!foundTimisoara) {
        setAddressWarning("Adresa introdusă există și în alte orașe. A fost selectată automat adresa din Timișoara, dacă există.");
      }

      // Upload poze în Storage și ia URL-urile
      let imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const storageRef = ref(
          storage,
          `issues/${Date.now()}_${img.name}`
        );
        await uploadBytes(storageRef, img);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let displayName = user.displayName || user.email;
      let profilePicUrl = user.photoURL || "/default-avatar.png";

      if (userSnap.exists()) {
        const userData = userSnap.data();
        displayName = userData.username || displayName;
        profilePicUrl = userData.profilePicUrl || profilePicUrl;
      }

      await addDoc(collection(db, "issues"), {
        title,
        address,
        lat: loc.lat,
        lng: loc.lng,
        desc,
        category,
        images: imageUrls,
        created: new Date().toISOString(),
        uid: user.uid,
        upvotes: 0,
        upvotedBy: [],
        displayName,
        profilePicUrl,
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
      <div style={{ margin: "1rem 0" }}>
        <label>
          Poze (max 5):
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </label>
        {/* Galerie preview */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {gallery.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`preview-${idx}`}
              style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #ccc" }}
            />
          ))}
        </div>
      </div>
      {addressWarning && (
        <div style={{ color: "red", marginBottom: 8 }}>{addressWarning}</div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Se trimite..." : "Trimite"}
      </button>
    </form>
  );
}

export default ReportIssue;