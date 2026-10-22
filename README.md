# Movie Semantic Search

Find movies by describing what you want to watch—in English or French.

A full-stack application built with **React, TypeScript, Express, MongoDB Atlas Vector Search, and Ollama**, using local embeddings without a paid AI API.

## Features

- Natural-language search across 1,473 embedded movie summaries.
- Responsive movie cards with posters, genres, summaries, and similarity scores.
- English interface supporting English and French queries.
- Similar-movie recommendations through the CLI.
- Resumable local embedding generation.

## How it works

React sends a query to Express. Ollama converts it into a 768-dimensional embedding, then MongoDB Atlas Vector Search retrieves the five closest movie summaries.

Movie summaries and search queries use the same model: `embeddinggemma`.

## Getting started

### Prerequisites

- Node.js 24 and npm.
- Ollama running locally.
- MongoDB Atlas with `sample_mflix.embedded_movies` loaded.
- A database user with read/write access and your IP allowed in Atlas.

### 1. Install

```powershell
git clone https://github.com/erijben/mongodb-movie-search.git
cd mongodb-movie-search
npm ci
Copy-Item .env.example .env
ollama pull embeddinggemma
```

Add your Atlas connection string to `.env`:

```dotenv
MONGODB_URI="YOUR_ATLAS_CONNECTION_STRING"
```

Keep `.env` private and excluded from Git.

### 2. Configure Atlas

Create these **Vector Search** indexes on `sample_mflix.embedded_movies`, using the JSON definitions provided:

| Index name | Definition |
| --- | --- |
| `movie_local_vector_index` | `indexes/movie-local-vector-index.json` |
| `movie_vector_index` | `indexes/movie-vector-index.json` |

The local index uses `plot_embedding_embeddinggemma` with 768 dimensions. The recommendation index requires the dataset's original `plot_embedding` field with 1,536 dimensions.

Generate the local embeddings:

```powershell
npm run check-connection
npm run embed
```

Existing local embeddings are skipped. Wait for Atlas to finish indexing before searching.

### 3. Start the application

In a terminal at the project root:

```powershell
node server.cjs
```

In a second terminal at the project root:

```powershell
cd client
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Try it

Enter a phrase in the web interface:

> Adventurers searching for hidden treasure

> Des aventuriers à la recherche d'un trésor caché

Or use the CLI:

```powershell
npm run search -- "Adventurers searching for hidden treasure"
npm run similar -- "National Treasure"
```

## Validation

Manually tested: English and French searches, movie recommendations, desktop/mobile layouts, and missing-poster fallback.

Build the frontend from `client`:

```powershell
npm run build
```

Similarity scores represent vector proximity, not a probability of user preference.

## Scope

Runs locally with Express, Ollama, and Atlas. Hosting the frontend alone will not provide the backend or Ollama service. RAG answer generation and AI agents are not implemented.

## References

- [MongoDB Vector Search tutorial](https://www.mongodb.com/docs/vector-search/tutorials/quick-start/)
- [Ollama EmbeddingGemma](https://ollama.com/library/embeddinggemma)

Built by **Erij Ben Amor**, extending the official MongoDB tutorial with local embeddings and a React interface.