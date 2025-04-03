import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.isAdmin) {
      navigate("/channels");
      return;
    }

    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, channelsRes] = await Promise.all([
        fetch("http://localhost:8000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("http://localhost:8000/api/channels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!usersRes.ok || !channelsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const channelsData = await channelsRes.json();

      setUsers(usersData);
      setChannels(channelsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/admin/users/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        setUsers(users.filter((user) => user.id !== userId));
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this channel? This will also delete all messages and replies in this channel."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/admin/channels/${channelId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete channel");
        }

        setChannels(channels.filter((channel) => channel.id !== channelId));
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const user = users.find(u => u.id === userId);
      const response = await fetch(
        `http://localhost:8000/api/admin/users/${userId}/toggle-admin`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAdmin: !user.isAdmin }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u
      ));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab("users")}
              className={`tab-button ${activeTab === "users" ? "active" : "inactive"}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`tab-button ${activeTab === "channels" ? "active" : "inactive"}`}
            >
              Channels
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 className="section-title">Users Management</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Admin Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`table-row ${user.isAdmin ? "admin" : ""}`}
                    >
                      <td className="table-cell">{user.id}</td>
                      <td className="table-cell">{user.username}</td>
                      <td className="table-cell">{user.displayName}</td>
                      <td className="table-cell">
                        {user.isAdmin ? "Admin" : "User"}
                      </td>
                      <td className="table-cell secondary">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleToggleAdmin(user.id)}
                          className={`action-button ${user.isAdmin ? "remove-admin-button" : "make-admin-button"}`}
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === 1}
                          className="action-button delete-button"
                        >
                          Delete
                        </button>
                        <Link 
                          to={`/users/${user.id}/analytics`}
                          className="action-button analytics-button"
                        >
                          View Analytics
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "channels" && (
          <div>
            <h2 className="section-title">Channels Management</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel) => (
                    <tr
                      key={channel.id}
                      className="table-row"
                    >
                      <td className="table-cell">{channel.id}</td>
                      <td className="table-cell">{channel.name}</td>
                      <td className="table-cell">{channel.description}</td>
                      <td className="table-cell secondary">
                        {new Date(channel.created_at).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="action-button delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 