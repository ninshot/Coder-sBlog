import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/searchPage.css';

const SearchPage = () => {
  const [searchType, setSearchType] = useState('content'); // 'content', 'users', or 'channels'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('most'); // 'most' or 'least'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const performSearch = async (query = searchQuery) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let url;
      
      if (searchType === 'content') {
        url = `http://localhost:8000/api/search?q=${encodeURIComponent(query)}`;
      } else if (searchType === 'users') {
        url = `http://localhost:8000/api/search/user-posts?sort=${sortType}`;
      } else if (searchType === 'channels') {
        url = `http://localhost:8000/api/search/channel-posts?sort=${sortType}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(searchType === 'content' ? data.results : 
                searchType === 'users' ? data.users : 
                data.channels);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleResultClick = (result) => {
    if (searchType === 'content') {
      navigate(`/channels/${result.channel_id}`);
    } else if (searchType === 'channels') {
      navigate(`/channels/${result.id}`);
    }
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
    if (searchType !== 'content') {
      performSearch();
    }
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setResults([]);
  };

  const renderResults = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (results.length === 0) return <div className="no-results">No results found</div>;

    if (searchType === 'content') {
      return results.map((result) => (
        <div 
          key={result.id} 
          className="result-item"
          onClick={() => handleResultClick(result)}
        >
          <div className="result-header">
            <div className="result-user-info">
              <span className="result-display-name">{result.author}</span>
              <span className="result-channel-name">Channel: {result.channel_name}</span>
            </div>
            <span className="result-type">{result.type}</span>
          </div>
          <div className="result-title">{result.title}</div>
          <div className="result-content">{result.content}</div>
          <div className="result-footer">
            <div className="result-votes">
              <span className="upvotes">↑ {result.upvotes || 0}</span>
              <span className="downvotes">↓ {result.downvotes || 0}</span>
            </div>
            <span>{new Date(result.created_at).toLocaleString('en-US', { 
              timeZone: 'America/Regina',
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        </div>
      ));
    } else if (searchType === 'users') {
      return results.map((user) => (
        <div key={user.id} className="result-item">
          <div className="result-header">
            <div className="result-user-info">
              <span className="result-display-name">{user.displayName}</span>
              <span className="result-username">@{user.username}</span>
            </div>
            <div className="result-post-count">
              <strong>{user.totalPosts}</strong> posts
            </div>
          </div>
        </div>
      ));
    } else {
      // Render channel post count results
      return results.map((channel) => (
        <div 
          key={channel.id} 
          className="result-item"
          onClick={() => handleResultClick(channel)}
        >
          <div className="result-header">
            <div className="result-user-info">
              <span className="result-display-name">{channel.name}</span>
              <span className="result-channel-name">{channel.memberCount} members</span>
            </div>
            <div className="result-post-count">
              <strong>{channel.totalPosts}</strong> posts
            </div>
          </div>
          {channel.description && (
            <div className="result-content">{channel.description}</div>
          )}
        </div>
      ));
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h2>Search Messages, Replies, and Users</h2>
      </div>
      <div className="search-container">
        <div className="search-form">
          <select 
            value={searchType} 
            onChange={handleSearchTypeChange}
            className="search-type-select"
          >
            <option value="content">Search Content</option>
            <option value="users">Search Users by Posts</option>
            <option value="channels">Search Channels by Posts</option>
          </select>

          {searchType === 'content' ? (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages and replies..."
              className="search-input"
            />
          ) : (
            <select
              value={sortType}
              onChange={handleSortChange}
              className="search-input"
            >
              <option value="most">Most Posts</option>
              <option value="least">Least Posts</option>
            </select>
          )}
          
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
      </div>

      <div className="search-results">
        {renderResults()}
      </div>
    </div>
  );
};

export default SearchPage; 