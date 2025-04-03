import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/searchPage.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (result) => {
    navigate(`/channels/${result.channel_id}`);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h2>Search Messages and Replies</h2>
      </div>
      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter your search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      {loading && <div className="loading">Searching...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && results.length === 0 && searchQuery && (
        <div className="no-results">No results found</div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div 
              key={result.id} 
              className="result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="result-header">
                <span className="result-type">{result.type}</span>
                <span className="result-channel">{result.channel_name}</span>
              </div>
              <div className="result-title">{result.title}</div>
              <div className="result-content">{result.content}</div>
              <div className="result-footer">
                <span>By {result.display_name}</span>
                <span>{new Date(result.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage; 