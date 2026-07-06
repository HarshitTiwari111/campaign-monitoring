import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatsOverview from '../components/StatsOverview';
import CampaignCard from '../components/CampaignCard';
import CampaignTable from '../components/CampaignTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { usePolling } from '../hooks/usePolling';
import { fetchCampaigns, fetchAlertHistory, fetchUsers, assignCampaign } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 15000;
const MAX_ATTENTION_CARDS = 6;

export default function OverviewPage() {
  const { isAdmin } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mediaBuyers, setMediaBuyers] = useState(null);
  const [campaignSearch, setCampaignSearch] = useState('');

  const {
    data: campaigns,
    error: campaignsError,
    loading: campaignsLoading,
    refresh: refreshCampaigns,
  } = usePolling(async () => {
    const result = await fetchCampaigns();
    setLastUpdated(new Date());
    return result;
  }, POLL_INTERVAL_MS);

  const { data: alertsResponse, error: alertsError, refresh: refreshAlerts } = usePolling(
    () => fetchAlertHistory({ limit: 20 }),
    POLL_INTERVAL_MS
  );

  // Only admins can assign campaigns, so only admins need the buyer list.
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
        .then((users) => setMediaBuyers(users.filter((u) => u.active)))
        .catch(() => setMediaBuyers([]));
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    refreshCampaigns();
    refreshAlerts();
  };

  const handleAssign = async (campaignId, userId) => {
    await assignCampaign(campaignId, userId);
    refreshCampaigns();
  };

  const campaignList = campaigns || [];
  const alerts = alertsResponse?.data || [];

  // Cards are a "needs attention" panel, not a full listing - the table below
  // stays the source of truth for every campaign. Keeps the card grid usable
  // whether there are 5 campaigns or 500.
  const attentionCampaigns = campaignList.filter((c) => c.status !== 'HEALTHY');
  const visibleAttentionCampaigns = attentionCampaigns.slice(0, MAX_ATTENTION_CARDS);
  const hiddenAttentionCount = attentionCampaigns.length - visibleAttentionCampaigns.length;

  const filteredCampaigns = campaignSearch
    ? campaignList.filter((c) => c.campaignName.toLowerCase().includes(campaignSearch.toLowerCase()))
    : campaignList;

  return (
    <div className="page">
      <PageHeader
        title="Overview"
        subtitle="Live campaign performance & alert status"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      {(campaignsError || alertsError) && (
        <div className="error-banner">
          Could not reach the API. Is the backend server running? ({(campaignsError || alertsError).message})
        </div>
      )}

      <StatsOverview campaigns={campaignList} alerts={alerts} />

      <section>
        <div className="section-heading">
          <h2>Needs Attention</h2>
          {attentionCampaigns.length > 0 && <span className="section-count">{attentionCampaigns.length}</span>}
        </div>
        {campaignsLoading ? (
          <LoadingSpinner label="Loading campaigns…" />
        ) : attentionCampaigns.length === 0 ? (
          <div className="all-clear">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            All campaigns are healthy - nothing needs attention right now.
          </div>
        ) : (
          <>
            <div className="card-grid">
              {visibleAttentionCampaigns.map((c) => (
                <CampaignCard key={c.campaignId} campaign={c} />
              ))}
            </div>
            {hiddenAttentionCount > 0 && (
              <p className="overflow-note">
                +{hiddenAttentionCount} more need attention - see the full list below.
              </p>
            )}
          </>
        )}
      </section>

      <section>
        <div className="section-heading">
          <h2>{isAdmin ? 'All Campaigns' : 'My Campaigns'}</h2>
          <span className="section-count">{filteredCampaigns.length}</span>
        </div>
        <div className="filter-bar">
          <label className="field field-search">
            <span>Search campaign</span>
            <input
              type="text"
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              placeholder="e.g. Weight Loss"
            />
          </label>
        </div>
        <CampaignTable
          campaigns={filteredCampaigns}
          mediaBuyers={isAdmin ? mediaBuyers || [] : undefined}
          onAssign={isAdmin ? handleAssign : undefined}
        />
      </section>
    </div>
  );
}
