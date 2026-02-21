import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiShield, FiShieldOff, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { getAllUsers, deleteUser, toggleAdminStatus, updateUser, AdminUser } from '../../../utils/api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('User deleted successfully');
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'demote from admin' : 'promote to admin';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await toggleAdminStatus(userId);
      alert(`User ${action} successfully`);
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update admin status');
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    if (!editEmail.trim()) {
      alert('Email is required');
      return;
    }

    try {
      await updateUser(editingUser.id, editEmail, editPassword || undefined);
      alert('User updated successfully');
      setEditingUser(null);
      setEditEmail('');
      setEditPassword('');
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditEmail('');
    setEditPassword('');
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUserEmail = (() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser).email;
      } catch {
        return '';
      }
    }
    return '';
  })();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-light">User Management</h3>
        <button className="btn btn-primary" onClick={loadUsers}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <FiSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button type="button" className="btn-close" onClick={handleCancelEdit}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card bg-dark text-light">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-dark table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      {searchTerm ? 'No users found matching your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="badge bg-warning">
                            <FiShield /> Admin
                          </span>
                        ) : (
                          <span className="badge bg-secondary">User</span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            disabled={user.email === currentUserEmail}
                            title={user.is_admin ? 'Demote from Admin' : 'Promote to Admin'}
                          >
                            {user.is_admin ? <FiShieldOff /> : <FiShield />}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id, user.email)}
                            disabled={user.email === currentUserEmail}
                            title="Delete User"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-muted">
            Total Users: {filteredUsers.length} / {users.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

