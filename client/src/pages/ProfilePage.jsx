import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMyProfile, updateMyProfile, fetchRules } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [rules, setRules] = useState([]);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [mutedRuleTypes, setMutedRuleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([fetchMyProfile(), fetchRules()])
      .then(([profileData, rulesData]) => {
        setProfile(profileData);
        setTelegramChatId(profileData.telegramChatId || '');
        setTelegramBotToken(profileData.telegramBotToken || '');
        setMutedRuleTypes(profileData.mutedRuleTypes || []);
        setRules(rulesData);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const toggleMute = (ruleType) => {
    setMutedRuleTypes((prev) =>
      prev.includes(ruleType) ? prev.filter((t) => t !== ruleType) : [...prev, ruleType]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile({ telegramChatId, telegramBotToken, mutedRuleTypes });
      setProfile(updated);
      showToast('Profile saved');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="My Profile" subtitle="Set up your own Telegram bot so your alerts come only to you" />

      {error && (
        <div className="error-banner">Could not reach the API. Is the backend server running? ({error.message})</div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading profile…" />
      ) : (
        <div className="rule-card profile-card">
          <div className="profile-info">
            <div className="metric">
              <span className="metric-label">Name</span>
              <span className="metric-value">{profile.name}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Username</span>
              <span className="metric-value">{profile.username}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Role</span>
              <span className="metric-value">{profile.role === 'admin' ? 'Admin' : 'Media Buyer'}</span>
            </div>
          </div>

          <div className="setup-steps">
            <p className="rule-description">
              <strong>Each person uses their own bot</strong> - your alerts stay private, nobody else (not even
              the admin) can read your bot's messages.
            </p>
            <ol className="rule-description setup-steps-list">
              <li>Message <strong>@BotFather</strong> on Telegram, send <code>/newbot</code>, follow the prompts</li>
              <li>Copy the token it gives you into "Bot Token" below</li>
              <li>Search for your new bot and send it any message (e.g. "hi")</li>
              <li>
                Visit <code>https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates</code> in a browser and copy the
                number after <code>"chat":{'{'}"id":</code> into "Chat ID" below
              </li>
            </ol>
          </div>

          <form onSubmit={handleSave}>
            <label className="field">
              <span>Your Telegram Bot Token</span>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="from @BotFather"
              />
            </label>
            <label className="field">
              <span>Your Telegram Chat ID</span>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 123456789"
              />
            </label>

            <div className="mute-rules">
              <span className="mute-rules-label">Notify me for these alerts</span>
              {rules.map((rule) => (
                <label key={rule._id} className="mute-rule-row">
                  <span>{rule.name}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!mutedRuleTypes.includes(rule.type)}
                      onChange={() => toggleMute(rule.type)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </label>
              ))}
              <p className="rule-description">
                Turn a rule off here and it still runs and shows in Alert History, just without a Telegram message.
              </p>
            </div>

            <div className="rule-card-footer">
              <button className="refresh-btn" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
