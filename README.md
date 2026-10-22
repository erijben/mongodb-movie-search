MongoDB Movie Semantic Search
A Node.js command-line application that finds movies by meaning using MongoDB Atlas Vector Search and local Ollama embeddings. Search in English or French, or discover movies similar to an existing title.

Built by Erij Ben Amor as a practical extension of the official MongoDB Vector Search quick start.
Features
- Natural-language movie search with local embeddinggemma embeddings.
- French queries against English movie summaries.
- Similar-movie recommendations using the dataset's original embeddings.
- Similarity scores and movie summaries in the terminal.
- Resumable embedding generation: documents with the local vector field are skipped.
- Credentials loaded from an ignored .env file.
This is a semantic retrieval application. It does not yet generate answers with RAG or run an AI agent.
How it works
For text search, Node.js sends the query to Ollama at http://localhost:11434/api/embed. The resulting 768-dimensional vector is passed to $vectorSearch, which searches movie-summary vectors generated with the same model. Atlas returns the five closest results, including their scores.

Movie-to-movie recommendations use the original 1,536-dimensional plot_embedding vectors instead. The two vector spaces are indexed and queried separately.
Requirements
- Node.js compatible with the MongoDB driver recorded in package-lock.json, including support for native fetch and AbortSignal.timeout.
- npm and a running local Ollama installation supporting embeddinggemma.
- MongoDB Atlas with Vector Search available.
- The sample_mflix.embedded_movies sample collection.
- An Atlas database user with read/write access to that collection; permission to create search indexes for setup.
- Your current IP address allowed in Atlas Network Access.
Local embedding generation requires a model download and sufficient disk space and memory. It uses no paid embedding API. Atlas usage remains subject to your selected plan and its limits.
Setup (Windows PowerShell)
Open the cloned or downloaded project folder in VS Code, then install the locked dependencies:
npm ci
Copy-Item .env.example .env
ollama pull embeddinggemma
In Atlas, open your cluster's Connect → Drivers dialog and select Node.js. Copy your own connection string into .env:
MONGODB_URI="YOUR_ATLAS_CONNECTION_STRING"
Replace the password placeholder with your database user's password. Percent-encode reserved characters in credentials when needed. Never commit .env or share its contents. .env.example must contain only MONGODB_URI=.

Verify connectivity:
npm run check-connection
Create the Atlas Vector Search indexes
In Atlas Search & Vector Search, create two indexes of type Vector Search on sample_mflix.embedded_movies. Use the JSON editor and the corresponding definition files:
Index name	Definition file	Vector field	Dimensions	Similarity
movie_local_vector_index	indexes/movie-local-vector-index.json	plot_embedding_embeddinggemma	768	cosine
movie_vector_index	indexes/movie-vector-index.json	plot_embedding	1536	cosine


The local index can be created before its vector field is populated. For movie-to-movie recommendations, first verify that your sample dataset contains plot_embedding arrays of length 1536. Sample dataset versions may contain different embedding fields; do not substitute vectors from another model.
Generate local movie embeddings
Keep Ollama running and execute:
npm run embed
The script processes nonblank plot strings sequentially and adds plot_embedding_embeddinggemma to each eligible document. It validates that each vector contains 768 finite numbers. Existing original embeddings are preserved.

Generation time depends on your computer and network connection to Atlas. If interrupted, rerun the command to process remaining documents. Existing local vectors are skipped, so changing the model or source summaries requires an explicit regeneration strategy.

Wait until both indexes are ready and the newly written vectors have been indexed before searching.
Usage
Search by meaning
npm run search -- "Adventurers searching for hidden treasure"
npm run search -- "Des aventuriers à la recherche d'un trésor caché"
Find similar movies
npm run similar -- "National Treasure"
The title must match an existing document. This mode retrieves six neighbors, removes the reference movie, and returns up to five recommendations. The tutorial implementation uses exact search for this mode; text search uses approximate search with numCandidates: 150 and limit: 5.
Example results
Observed during manual testing on 1,473 locally embedded movie documents. Rankings and scores can vary with the data, model version, and search settings.

Query: Adventurers searching for hidden treasure
Movie	Score
Beyond the Poseidon Adventure	0.8493
National Treasure	0.8022
Cutthroat Island	0.7906
The Librarian: Return to King Solomon's Mines	0.7849
Conan the Destroyer	0.7746


The equivalent French query returned three of the same five titles. This is an initial cross-language example, not a comprehensive relevance benchmark.

Scores measure vector similarity, not the probability that a user will like a movie. Do not compare scores across different embedding models as if they shared a calibrated relevance scale.
Project files
File	Purpose
test-connection.cjs	Check Atlas connectivity and read a sample movie title
embed-movies.cjs	Generate and store local movie-summary embeddings
search-text.cjs	Search movies from a natural-language query
search-movies.cjs	Recommend movies from an existing title
indexes/	Reproducible Atlas index definitions
.env.example	Credential-free environment template
.gitignore	Exclude .env and node_modules/
package-lock.json	Record installed dependency versions


Validation and limitations
Manual checks completed: Atlas connectivity, embedding generation for 1,473 documents, English and French text queries, title arguments, and npm commands. For one movie-reference query, approximate searches with 20 and 150 candidates returned the same five neighbors as exact search. This does not establish recall for other queries or measure performance.

No automated test suite, full-stack interface, RAG answer generation, or agent workflow is included yet. The scripts currently report error names and codes rather than full diagnostic messages. The local embedding setup uses raw movie summaries and queries; task-specific prompting and broader relevance evaluation are potential improvements.
Troubleshooting
- Atlas code 8000: check database-user credentials, their case, the selected project/cluster, and credential encoding. The Atlas website login is distinct from a database user.
- Ollama unavailable: start Ollama and confirm the local service is accessible. Ensure the model was downloaded.
- No search results: verify the database, collection, index name, vector field, index readiness, and that embeddings were generated.
- Invalid dimensions: use embeddinggemma consistently for local documents and queries; the local index expects 768 dimensions.
- Unknown film title: use a title present in the sample collection, with the exact spelling.
- Git lists .env or node_modules/: save .gitignore and verify with git check-ignore -v .env node_modules/ before staging files.
References
- Official MongoDB Vector Search quick start
- MongoDB Node.js driver
- MongoDB Vector Search query reference
- Ollama EmbeddingGemma model
- Ollama embeddings documentation
This project adapts the quick start to the embedding fields actually present in the loaded dataset, then adds local embeddings for free-form text queries.