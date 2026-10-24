import { useState } from 'react'
import './App.css'

type Movie = {
  title: string
  plot?: string
  year?: number
  genres?: string[]
  score: number
  poster?: string
}

type Source = {
  id: number
  title: string
  plot: string
}

type SearchResponse = {
  question: string
  retrievalQuery: string
  answer: string
  sources: Source[]
  results: Movie[]
}

function MoviePoster({
  src,
  title,
}: {
  src?: string
  title: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="movie-poster poster-placeholder">
        <span>No poster available</span>
      </div>
    )
  }

  return (
    <img
      className="movie-poster"
      src={src}
      alt={`Poster for ${title}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null)

  async function searchMovies() {
    const text = query.trim()

    if (!text || loading) return

    setLoading(true)
    setError('')
    setMovies([])
    setAnswer('')
    setSources([])
    setSearchedQuery(null)

    try {
      const response = await fetch(
        `/api/ask?q=${encodeURIComponent(text)}`,
      )

      if (!response.ok) {
        throw new Error(
          response.status === 400
            ? 'Please enter a question between 1 and 500 characters.'
            : 'Recommendations are currently unavailable. Please try again.',
        )
      }

      const data: SearchResponse = await response.json()

      if (
        !Array.isArray(data.results) ||
        !Array.isArray(data.sources) ||
        typeof data.answer !== 'string' ||
        typeof data.question !== 'string'
      ) {
        throw new Error('The server returned an invalid response.')
      }

      setMovies(data.results)
      setAnswer(data.answer)
      setSources(data.sources)
      setSearchedQuery(data.question)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <header>
        <h1>Movie Semantic Search</h1>
        <p>
          Describe what you want to watch. Search in English or French
          and get an AI recommendation with sources.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void searchMovies()
        }}
      >
        <label htmlFor="movie-query">
          What would you like to watch?
        </label>

        <input
          id="movie-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Recommend a pirate treasure-hunting movie and explain why."
          maxLength={500}
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
        >
          {loading ? 'Thinking…' : 'Recommend a movie'}
        </button>
      </form>

      {loading && (
        <p role="status">
          Finding matching movies and generating a recommendation…
          This may take a little time on your computer.
        </p>
      )}

      {error && <p role="alert">{error}</p>}

      {answer && (
        <aside
          className="assistant-answer"
          aria-label="AI recommendation"
        >
          <h2>AI recommendation</h2>

          <p className="answer-text">{answer}</p>

          {sources.length > 0 && (
            <details>
              <summary>
                View retrieved sources ({sources.length})
              </summary>

              <ul className="source-list">
                {sources.map((source) => (
                  <li key={source.id}>
                    <strong>
                      [{source.id}] {source.title}
                    </strong>
                    <p>{source.plot}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <small>
            Generated from the retrieved movie summaries. Check the
            sources to verify the explanation.
          </small>
        </aside>
      )}

      <section
        aria-label="Search results"
        aria-busy={loading}
      >
        {searchedQuery !== null && (
          <>
            <h2>
              {movies.length === 0
                ? 'No movies found'
                : `${movies.length} ${
                    movies.length === 1 ? 'movie' : 'movies'
                  } found`}
            </h2>

            <p>Results for “{searchedQuery}”</p>
          </>
        )}

        {movies.map((movie, index) => (
          <article
            className="movie-card"
            key={`${movie.title}-${movie.year}-${index}`}
          >
            <MoviePoster
              key={movie.poster || 'no-poster'}
              src={movie.poster}
              title={movie.title}
            />

            <div className="movie-content">
              <h3>
                {movie.title}
                {movie.year ? ` (${movie.year})` : ''}
              </h3>

              {movie.genres?.length ? (
                <p>{movie.genres.join(' · ')}</p>
              ) : null}

              <p>{movie.plot || 'No synopsis available.'}</p>

              <p>
                Similarity score: {movie.score.toFixed(4)}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App