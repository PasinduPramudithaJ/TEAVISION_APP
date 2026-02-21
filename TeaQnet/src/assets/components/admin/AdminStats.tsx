import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiUser, FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { getAdminStats, AdminStats as AdminStatsType } from '../../../utils/api';

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button className="btn btn-sm btn-outline-danger ms-2" onClick={loadStats}>
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: <FiUsers />,
      color: 'primary',
      bgColor: 'bg-primary',
    },
    {
      title: 'Admin Users',
      value: stats.admin_users,
      icon: <FiShield />,
      color: 'warning',
      bgColor: 'bg-warning',
    },
    {
      title: 'Regular Users',
      value: stats.regular_users,
      icon: <FiUser />,
      color: 'info',
      bgColor: 'bg-info',
    },
    {
      title: 'Users Today',
      value: stats.users_today,
      icon: <FiCalendar />,
      color: 'success',
      bgColor: 'bg-success',
    },
    {
      title: 'Users This Week',
      value: stats.users_week,
      icon: <FiTrendingUp />,
      color: 'secondary',
      bgColor: 'bg-secondary',
    },
    {
      title: 'Users This Month',
      value: stats.users_month,
      icon: <FiTrendingUp />,
      color: 'danger',
      bgColor: 'bg-danger',
    },
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-light">Statistics & Analytics</h3>
        <button className="btn btn-primary" onClick={loadStats}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statCards.map((card, index) => (
          <div key={index} className="col-md-4 col-sm-6">
            <div className={`card ${card.bgColor} text-white shadow-lg`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-subtitle mb-2 text-white-50">{card.title}</h6>
                    <h2 className="card-title mb-0">{card.value}</h2>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.5 }}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="card bg-dark text-light shadow-lg">
        <div className="card-header">
          <h5 className="mb-0">
            <FiUsers className="me-2" />
            Recent Registrations
          </h5>
        </div>
        <div className="card-body">
          {stats.recent_users.length === 0 ? (
            <p className="text-muted text-center mb-0">No recent registrations</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.email}</td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;

