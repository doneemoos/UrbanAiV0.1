import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase/config";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth();

const GOOGLE_API_KEY = "AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw";

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
  const [images, setImages] = useState([]); // File[]
  const [gallery, setGallery] = useState([]); // Data URLs pentru preview
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
    try {
      const coords = await geocodeAddress(address);

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

      await addDoc(collection(db, "issues"), {
        title,
        address,
        lat: coords.lat,
        lng: coords.lng,
        desc,
        images: imageUrls,
        created: new Date().toISOString(),
        uid: user ? user.uid : null,
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
      <button type="submit" disabled={loading}>
        {loading ? "Se trimite..." : "Trimite"}
      </button>
    </form>
  );
}

export default ReportIssue;