import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const UserAnalytics = () => {
  const { userId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/users/${userId}/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!analytics) {
    return <div>No analytics data found</div>;
  }

  return (
    <div>
      <h1>User Analytics</h1>
      
      <div>
        <h2>User Information</h2>
        <p>Username: {analytics.user.username}</p>
        <p>Display Name: {analytics.user.displayName}</p>
        <p>Registration Date: {new Date(analytics.user.registrationDate).toLocaleString()}</p>
      </div>

      <div>
        <h2>Activity Statistics</h2>
        <p>Total Messages: {analytics.statistics.totalMessages}</p>
        <p>Total Replies: {analytics.statistics.totalReplies}</p>
        <p>Total Posts: {analytics.statistics.totalPosts}</p>
        <p>Active Channels: {analytics.statistics.activeChannels}</p>
      </div>

      <div>
        <h2>Active Channels</h2>
        <ul>
          {analytics.statistics.channels.map(channel => (
            <li key={channel.id}>
              {channel.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserAnalytics; 