import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (id, role) => {
    if (!confirm(`Change this user's role to "${role}"?`)) return;
    try {
      await adminAPI.updateUserRole(id, role);
      fetchUsers();
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1>Users</h1>
        <span className="admin-count">{users.length} users</span>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="td-name">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <div className="role-actions">
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
