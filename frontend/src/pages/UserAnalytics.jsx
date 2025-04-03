import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './UserAnalytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

  const chartData = {
    labels: ['Messages', 'Replies', 'Posts', 'Active Channels'],
    datasets: [
      {
        label: 'User Activity',
        data: analytics ? [
          analytics.statistics.totalMessages,
          analytics.statistics.totalReplies,
          analytics.statistics.totalPosts,
          analytics.statistics.activeChannels
        ] : [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Activity Overview',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  if (loading) {
    return (
      <div className="user-analytics">
        <div className="analytics-container">
          <div className="loading">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-analytics">
        <div className="analytics-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="user-analytics">
        <div className="analytics-container">
          <div className="error">No analytics data found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-analytics">
      <div className="analytics-container">
        <div className="analytics-header">
          <h1 className="analytics-title">User Analytics</h1>
        </div>

        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>

        <table className="analytics-table">
          <thead className="table-header">
            <tr>
              <th>User Information</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-row">
              <td className="table-cell">Username</td>
              <td className="table-cell">{analytics.user.username}</td>
            </tr>
            <tr className="table-row">
              <td className="table-cell">Display Name</td>
              <td className="table-cell">{analytics.user.displayName}</td>
            </tr>
            <tr className="table-row">
              <td className="table-cell">Registration Date</td>
              <td className="table-cell">
                {new Date(analytics.user.registrationDate).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="statistics-table">
          <thead>
            <tr>
              <th>Activity Statistics</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Messages</td>
              <td>{analytics.statistics.totalMessages}</td>
            </tr>
            <tr>
              <td>Total Replies</td>
              <td>{analytics.statistics.totalReplies}</td>
            </tr>
            <tr>
              <td>Total Posts</td>
              <td>{analytics.statistics.totalPosts}</td>
            </tr>
            <tr>
              <td>Active Channels</td>
              <td>{analytics.statistics.activeChannels}</td>
            </tr>
          </tbody>
        </table>

        <table className="channels-table">
          <thead>
            <tr>
              <th>Active Channels</th>
            </tr>
          </thead>
          <tbody>
            {analytics.statistics.channels.map(channel => (
              <tr key={channel.id}>
                <td>{channel.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAnalytics; 