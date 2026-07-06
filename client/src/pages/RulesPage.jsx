import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRules, updateRule } from '../services/api';
import { useToast } from '../context/ToastContext';

const THRESHOLD_LABELS = {
  LANDING_CLICK_COUNT: 'Min. landing clicks',
  GCLID_COUNT: 'Min. unique GCLIDs',
  SPEND_LIMIT: 'Spend limit ($)',
  HIGH_CLICKS_LOW_GCLID: 'Min. clicks',
  HIGH_SPEND_ZERO_CONVERSIONS: 'Spend limit ($)',
};

function RuleCard({ rule, onSave }) {
  const [draft, setDraft] = useState(rule);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(rule);

  const handleChange = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rule._id, {
        enabled: draft.enabled,
        threshold: Number(draft.threshold),
        secondaryThreshold: draft.secondaryThreshold != null ? Number(draft.secondaryThreshold) : null,
        windowMinutes: Number(draft.windowMinutes),
        cooldownMinutes: Number(draft.cooldownMinutes),
      });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rule-card ${draft.enabled ? '' : 'rule-disabled'}`}>
      <div className="rule-card-header">
        <div>
          <h3>{rule.name}</h3>
          <p className="rule-description">{rule.description}</p>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="rule-fields">
        <label className="field">
          <span>{THRESHOLD_LABELS[rule.type] || 'Threshold'}</span>
          <input
            type="number"
            value={draft.threshold}
            onChange={(e) => handleChange('threshold', e.target.value)}
          />
        </label>

        {rule.secondaryThreshold != null && (
          <label className="field">
            <span>Max GCLIDs (still "low")</span>
            <input
              type="number"
              value={draft.secondaryThreshold ?? ''}
              onChange={(e) => handleChange('secondaryThreshold', e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Window (minutes)</span>
          <input
            type="number"
            value={draft.windowMinutes}
            onChange={(e) => handleChange('windowMinutes', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Cooldown (minutes)</span>
          <input
            type="number"
            value={draft.cooldownMinutes}
            onChange={(e) => handleChange('cooldownMinutes', e.target.value)}
          />
        </label>
      </div>

      <div className="rule-card-footer">
        {savedAt && !isDirty && <span className="saved-indicator">Saved {savedAt.toLocaleTimeString()}</span>}
        <button className="refresh-btn" disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    fetchRules()
      .then(setRules)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (id, payload) => {
    const updated = await updateRule(id, payload);
    setRules((prev) => prev.map((r) => (r._id === id ? updated : r)));
    showToast(`"${updated.name}" saved`);
  };

  return (
    <div className="page">
      <PageHeader title="Alert Rules" subtitle="Tune thresholds without touching code - changes apply on the next monitoring cycle" />

      {error && (
        <div className="error-banner">Could not reach the API. Is the backend server running? ({error.message})</div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading rules…" />
      ) : (
        <div className="rules-grid">
          {rules.map((rule) => (
            <RuleCard key={rule._id} rule={rule} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
