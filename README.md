# Movie Semantic Search

Discover movies by describing what you want to watch in English or French. Get an AI recommendation in English with citations and inspectable sources.

Built with **React, TypeScript, Express, MongoDB Atlas Vector Search, and Ollama**, using local AI models without a paid AI API.

## Features

- Semantic search across 1,473 locally embedded movie summaries.
- AI recommendations with numbered citations and expandable sources.
- Responsive movie cards with posters, genres, summaries, and similarity scores.
- CLI tools for text search, similar movies, and RAG recommendations.
- Resumable local embedding generation.

## How it works

1. Ollama converts the query into a 768-dimensional vector using `embeddinggemma`.
2. MongoDB Atlas Vector Search retrieves up to five matching movie summaries.
3. The local `qwen2.5:3b` model generates a recommendation using those summaries.
4. React displays the answer, source citations, and retrieved movies.

Movie summaries and text queries use the same embedding model. Movie-to-movie CLI recommendations use the dataset’s original 1,536-dimensional `plot_embedding` vectors through a separate index.

## Getting started

### Prerequisites

- Node.js 24 and npm.
- Ollama installed and running locally.
- MongoDB Atlas with `sample_mflix.embedded_movies` loaded.
- An Atlas database user with read/write access and your current IP allowed.

### 1. Install

```powershell
git clone https://github.com/erijben/mongodb-movie-search.git
cd mongodb-movie-search
npm ci
Copy-Item .env.example .env
ollama pull embeddinggemma
ollama pull qwen2.5:3b
```

Configure `.env`:

```dotenv
MONGODB_URI="YOUR_ATLAS_CONNECTION_STRING"
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_EMBED_MODEL=embeddinggemma
OLLAMA_CHAT_MODEL=qwen2.5:3b
```

Keep `.env` private and excluded from Git. Model downloads require local disk space and memory.

### 2. Configure Atlas

Create these indexes with type **Vector Search** on `sample_mflix.embedded_movies`, using the supplied JSON definitions:

| Index name | Definition |
| --- | --- |
| `movie_local_vector_index` | `indexes/movie-local-vector-index.json` |
| `movie_vector_index` | `indexes/movie-vector-index.json` |

The local index uses `plot_embedding_embeddinggemma` with 768 dimensions. The movie-to-movie index requires `plot_embedding` vectors with 1,536 dimensions from the original dataset.

Generate local embeddings:

```powershell
npm run check-connection
npm run embed
```

Existing local embeddings are skipped. Wait until the local index is ready and the generated vectors have been indexed.

### 3. Start the application

Keep Ollama running.

In a terminal at the project root:

```powershell
node server.cjs
```

In another terminal at the project root:

```powershell
cd client
npm ci
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

## Try it

In the web interface:

> Recommend a pirate treasure-hunting movie and explain why.

> Recommande un film sur des aventuriers à la recherche d’un trésor.

CLI semantic search and similar-movie recommendations:

```powershell
npm run search -- "Adventurers searching for hidden treasure"
npm run similar -- "National Treasure"
```

CLI RAG recommendation, with the Express server running:

```powershell
node rag-movies.cjs "Recommend a pirate treasure-hunting movie and explain why."
```

An optional second argument specifies a focused retrieval query:

```powershell
node rag-movies.cjs "Recommend a pirate movie. Is it on Netflix France today?" "Pirates searching for hidden treasure"
```

## Validation and limitations

Manually checked: English and French searches, CLI and web RAG recommendations, source correspondence for a sample answer, responsive layouts, and missing-poster fallback.

The frontend build passed:

```powershell
cd client
npm run build
```

- Generated answers may contain errors. Citation validation checks source IDs, not whether every claim is supported.
- Retrieved movies may include irrelevant results.
- Similarity scores measure vector proximity, not the probability of user preference.
- Current streaming availability is not included in the dataset.
- The application runs locally. Hosting React alone does not provide Express or Ollama.
- This is a RAG pipeline; agent orchestration is not implemented.

## References

- [MongoDB Vector Search tutorial](https://www.mongodb.com/docs/vector-search/tutorials/quick-start/)
- [Ollama EmbeddingGemma](https://ollama.com/library/embeddinggemma)
- [Ollama Qwen2.5](https://ollama.com/library/qwen2.5:3b)

Built by **Erij Ben Amor**, extending the official MongoDB tutorial with local embeddings, a React interface, and RAG recommendations.