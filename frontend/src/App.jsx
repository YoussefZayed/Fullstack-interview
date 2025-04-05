import { useState } from 'react'

function App() {
  const [hashtag, setHashtag] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Using Alice's ID instead of her name
  const USER_ID = 1;

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3000/query?username=${encodeURIComponent(hashtag)}&hashtag=${USER_ID}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Birthday Likes Query</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="hashtag" style={{ marginRight: '10px' }}>
            Hashtag Filter:
          </label>
          <input
            id="hashtag"
            type="text"
            value={hashtag}
            onChange={(e) => setHashtag(e.target)}
            placeholder="Enter hashtag (optional)"
            style={{ padding: '5px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          <h2>Results:</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={tableHeaderStyle}>Friend Name</th>
                <th style={tableHeaderStyle}>Post ID</th>
                <th style={tableHeaderStyle}>Post Time</th>
                <th style={tableHeaderStyle}>Author</th>
                <th style={tableHeaderStyle}>Hashtag</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={`${result.liked_post_id}-${index}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tableCellStyle}>{result.liking_friend_name}</td>
                  <td style={tableCellStyle}>{result.liked_post_id}</td>
                  <td style={tableCellStyle}>{new Date(result.liked_post_timestamp).toLocaleString()}</td>
                  <td style={tableCellStyle}>{result.author_name}</td>
                  <td style={tableCellStyle}>{result.hashtag_text || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && (
        <p>No results found</p>
      )}
    </div>
  )
}

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6'
}

const tableCellStyle = {
  padding: '12px',
  textAlign: 'left'
}

export default App
