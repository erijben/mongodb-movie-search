const { generateAnswer } = require("./generate-answer.cjs");

async function main() {
  // Question complète destinée au modèle de génération.
  const question = process.argv[2]?.trim();

  // Recherche ciblée facultative destinée à Atlas.
  const retrievalQuery = process.argv[3]?.trim() || question;

  if (!question || question.length > 500) {
    console.log(
      'Usage: node rag-movies.cjs "Your question" "Optional search query"'
    );
    console.log("The question must contain 1–500 characters.");
    process.exitCode = 1;
    return;
  }

  if (!retrievalQuery || retrievalQuery.length > 500) {
    console.error("The retrieval query must contain 1–500 characters.");
    process.exitCode = 1;
    return;
  }

  console.log("Question:", question);
  console.log("Retrieval query:", retrievalQuery);
  console.log("\n1. Retrieving movies from Atlas...");

  const response = await fetch(
    `http://127.0.0.1:3001/api/search?q=${encodeURIComponent(retrievalQuery)}`,
    { signal: AbortSignal.timeout(150000) }
  );

  if (!response.ok) {
    throw new Error(`Search API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    throw new Error("The search API returned invalid results.");
  }

  // Construire le contexte avec les titres et résumés exploitables.
  const sources = data.results
    .filter(
      (movie) =>
        movie !== null &&
        typeof movie === "object" &&
        typeof movie.title === "string" &&
        movie.title.trim() &&
        typeof movie.plot === "string" &&
        movie.plot.trim()
    )
    .map((movie, index) => ({
      id: index + 1,
      title: movie.title,
      plot: movie.plot,
    }));

  if (sources.length === 0) {
    console.log("No usable sources found. No answer generated.");
    return;
  }

  console.log(`2. Generating an answer from ${sources.length} sources...`);

  // Conserver la question complète pour rédiger la réponse.
  const answer = await generateAnswer(question, sources);

  // Extraire les citations au format [1], [2], etc.
  const citedIds = [...answer.matchAll(/\[(\d+)\]/g)]
    .map((match) => Number(match[1]));

  const validIds = new Set(sources.map((source) => source.id));

  if (
    citedIds.length === 0 ||
    citedIds.some((id) => !validIds.has(id))
  ) {
    throw new Error("The generated answer has missing or invalid citations.");
  }

  console.log("\nANSWER\n");
  console.log(answer);

  console.log("\nRETRIEVED SOURCES\n");

  for (const source of sources) {
    console.log(`[${source.id}] ${source.title}`);
    console.log(source.plot);
    console.log();
  }
}

main().catch((error) => {
  console.error("RAG failed:", error.message);
  process.exitCode = 1;
});