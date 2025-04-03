import React, { useState, useEffect } from 'react';
import { addBookmark, removeBookmark, checkBookmarkStatus } from '../services/api';
import '../styles/bookmarkButton.css';

const BookmarkButton = ({ messageId }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const { data } = await checkBookmarkStatus(messageId);
        setIsBookmarked(data.isBookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmark();
  }, [messageId]);

  const handleBookmark = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(messageId);
        setIsBookmarked(false);
      } else {
        await addBookmark(messageId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="bookmark-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
        onClick={handleBookmark}
        disabled={isLoading}
      >
        {isBookmarked ? '★' : '☆'}
      </button>
      {showTooltip && (
        <div className="bookmark-tooltip">
          {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        </div>
      )}
    </div>
  );
};

export default BookmarkButton; 