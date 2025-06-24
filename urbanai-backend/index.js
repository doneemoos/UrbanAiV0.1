const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Declari array-ul aici!
const complaints = [];

// Endpointul pentru clasificare + salvare cerere
app.post("/classify", async (req, res) => {
  try {
    const { text } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content:
            `Încadrează textul de mai jos într-una din categoriile, dar trebuie neaparat mentionat locul sau strada: Iluminat, Drumuri, Incidente Periculoase(ex copac rupt, sau altele) , Salubritate, Transport, Deșeuri, Parcări, Altele. Returnează DOAR categoria, fără alte explicații, dar daca nu este mentionat locul sau strada exacta, nu afisa nimic! Text: "${text}"`
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });
    const cat = completion.choices[0].message.content.trim();

    // Salvezi cererea în array
    complaints.push({
      text,
      categorie: cat,
      timestamp: new Date().toISOString()
    });

    res.json({ categorie: cat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint pentru a vedea toate cererile
app.get("/complaints", (req, res) => {
  res.json(complaints);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
