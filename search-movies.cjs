require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI est absente ou vide.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();

    const movies = client
      .db("sample_mflix")
      .collection("embedded_movies");

    // Récupérer le film de référence et son vecteur.
       // Lire le titre fourni dans le terminal.
const title = process.argv[2] || "Cutthroat Island";

// Récupérer le film de référence et son vecteur.
const reference = await movies.findOne(
  { title },
      { projection: { title: 1, plot: 1, plot_embedding: 1 } }
    );

    if (
      !Array.isArray(reference?.plot_embedding) ||
      reference.plot_embedding.length !== 1536
    ) {
      console.log("Film absent ou embedding incompatible.");
      return;
    }

    console.log("Film de référence :", reference.title);
    console.log("Résumé :", reference.plot);

    const results = await movies.aggregate([
      {
        $vectorSearch: {
          index: "movie_vector_index",
          path: "plot_embedding",
          queryVector: reference.plot_embedding,
          exact: true,
          limit: 6,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          plot: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
      // Exclure le film de référence des recommandations.
      { $match: { _id: { $ne: reference._id } } },
      { $limit: 5 },
    ]).toArray();

    console.log("\nFilms similaires :", results.length);

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