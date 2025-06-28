import React, { useState } from "react";
import { getFirestore, doc, getDoc, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getAuth } from "firebase/auth";
import defaultProfile from "./img/default-profile.svg";

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage(app);
const auth = getAuth();

const GOOGLE_API_KEY = "AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw";

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
  const [images, setImages] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [addressWarning, setAddressWarning] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    let newImages = [...images, ...files];
    if (newImages.length > 5) newImages = newImages.slice(0, 5);
    setImages(newImages);

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
      const category = "Necunoscut";
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_API_KEY}`
      );
      const data = await resp.json();
      if (data.status !== "OK") throw new Error("Adresa nu a putut fi găsită!");

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
      if (!loc) {
        loc = data.results[0].geometry.location;
      }
      if (!isInTimisoaraBounds(loc)) {
        setAddressWarning("Se acceptă doar adrese din Timișoara!");
        setLoading(false);
        return;
      }
      if (!foundTimisoara) {
        setAddressWarning("Adresa introdusă există și în alte orașe. A fost selectată automat adresa din Timișoara, dacă există.");
      }

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
      let profilePicUrl = user.photoURL || defaultProfile;

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.username) displayName = data.username;
        profilePicUrl = data.profilePicUrl ? data.profilePicUrl : defaultProfile;
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
    <div style={{
      minHeight: "100vh",
      background: "#f4f4f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0001",
          padding: "2.5rem 2.5rem 2rem 2.5rem",
          minWidth: 350,
          maxWidth: 500,
          width: "100%",
          margin: "2rem auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontWeight: 600 }}>Raportează o problemă</h2>
          <div style={{ color: "#888", fontSize: 16, marginTop: 4 }}>
            Ajută-ne să îmbunătățim orașul raportând orice problemă ai observat.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>
              Titlu problemă*
            </label>
            <input
              placeholder="Ex: Gropi în asfalt"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>
            Adresă (stradă și număr)*
          </label>
          <input
            placeholder="Ex: Strada Mare 12"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>
            Descriere
          </label>
          <textarea
            placeholder="Descrie problema observată"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              resize: "vertical"
            }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>
            Atașează poze (max 5)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {gallery.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`preview-${idx}`}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #ccc"
                }}
              />
            ))}
          </div>
        </div>
        {addressWarning && (
          <div style={{ color: "red", marginBottom: 8 }}>{addressWarning}</div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              background: "#f4f4f5",
              color: "#222",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 500,
              fontSize: 16,
              cursor: "pointer"
            }}
            disabled={loading}
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Se trimite..." : "Trimite raportul"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportIssue;