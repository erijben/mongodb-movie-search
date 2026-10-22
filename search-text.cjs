require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

async function main() {
  const query = process.argv[2];

  if (!query?.trim()) {
    console.log('Utilisation : node search-text.cjs "Ta recherche"');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI est absente ou vide.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    // Transformer la phrase avec le même modèle que les films.
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
      console.error("Erreur Ollama, statut HTTP :", response.status);
      process.exitCode = 1;
      return;
    }

    const data = await response.json();
    const vector = data.embeddings?.[0];

    if (
      !Array.isArray(vector) ||
      vector.length !== 768 ||
      !vector.every(Number.isFinite)
    ) {
      console.error("Embedding de recherche invalide.");
      process.exitCode = 1;
      return;
    }

    await client.connect();

    const movies = client
      .db("sample_mflix")
      .collection("embedded_movies");

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
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]).toArray();

    console.log("Recherche :", query);
    console.log("Films trouvés :", results.length);

    for (const movie of results) {
      console.log(`\n${movie.title} — score : ${movie.score.toFixed(4)}`);
      console.log(movie.plot);
    }
  } catch (error) {
    console.error("Erreur :", error.name);
    console.error("Code :", error.code ?? "non disponible");
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();