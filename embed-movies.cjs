require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

const MODEL = "embeddinggemma";
const FIELD = "plot_embedding_embeddinggemma";

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

    // Sélectionner 5 films qui n'ont pas encore le nouveau vecteur.
    const documents = await movies.find(
      {
        plot: { $type: "string", $regex: "\\S" },
        [FIELD]: { $exists: false },
      },
      { projection: { title: 1, plot: 1 } } 
      // Sélectionner les films qui n'ont pas encore le nouveau vecteur.
    ).toArray();

    if (documents.length === 0) {
      console.log("Aucun film restant à traiter.");
      return;
    }

    let saved = 0;

    for (const movie of documents) {
      // Transformer le résumé en vecteur avec Ollama.
      const response = await fetch("http://localhost:11434/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          input: movie.plot,
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

      // Vérifier le vecteur avant de l'enregistrer.
      if (
        !Array.isArray(vector) ||
        vector.length !== 768 ||
        !vector.every(Number.isFinite)
      ) {
        console.error("Vecteur invalide pour :", movie.title);
        process.exitCode = 1;
        return;
      }

      // Ajouter le nouveau champ au document existant.
      const result = await movies.updateOne(
        { _id: movie._id },
        { $set: { [FIELD]: vector } }
      );

      saved += result.modifiedCount;
      console.log(`Enregistré : ${movie.title} — ${vector.length} dimensions`);
    }

    console.log(`\nTerminé : ${saved} films mis à jour.`);
  } catch (error) {
    console.error("Erreur :", error.name);
    console.error("Code :", error.code ?? "non disponible");
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();