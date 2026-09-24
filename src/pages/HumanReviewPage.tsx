import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HumanReviewItem, SifPotentialLevel } from '../types';
import { useAuth } from '../auth/AuthProvider';

export const HumanReviewPage: React.FC = () => {
  const { user } = useAuth();
  // Backend state for human reviews strictly from PostgreSQL
  const [reviews, setReviews] = useState<HumanReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected item strictly from backend
  const [selectedReview, setSelectedReview] = useState<HumanReviewItem | null>(null);

  // Calibration inputs (strictly null until a review is selected or calibrated)
  const [calibratedLevel, setCalibratedLevel] = useState<SifPotentialLevel | null>(null);
  const [calibratedScore, setCalibratedScore] = useState<number | null>(null);
  const [specialistNotes, setSpecialistNotes] = useState('');

  // Filters
  const [filterTab, setFilterTab] = useState<'pending' | 'disagreements' | 'all'>('pending');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReviewQueue();
      setReviews(data || []);
      if (data && data.length > 0) {
        setSelectedReview((prev) => {
          if (!prev) return data[0];
          return data.find((d) => d.id === prev.id) || data[0];
        });
      } else {
        setSelectedReview(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review items from FastAPI backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectReview = async (item: HumanReviewItem) => {
    try {
      const detail = await api.getReviewItem(item.id);
      setSelectedReview(detail);
    } catch {
      setSelectedReview(item);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Update calibrate inputs when selectedReview changes
  useEffect(() => {
    if (selectedReview) {
      setCalibratedLevel(selectedReview.aiSifLevel || null);
      setCalibratedScore(
        selectedReview.aiSifScorePct !== null && selectedReview.aiSifScorePct !== undefined
          ? Math.round(selectedReview.aiSifScorePct)
          : null
      );
      setSpecialistNotes(selectedReview.specialistNotes || '');
    } else {
      setCalibratedLevel(null);
      setCalibratedScore(null);
      setSpecialistNotes('');
    }
  }, [selectedReview?.id]);

  // Actions with authoritative authenticated operator identity
  const handleApprove = async () => {
    if (!selectedReview) return;

    try {
      const response = await api.submitReviewDecision(
        selectedReview.id,
        'ACCEPT',
        specialistNotes
      );

      const updatedItem: HumanReviewItem = response.item || {
        ...selectedReview,
        status: response.status,
        decision: response.decision,
        verifiedBy: response.verifiedBy,
        verifiedAt: response.verifiedAt,
        specialistNotes: response.specialistNotes
      };

      setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? updatedItem : r)));
      setSelectedReview(updatedItem);
      showToast(`Certified AI classification for ${selectedReview.incidentCode}. Persisted to PostgreSQL.`);
    } catch (err: any) {
      showToast(`Error submitting approval: ${err.message}`);
    }
  };

  const handleReclassify = async () => {
    if (!selectedReview) return;

    try {
      const response = await api.submitReviewDecision(
        selectedReview.id,
        'RECLASSIFY',
        specialistNotes,
        calibratedLevel || undefined,
        calibratedScore !== null ? calibratedScore : undefined
      );

      const updatedItem: HumanReviewItem = response.item || {
        ...selectedReview,
        status: response.status,
        decision: response.decision,
        aiSifLevel: calibratedLevel,
        aiSifScorePct: calibratedScore,
        verifiedBy: response.verifiedBy,
        verifiedAt: response.verifiedAt,
        specialistNotes: response.specialistNotes
      };

      setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? updatedItem : r)));
      setSelectedReview(updatedItem);
      showToast(`Reclassified ${selectedReview.incidentCode} to ${calibratedLevel || 'Calibrated'} (${calibratedScore !== null ? `${calibratedScore}%` : 'Unchanged'}).`);
    } catch (err: any) {
      showToast(`Error submitting reclassification: ${err.message}`);
    }
  };

  const handleEscalate = async () => {
    if (!selectedReview) return;

    try {
      const response = await api.submitReviewDecision(
        selectedReview.id,
        'ESCALATE',
        specialistNotes
      );

      const updatedItem: HumanReviewItem = response.item || {
        ...selectedReview,
        status: response.status,
        decision: response.decision,
        verifiedBy: response.verifiedBy,
        verifiedAt: response.verifiedAt,
        specialistNotes: response.specialistNotes
      };

      setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? updatedItem : r)));
      setSelectedReview(updatedItem);
      showToast(`Escalated ${selectedReview.incidentCode} to Corporate HSE Board.`);
    } catch (err: any) {
      showToast(`Error submitting escalation: ${err.message}`);
    }
  };

  const handleReject = async () => {
    if (!selectedReview) return;

    try {
      const response = await api.submitReviewDecision(
        selectedReview.id,
        'REJECT',
        specialistNotes
      );

      const updatedItem: HumanReviewItem = response.item || {
        ...selectedReview,
        status: response.status,
        decision: response.decision,
        verifiedBy: response.verifiedBy,
        verifiedAt: response.verifiedAt,
        specialistNotes: response.specialistNotes
      };

      setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? updatedItem : r)));
      setSelectedReview(updatedItem);
      showToast(`Rejected AI classification for ${selectedReview.incidentCode}. Overruled as false positive.`);
    } catch (err: any) {
      showToast(`Error submitting rejection: ${err.message}`);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterTab === 'pending') return r.status === 'PENDING_REVIEW';
    if (filterTab === 'disagreements') return (r.aiConfidencePct != null && r.aiConfidencePct < 90) || r.status === 'RECLASSIFIED';
    return true;
  });

  const pendingCount = reviews.filter((r) => r.status === 'PENDING_REVIEW').length;
  const certifiedCount = reviews.filter((r) => r.status === 'CERTIFIED').length;
  const consensusRate = reviews.length > 0 ? `${((certifiedCount / reviews.length) * 100).toFixed(1)}%` : '--';

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest border border-primary/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-label-code-sm text-label-code-sm">
          <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Backend Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/50 flex items-center justify-between gap-3 text-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <span className="font-body-md text-body-md text-error">{error}</span>
          </div>
          <button
            onClick={loadReviews}
            className="px-3 py-1 rounded bg-error text-on-error font-label-code-sm text-label-code-sm flex items-center gap-1 hover:bg-error/90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Header & Sub-Bar */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div>
            <div className="flex items-center gap-space-xs mb-space-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-code-sm text-label-code-sm text-primary uppercase tracking-widest font-semibold">
                Specialist Sign-Off // PostgreSQL Authoritative Queue
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Human Review & Governance
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
              Review, calibrate, approve, reclassify, or reject AI-generated SIF classifications and barrier degradation attributions strictly sourced from PostgreSQL.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="px-space-md py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span className="font-label-code-sm text-label-code-sm text-outline">Queue:</span>
              <span className="font-label-code-md text-label-code-md text-error font-bold">
                {pendingCount} Pending
              </span>
            </div>
            <div className="px-space-md py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/40 flex items-center gap-2">
              <span className="font-label-code-sm text-label-code-sm text-outline">Consensus:</span>
              <span className="font-label-code-md text-label-code-md text-primary font-bold">
                {consensusRate}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-container-high/40">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded font-label-code-sm text-label-code-sm transition-all ${
              filterTab === 'pending'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Pending Specialist Sign-Off ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('disagreements')}
            className={`px-3 py-1.5 rounded font-label-code-sm text-label-code-sm transition-all ${
              filterTab === 'disagreements'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            High-Delta / Disagreements
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded font-label-code-sm text-label-code-sm transition-all ${
              filterTab === 'all'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            All Audited Records ({reviews.length})
          </button>
        </div>
      </section>

      {/* Split Queue Layout (4 cols list + 8 cols workspace) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* Left 4 Cols: Queue List */}
        <div className="xl:col-span-4 flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-1">
            <span className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
              Pending Verification Items
            </span>
            <span className="font-label-code-sm text-label-code-sm text-primary">
              PostgreSQL Grounded
            </span>
          </div>

          <div className="space-y-space-sm">
            {filteredReviews.length === 0 ? (
              <div className="p-space-lg rounded-xl bg-surface-container text-center flex flex-col items-center justify-center gap-space-xs border border-surface-container-high/40 py-10">
                <span className="material-symbols-outlined text-outline text-[36px]">task_alt</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Queue Cleared
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                  {filterTab === 'pending'
                    ? 'All pending classifications have been certified by safety governance.'
                    : 'No records match this filter.'}
                </p>
                <button
                  onClick={() => setFilterTab('all')}
                  className="mt-2 px-3 py-1 rounded bg-surface-container-high text-primary font-label-code-sm text-label-code-sm hover:bg-surface-bright"
                >
                  View All Records
                </button>
              </div>
            ) : (
              filteredReviews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectReview(item)}
                  className={`p-space-md rounded-xl transition-all cursor-pointer border ${
                    selectedReview?.id === item.id
                      ? 'bg-surface-container-high border-primary shadow-lg ring-1 ring-primary'
                      : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-label-code-sm text-label-code-sm text-primary font-bold">
                      {item.incidentCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-label-code-sm text-label-code-sm font-semibold ${
                        item.status === 'PENDING_REVIEW'
                          ? 'bg-amber-950/70 text-amber-300'
                          : item.status === 'CERTIFIED'
                          ? 'bg-emerald-950/70 text-emerald-300'
                          : item.status === 'RECLASSIFIED'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-rose-950/70 text-rose-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-label-code-sm text-label-code-sm text-on-surface-variant mt-2">
                    <span className="truncate max-w-[160px]">{item.siteName || 'N/A'}</span>
                    <span className="text-error font-semibold">
                      {item.aiSifScorePct !== null && item.aiSifScorePct !== undefined ? `${item.aiSifScorePct}%` : 'N/A'}{' '}
                      {item.aiSifLevel || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 8 Cols: Active Review Workspace */}
        <div className="xl:col-span-8 bg-surface-container-low p-space-xl rounded-xl shadow-md flex flex-col gap-space-lg border border-surface-container-high/40">
          {!selectedReview ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-outline gap-3 min-h-[400px]">
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
                  <span className="font-label-code-sm text-label-code-sm">Loading governance queue from PostgreSQL backend...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[42px]">fact_check</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">No Incident Selected</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                    Select an incident report from the review queue on the left to inspect AI inferences and certify safety classifications.
                  </span>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Header of Active Review */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md border-b border-surface-container-high/40">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs mb-1 flex-wrap">
                    <span className="font-label-code-md text-label-code-md text-primary font-bold">
                      {selectedReview.incidentCode}
                    </span>
                    <span className="font-label-code-sm text-label-code-sm text-outline">
                      • {selectedReview.siteName || 'N/A'} • {selectedReview.unit || 'N/A'} • {selectedReview.eventTime}
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {selectedReview.title}
                  </h2>
                  <div className="flex items-center gap-space-md mt-1 text-label-code-sm text-label-code-sm text-on-surface-variant">
                    <span>
                      Reporter:{' '}
                      <span className="text-on-surface font-semibold">
                        {selectedReview.reporter || 'Reporter Not Recorded'}
                      </span>
                    </span>
                    {selectedReview.verifiedBy && (
                      <span>
                        Verified By:{' '}
                        <span className="text-primary font-semibold">{selectedReview.verifiedBy}</span>
                        {selectedReview.verifiedAt && ` (${selectedReview.verifiedAt})`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
                    AI Inference Confidence
                  </span>
                  <span className="font-label-code-lg text-headline-md text-primary font-bold">
                    {selectedReview.aiConfidencePct !== null && selectedReview.aiConfidencePct !== undefined
                      ? `${selectedReview.aiConfidencePct}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Optical Feed: strictly show real feed if exists, otherwise explicit 'No optical evidence recorded.' */}
              {selectedReview.opticalFeed ? (
                <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container border border-surface-container-high/40">
                  <img
                    src={selectedReview.opticalFeed.imageUrl}
                    alt={selectedReview.opticalFeed.label}
                    className="w-24 h-16 object-cover rounded border border-surface-container-high"
                  />
                  <div className="flex flex-col">
                    <span className="font-label-code-sm text-label-code-sm text-primary font-bold">
                      {selectedReview.opticalFeed.camId} • {selectedReview.opticalFeed.label}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {selectedReview.opticalFeed.aiMaskNotes}
                    </span>
                    <span className="font-label-code-sm text-label-code-sm text-outline">
                      {selectedReview.opticalFeed.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container/60 border border-surface-container-high/40 text-outline">
                  <span className="material-symbols-outlined text-[18px]">no_photography</span>
                  <span className="font-label-code-sm text-label-code-sm">
                    No optical evidence recorded.
                  </span>
                </div>
              )}

              {/* Incident Narrative */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
                  Original Field Observation Log
                </span>
                <div className="p-space-md rounded-lg bg-surface-container-lowest font-body-md text-body-md text-on-surface leading-relaxed border border-surface-container-high/30">
                  {selectedReview.narrative || 'No narrative provided.'}
                </div>
              </div>

              {/* Annotated Causal Tokens (strictly persisted) */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
                  NLP Extracted Causal Tokens
                </span>
                {selectedReview.annotatedTokens && selectedReview.annotatedTokens.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.annotatedTokens.map((tok) => (
                      <div
                        key={tok.id}
                        className="px-2.5 py-1 rounded bg-surface-container font-label-code-sm text-label-code-sm flex items-center gap-1.5 border border-surface-container-high/40"
                        title={tok.description ?? undefined}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tok.type === 'critical-precursor'
                              ? 'bg-error'
                              : tok.type === 'barrier-breach'
                              ? 'bg-amber-400'
                              : tok.type === 'mitigating-action'
                              ? 'bg-primary'
                              : 'bg-purple-400'
                          }`}
                        ></span>
                        <span className="text-on-surface font-semibold">{tok.text}</span>
                        <span className="text-outline text-[10px]">({tok.weightPct}%)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded bg-surface-container/40 text-outline font-label-code-sm text-label-code-sm">
                    No annotated tokens recorded in database.
                  </div>
                )}
              </div>

              {/* AI Automated Findings Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm p-space-md rounded-lg bg-surface-container border border-surface-container-high/30">
                <div className="flex flex-col">
                  <span className="font-label-code-sm text-label-code-sm text-outline uppercase">
                    AI Classification
                  </span>
                  <span className="font-label-code-md text-label-code-md text-error font-bold">
                    {selectedReview.aiSifLevel || 'Unclassified'} {selectedReview.aiSifScorePct != null ? `(${selectedReview.aiSifScorePct}%)` : '(Score N/A)'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-code-sm text-label-code-sm text-outline uppercase">
                    Primary Standard
                  </span>
                  <span className="font-label-code-md text-label-code-md text-on-surface font-semibold truncate">
                    {selectedReview.primaryLsr || 'No Rule Assigned'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-code-sm text-label-code-sm text-outline uppercase">
                    Barrier Breakdown
                  </span>
                  <span className="font-label-code-md text-label-code-md text-amber-300 font-semibold truncate">
                    {selectedReview.barriers && selectedReview.barriers.length > 0
                      ? selectedReview.barriers.map((b) => b.name).join(', ')
                      : 'No barriers recorded'}
                  </span>
                </div>
              </div>

              {/* Specialist Calibration & Feedback Form */}
              <div className="flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-high/50 border border-surface-container-high">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      HSE Specialist Governance
                    </h3>
                  </div>
                  <span className="font-label-code-sm text-label-code-sm text-outline">
                    Current Status: <span className="text-on-surface font-semibold">{selectedReview.status}</span>
                  </span>
                </div>

                {/* Authenticated Reviewer Display (Read-Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold flex items-center gap-1">
                    <span>Authenticated Reviewer</span>
                  </label>
                  <div className="bg-surface-container px-3 py-2 rounded text-on-surface font-body-sm text-body-sm flex items-center justify-between border border-surface-container-high/50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                      <span className="font-semibold text-white">{user?.full_name || user?.email || 'Authenticated Operator'}</span>
                    </div>
                    <span className="font-label-code-sm text-[10px] text-primary uppercase bg-primary-container px-2 py-0.5 rounded font-mono">
                      {user?.role || 'Safety Engineer'}
                    </span>
                  </div>
                </div>

                {/* Classification & Score Adjusters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
                      Calibrate Classification
                    </label>
                    <select
                      value={calibratedLevel || ''}
                      onChange={(e) => setCalibratedLevel((e.target.value as SifPotentialLevel) || null)}
                      className="bg-surface-container p-2 rounded text-on-surface font-body-sm text-body-sm focus:outline-none border border-surface-container-high/50 cursor-pointer"
                    >
                      <option value="">Select Classification (or Unclassified)</option>
                      <option value="CRITICAL">CRITICAL (Tier-1 SIF Precursor)</option>
                      <option value="HIGH">HIGH (High-pSIF Near Miss)</option>
                      <option value="MODERATE">MODERATE (Operational Variance)</option>
                      <option value="LOW">LOW (Minor Hazard Observation)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                      <span className="text-outline uppercase font-semibold">
                        Calibrate SIF Probability
                      </span>
                      <span className="text-primary font-bold">
                        {calibratedScore !== null ? `${calibratedScore}%` : 'Not Calibrated'}
                      </span>
                    </div>
                    {/* `?? 0` below is ONLY the HTML range control's thumb position. The business value stays
                        null until the specialist moves the slider: the label above shows "Not Calibrated", and
                        handleReclassify sends adjustedSifScorePct only when calibratedScore !== null. */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={calibratedScore ?? 0}
                      onChange={(e) => setCalibratedScore(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Specialist Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-code-sm text-label-code-sm text-outline uppercase font-semibold">
                    Specialist Justification & Governance Log
                  </label>
                  <textarea
                    rows={3}
                    value={specialistNotes}
                    onChange={(e) => setSpecialistNotes(e.target.value)}
                    placeholder="Document your technical rationale for validation or reclassification (e.g. SWA exercised in time, valve mechanical integrity verified)..."
                    className="bg-surface-container p-space-md rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-highest border border-surface-container-high/50 resize-none"
                  />
                </div>

                {/* Governance Decision Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-space-sm pt-space-xs">
                  <button
                    onClick={handleReject}
                    className="px-space-md py-2 rounded bg-surface-container hover:bg-surface-container-highest text-outline hover:text-error font-headline-sm text-headline-sm font-semibold transition-colors flex items-center gap-1 border border-surface-container-high/40"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Reject AI Flag</span>
                  </button>

                  <button
                    onClick={handleEscalate}
                    className="px-space-md py-2 rounded bg-surface-container hover:bg-surface-container-highest text-error font-headline-sm text-headline-sm font-semibold transition-colors flex items-center gap-1 border border-error/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>Escalate to Board</span>
                  </button>

                  <button
                    onClick={handleReclassify}
                    className="px-space-md py-2 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-sm text-headline-sm font-semibold transition-colors flex items-center gap-1 border border-surface-container-high/50"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    <span>Reclassify & Calibrate</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    className="px-space-lg py-2 rounded bg-primary text-on-primary hover:bg-primary-container font-headline-sm text-headline-sm font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Certify AI Classification</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
