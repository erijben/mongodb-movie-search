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

type SearchResponse = {
  query: string
  count: number
  results: Movie[]
  error?: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null)

  async function searchMovies() {
    const text = query.trim()

    if (!text || loading) return

    setLoading(true)
    setError('')
    setMovies([])
    setSearchedQuery(null)

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(text)}`,
      )

      if (!response.ok) {
        throw new Error(
          response.status === 400
            ? 'Please enter a search between 1 and 500 characters.'
            : 'Search is currently unavailable. Please try again.',
        )
      }

      const data: SearchResponse = await response.json()

      if (!Array.isArray(data.results)) {
        throw new Error('The server returned an invalid response.')
      }

      setMovies(data.results)
      setSearchedQuery(data.query)
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
          Describe what you want to watch. Search in English or French.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void searchMovies()
        }}
      >
        <label htmlFor="movie-query">What would you like to watch?</label>

        <input
          id="movie-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Adventurers searching for hidden treasure"
          maxLength={500}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search movies'}
        </button>
      </form>

      {loading && (
        <p role="status">
          Finding movies… Your first search may take a little longer.
        </p>
      )}

      {error && <p role="alert">{error}</p>}

      <section aria-label="Search results" aria-busy={loading}>
        {searchedQuery !== null && (
          <>
            <h2>
              {movies.length === 0
                ? 'No movies found'
                : `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'} found`}
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

      <p>Similarity score: {movie.score.toFixed(4)}</p>
    </div>
  </article>
))}
      </section>
    </main>
  )
}

export default App