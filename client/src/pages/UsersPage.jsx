import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { fetchUsers, createUserAccount, updateUserAccount, deactivateUserAccount } from '../services/api';

const EMPTY_FORM = { username: '', password: '', name: '', role: 'media_buyer', telegramChatId: '', telegramBotToken: '' };

function UserCard({ user, onUpdate, onDeactivate }) {
  const [draft, setDraft] = useState({
    name: user.name,
    telegramChatId: user.telegramChatId || '',
    telegramBotToken: user.telegramBotToken || '',
    role: user.role,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const original = {
    name: user.name,
    telegramChatId: user.telegramChatId || '',
    telegramBotToken: user.telegramBotToken || '',
    role: user.role,
  };
  const isDirty = JSON.stringify(draft) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(user._id, draft);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rule-card ${user.active ? '' : 'rule-disabled'}`}>
      <div className="rule-card-header">
        <div>
          <h3>{user.name}</h3>
          <p className="rule-description">@{user.username}</p>
        </div>
        <span className={`pill ${user.active ? 'pill-success' : 'pill-error'}`}>{user.active ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="rule-fields">
        <label className="field">
          <span>Name</span>
          <input type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}>
            <option value="media_buyer">Media Buyer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Telegram Bot Token (their own bot, from @BotFather)</span>
          <input
            type="text"
            value={draft.telegramBotToken}
            onChange={(e) => setDraft((d) => ({ ...d, telegramBotToken: e.target.value }))}
            placeholder="not set - they can add this from My Profile"
          />
        </label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Telegram Chat ID</span>
          <input
            type="text"
            value={draft.telegramChatId}
            onChange={(e) => setDraft((d) => ({ ...d, telegramChatId: e.target.value }))}
            placeholder="not set"
          />
        </label>
      </div>

      <div className="rule-card-footer">
        {savedAt && !isDirty && <span className="saved-indicator">Saved {savedAt.toLocaleTimeString()}</span>}
        <div style={{ display: 'flex', gap: 8 }}>
          {user.active && (
            <button className="logout-btn-light" onClick={() => onDeactivate(user._id)}>
              Deactivate
            </button>
          )}
          <button className="refresh-btn" disabled={!isDirty || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const newUser = await createUserAccount(form);
      setUsers((prev) => [...prev, newUser]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create account');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateUserAccount(id, payload);
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
  };

  const handleDeactivate = async (id) => {
    const updated = await deactivateUserAccount(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
  };

  return (
    <div className="page">
      <PageHeader title="Media Buyers" subtitle="Create accounts and control who sees which campaigns" />

      {(error || formError) && (
        <div className="error-banner">{formError || `Could not reach the API. (${error?.message})`}</div>
      )}

      <section>
        <div className="section-heading">
          <h2>Add Media Buyer</h2>
        </div>
        <form className="rule-card" onSubmit={handleCreate}>
          <p className="rule-description" style={{ marginBottom: 14 }}>
            Each buyer sets up their own Telegram bot for full privacy - leave the Telegram fields blank and they
            can fill them in themselves from "My Profile" after logging in.
          </p>
          <div className="rule-fields">
            <label className="field">
              <span>Full Name</span>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="media_buyer">Media Buyer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Telegram Bot Token (optional)</span>
              <input
                type="text"
                value={form.telegramBotToken}
                onChange={(e) => setForm((f) => ({ ...f, telegramBotToken: e.target.value }))}
              />
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Telegram Chat ID (optional)</span>
              <input
                type="text"
                value={form.telegramChatId}
                onChange={(e) => setForm((f) => ({ ...f, telegramChatId: e.target.value }))}
              />
            </label>
          </div>
          <div className="rule-card-footer">
            <button className="refresh-btn" type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="section-heading">
          <h2>All Accounts</h2>
          <span className="section-count">{users.length}</span>
        </div>
        {loading ? (
          <p className="loading-text">Loading accounts…</p>
        ) : (
          <div className="rules-grid">
            {users.map((u) => (
              <UserCard key={u._id} user={u} onUpdate={handleUpdate} onDeactivate={handleDeactivate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
