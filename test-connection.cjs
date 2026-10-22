require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("La variable MONGODB_URI est absente ou vide.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();

    const db = client.db("sample_mflix");
    await db.command({ ping: 1 });
    console.log("Connexion à Atlas réussie !");

    const movie = await db.collection("embedded_movies").findOne(
      {},
      { projection: { _id: 0, title: 1 } }
    );

    if (movie) {
      console.log("Film trouvé :", movie.title);
    } else {
      console.log("Aucun document trouvé dans embedded_movies.");
    }
  } catch (error) {
    console.error("Échec du test :", error.name);
    console.error("Code :", error.code ?? "non disponible");
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();