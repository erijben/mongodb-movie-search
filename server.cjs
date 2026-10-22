require("dotenv").config({ quiet: true });

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 3001;

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI est absente ou vide.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  // Ouvrir une connexion partagée par les requêtes HTTP.
  await client.connect();

  const movies = client
    .db("sample_mflix")
    .collection("embedded_movies");

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Movie Search API is running",
    });
  });

  app.get("/api/search", async (req, res) => {
    // Vérifier la phrase reçue dans l'URL.
    if (typeof req.query.q !== "string") {
      return res.status(400).json({
        error: "Le paramètre q doit être une phrase.",
      });
    }

    const query = req.query.q.trim();

    if (query.length === 0 || query.length > 500) {
      return res.status(400).json({
        error: "La recherche doit contenir entre 1 et 500 caractères.",
      });
    }

    try {
      // Générer l'embedding de la phrase.
      const response = await fetch("http://localhost:11434/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "embeddinggemma",
          input: query,
          truncate: false,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        throw new Error("OllamaRequestFailed");
      }

      const data = await response.json();
      const vector = data.embeddings?.[0];

      if (
        !Array.isArray(vector) ||
        vector.length !== 768 ||
        !vector.every(Number.isFinite)
      ) {
        throw new Error("InvalidEmbedding");
      }

      // Rechercher les cinq films les plus proches.
      const results = await movies.aggregate([
        {
          $vectorSearch: {
            index: "movie_local_vector_index",
            path: "plot_embedding_embeddinggemma",
            queryVector: vector,
            numCandidates: 150,
            limit: 5,
          },
        },
        {
          $project: {
            _id: 0,
            title: 1,
            plot: 1,
            poster: 1,
            genres: 1,
            year: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]).toArray();

      res.json({
        query,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error("Échec de recherche :", error.name);
      console.error("Code :", error.code ?? "non disponible");

      res.status(503).json({
        error: "Recherche indisponible. Vérifie Ollama et la connexion Atlas.",
      });
    }
  });

  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`API disponible sur http://127.0.0.1:${PORT}`);
  });

  server.on("error", async (error) => {
    console.error("Erreur serveur :", error.code);
    await client.close();
    process.exitCode = 1;
  });
}

main().catch((error) => {
  console.error("Échec du démarrage :", error.name);
  console.error("Code :", error.code ?? "non disponible");
  process.exitCode = 1;
});