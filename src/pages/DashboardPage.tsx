import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, DashboardMetrics, FacilityItem } from '../services/api';
import { SiteAsset, SafetyRule, DashboardPriorityAction } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('12W');
  const [chartView, setChartView] = useState<'freq' | 'decay'>('freq');
  const [lsrCategory, setLsrCategory] = useState<'all' | 'critical' | 'mechanical'>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'compiling' | 'ready'>('idle');

  // Backend state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [facilitiesList, setFacilitiesList] = useState<FacilityItem[]>([]);
  const [backendSites, setBackendSites] = useState<SiteAsset[]>([]);
  const [backendRules, setBackendRules] = useState<SafetyRule[]>([]);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [priorityActions, setPriorityActions] = useState<DashboardPriorityAction[]>([]);
  const [priorityActionsError, setPriorityActionsError] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, s, r, t, f] = await Promise.all([
        api.getDashboardMetrics(selectedAsset, timeframe),
        api.getSitesTelemetry(tableSearch),
        api.getDashboardRules(lsrCategory),
        api.getDashboardTelemetry(timeframe),
        api.getFacilities(),
      ]);
      setMetrics(m);
      setBackendSites(s || []);
      setBackendRules(r || []);
      setTelemetryData(t || []);
      setFacilitiesList(f || []);
    } catch (err: any) {
      setError(err.message || 'Cannot connect to FastAPI backend on port 8000');
    }

    try {
      const pa = await api.getDashboardPriorityActions();
      setPriorityActions(pa || []);
      setPriorityActionsError(null);
    } catch (paErr: any) {
      setPriorityActions([]);
      setPriorityActionsError('Priority actions unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset, timeframe, tableSearch, lsrCategory]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dynamic SVG path calculation based strictly on backend telemetry records
  const dynamicSvg = useMemo(() => {
    // Only plot actual numeric observations - do NOT convert NULL measurements into 0
    const validObservations = (telemetryData || []).filter(
      (d) =>
        d &&
        d.precursorVolume !== null &&
        d.precursorVolume !== undefined &&
        typeof d.precursorVolume === 'number' &&
        !isNaN(d.precursorVolume)
    );

    if (validObservations.length < 2) {
      return {
        linePath: '',
        areaPath: '',
        points: [],
        currentVal: null,
        peakPoint: null,
        thresholdY: null,
        insufficientData: true
      };
    }
    const width = 700;
    const height = 240;
    const padX = 40;
    const padY = 40;

    const values = validObservations.map((d) =>
      chartView === 'freq' ? d.precursorVolume : Math.max(0, 100 - d.precursorVolume)
    );
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, metrics?.executiveSifThreshold != null ? metrics.executiveSifThreshold : 1);
    const range = maxVal - minVal || 1;

    const pts = validObservations.map((d, idx) => {
      const x = padX + (idx / Math.max(1, validObservations.length - 1)) * (width - 2 * padX);
      const val = chartView === 'freq' ? d.precursorVolume : Math.max(0, 100 - d.precursorVolume);
      const y = height - padY - ((val - minVal) / range) * (height - 2 * padY);
      return { x: Math.round(x), y: Math.round(y), val, week: d.week };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = pts.length > 0 ? `${linePath} L ${pts[pts.length - 1].x} 220 L ${pts[0].x} 220 Z` : '';

    let peak = pts[0];
    for (const p of pts) {
      if (p.val > (peak ? peak.val : -Infinity)) peak = p;
    }

    const thresholdY = (metrics?.executiveSifThreshold != null && chartView === 'freq')
      ? Math.round(height - padY - ((metrics.executiveSifThreshold - minVal) / range) * (height - 2 * padY))
      : null;

    return {
      linePath,
      areaPath,
      points: pts,
      currentVal: values[values.length - 1],
      peakPoint: peak,
      thresholdY,
      lastPoint: pts[pts.length - 1] ?? null,
      insufficientData: false
    };
  }, [telemetryData, chartView, metrics?.executiveSifThreshold]);

  // Interventions action handler - Authoritative PostgreSQL resolution
  const handleActionClick = async (action: DashboardPriorityAction) => {
    if (!action.sourceRecordId) {
      showToast('No source record available.');
      return;
    }

    if (action.status === 'dispatched' || action.dispatchedInterventionCode) {
      navigate('/interventions');
      return;
    }

    setDispatchingId(action.id);
    setDispatchError(null);

    try {
      // Send only the necessary user action/reference to FastAPI
      // FastAPI retrieves the authoritative data from PostgreSQL and creates the intervention
      const created = await api.createInterventionFromPrecursor({
        precursorId: action.sourceRecordId,
        actionType: 'DISPATCH_CAPA'
      });

      // Update authoritative state from FastAPI response
      setPriorityActions((prev) =>
        prev.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: 'dispatched',
                dispatchedInterventionId: created.id,
                dispatchedInterventionCode: created.code
              }
            : a
        )
      );

      showToast(`CAPA dispatched: ${created.code}. Persisted to database.`);
    } catch (err: any) {
      const errMsg = err?.message || 'CAPA dispatch failed.';
      setDispatchError(`CAPA dispatch failed: ${errMsg}`);
      showToast(`CAPA dispatch failed: ${errMsg}`);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleExportDossier = () => {
    setExportStatus('compiling');
    setTimeout(() => {
      const dossier = {
        metadata: {
          platform: 'PRECURSOR-X Safety Intelligence Platform',
          exportType: 'Executive Risk Dossier',
          generatedAt: new Date().toISOString(),
          environment: 'PRODUCTION ARCHITECTURE • TRACEABLE TELEMETRY',
          assetScope: selectedAsset === 'all' ? `All Global Assets (${metrics?.facilityCount || backendSites.length} Facilities)` : selectedAsset,
          timeframe: timeframe
        },
        executiveTelemetry: {
          activeSifPrecursors: metrics ? metrics.activeSifPrecursors : 0,
          sifVelocityTrajectoryPct: metrics?.sifVelocityPct ?? null,
          barrierIntegrityOverallPct: metrics?.barrierIntegrityPct ?? null,
          barrierShiftDelta: metrics?.barrierShiftDelta ?? null,
          highEnergyReleasesRecorded: metrics ? metrics.highEnergyReleases : 0,
          priorityInterventionsDeployed: metrics ? metrics.interventionsDeployed : 0,
          interventionsEfficacyPct: metrics?.interventionsEfficacyPct ?? null
        },
        facilityBreakdown: filteredSites.map((s) => ({
          name: s.name,
          code: s.code,
          basin: s.basin,
          region: s.region,
          riskClassification: s.riskClassification,
          precursorDensityPct: s.precursorDensityPct,
          compositeScore: s.compositeScore,
          barrierIntegrityPct: s.barrierIntegrityPct,
          sifPrecursorsCount: s.sifPrecursors,
          activePermitsCount: s.activePermits
        })),
        lifeSavingRulesCompliance: filteredRules.map((r) => ({
          ruleId: r.id,
          name: r.name,
          category: r.category,
          incidentsCount: r.incidentsCount,
          compliancePct: r.percentage
        }))
      };

      const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `precursor_x_dossier_${selectedAsset}_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('ready');
      setTimeout(() => {
        setExportStatus('idle');
      }, 2500);
    }, 800);
  };

  // Filtered sites for telemetry table from backend
  const sourceSites = backendSites;
  const filteredSites = useMemo(() => {
    return sourceSites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        site.code.toLowerCase().includes(tableSearch.toLowerCase()) ||
        site.region.toLowerCase().includes(tableSearch.toLowerCase());

      if (selectedAsset === 'all') return matchesSearch;
      return matchesSearch && (site.id === selectedAsset || site.code.toLowerCase() === selectedAsset.toLowerCase());
    });
  }, [sourceSites, tableSearch, selectedAsset]);

  // Backend authoritative LSR rows
  const filteredRules = backendRules;

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Backend Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/50 flex items-center justify-between gap-3 text-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <span className="font-body-md text-body-md text-error">{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 rounded bg-error text-on-error font-label-code-sm text-label-code-sm flex items-center gap-1 hover:bg-error/90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Header Block with Executive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg bg-surface-container-low p-space-xl rounded-xl shadow-md border border-surface-container-high/40">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Executive Risk Command
            </span>
            <span className="bg-surface-container px-space-sm py-0.5 rounded-full font-label-code-sm text-label-code-sm text-primary tracking-widest uppercase font-semibold">
              Live Pulse
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Global Asset SIF Precursors & Barrier Stability Telemetry Engine
          </p>
        </div>

        {/* Controls & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-space-md">
          {/* Facility Selector */}
          <div className="relative min-w-[240px]">
            <select
              aria-label="Select Facility Asset"
              className="w-full bg-surface-container text-on-surface font-body-sm text-body-sm px-space-md py-space-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-high transition-colors pr-8 border border-surface-container-high/60"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              <option value="all">
                {facilitiesList.length > 0
                  ? `All Global Assets (${facilitiesList.length} Facilities)`
                  : metrics?.facilityCount
                  ? `All Global Assets (${metrics.facilityCount} Facilities)`
                  : 'All Global Assets (0 Facilities)'}
              </option>
              {facilitiesList.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Timeframe Toggles */}
          <div className="flex items-center bg-surface-container p-1 rounded-lg border border-surface-container-high/40">
            {['7D', '30D', '12W', 'Q3'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-space-md py-1 rounded font-label-code-md text-label-code-md transition-all ${
                  timeframe === tf
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export Dossier CTA */}
          <button
            onClick={handleExportDossier}
            className="flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-headline-sm text-headline-sm px-space-lg py-space-sm rounded-lg transition-all shadow-md active:scale-95"
          >
            {exportStatus === 'idle' && (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Export Dossier</span>
              </>
            )}
            {exportStatus === 'compiling' && (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Compiling...</span>
              </>
            )}
            {exportStatus === 'ready' && (
              <>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Dossier Ready</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Metrics Row (4 Instrumental KPI Units) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
        {/* KPI 1 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-all border border-surface-container-high/30">
          <div className="flex items-start justify-between">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Active SIF Precursors
            </span>
            <span className="p-1 rounded bg-surface-container-high text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">warning</span>
            </span>
          </div>
          <div className="my-space-md flex items-baseline gap-space-md">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {metrics?.activeSifPrecursors != null ? metrics.activeSifPrecursors : (isLoading ? '...' : 'N/A')}
            </span>
            <span className="inline-flex items-center gap-0.5 font-label-code-sm text-label-code-sm text-primary font-semibold">
              <span className="material-symbols-outlined text-[14px]">
                {metrics?.sifVelocityPct != null && metrics.sifVelocityPct > 0 ? 'arrow_upward' : 'arrow_downward'}
              </span>{' '}
              {metrics?.sifVelocityPct != null ? `${Math.abs(metrics.sifVelocityPct)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm">
            <span>Trailing {metrics?.timeframe ? `${metrics.timeframe}` : 'N/A'} velocity</span>
            <span className="text-primary font-medium">
              {metrics?.sifVelocityPct != null ? (metrics.sifVelocityPct <= 0 ? 'Optimal Shift' : 'Elevated Velocity') : 'Insufficient Data'}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-all border border-surface-container-high/30">
          <div className="flex items-start justify-between">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Barrier Integrity Index
            </span>
            <span className="p-1 rounded bg-surface-container-high text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">format_image_left</span>
            </span>
          </div>
          <div className="my-space-md flex items-baseline gap-space-md">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {metrics?.barrierIntegrityPct != null ? `${metrics.barrierIntegrityPct}%` : (isLoading ? '...' : 'N/A')}
            </span>
            <span className="inline-flex items-center gap-0.5 font-label-code-sm text-label-code-sm text-secondary font-semibold">
              <span className="material-symbols-outlined text-[14px]">
                {metrics?.barrierShiftDelta != null && metrics.barrierShiftDelta >= 0 ? 'arrow_upward' : 'arrow_downward'}
              </span>{' '}
              {metrics?.barrierShiftDelta != null ? `${metrics.barrierShiftDelta > 0 ? '+' : ''}${metrics.barrierShiftDelta}%` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm">
            <span>Target baseline: {metrics?.barrierIntegrityTargetPct != null ? `>${metrics.barrierIntegrityTargetPct.toFixed(1)}%` : 'N/A'}</span>
            <span className="text-secondary font-medium">
              {metrics?.barrierShiftDelta != null ? 'Active Defenses' : 'Insufficient Data'}
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-all border border-surface-container-high/30">
          <div className="flex items-start justify-between">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              High Energy Releases
            </span>
            <span className="p-1 rounded bg-surface-container-high text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
            </span>
          </div>
          <div className="my-space-md flex items-baseline gap-space-md">
            <span className="font-headline-xl text-headline-xl font-bold text-error tracking-tight">
              {metrics?.highEnergyReleases != null ? String(metrics.highEnergyReleases).padStart(2, '0') : (isLoading ? '...' : 'N/A')}
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-label-code-sm text-label-code-sm text-error font-semibold">
              Alert L2
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm">
            <span className="truncate">Unreviewed precursor events</span>
            <span className="text-error font-medium">Recorded Events</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-all border border-surface-container-high/30">
          <div className="flex items-start justify-between">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Interventions Deployed
            </span>
            <span className="p-1 rounded bg-surface-container-high text-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
            </span>
          </div>
          <div className="my-space-md flex items-baseline gap-space-md">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {metrics?.interventionsDeployed != null ? metrics.interventionsDeployed : (isLoading ? '...' : 'N/A')}
            </span>
            <span className="font-label-code-sm text-label-code-sm text-primary font-semibold">
              {metrics?.interventionsEfficacyPct != null ? `${metrics.interventionsEfficacyPct}% Efficacy` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm">
            <span>Database CAPA Records</span>
            <span className="text-on-surface font-medium">PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Section (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        {/* Left Column (8 cols): Escalation Dynamics Chart & LSR Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-space-xl">
          {/* Vector Run Chart Card */}
          <div className="bg-surface-container-low p-space-xl rounded-xl shadow-md flex flex-col gap-space-lg border border-surface-container-high/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-0.5">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">
                  SIF Precursor Escalation Dynamics
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                  Model Confidence: N/A • Exponential moving decay
                </span>
              </div>

              {/* View Mode Switch */}
              <div className="inline-flex bg-surface-container p-1 rounded-lg border border-surface-container-high/30">
                <button
                  onClick={() => setChartView('freq')}
                  className={`px-space-md py-1 rounded font-label-code-sm text-label-code-sm transition-all ${
                    chartView === 'freq'
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  SIF Frequency
                </button>
                <button
                  onClick={() => setChartView('decay')}
                  className={`px-space-md py-1 rounded font-label-code-sm text-label-code-sm transition-all ${
                    chartView === 'decay'
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  Barrier Decay %
                </button>
              </div>
            </div>

            {/* Vector Run Chart Viewport */}
            <div className="w-full bg-surface-container-lowest p-space-lg rounded-xl relative overflow-hidden">
              {telemetryData.length === 0 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center gap-space-sm text-center p-space-lg">
                  <span className="material-symbols-outlined text-outline text-[36px]">show_chart</span>
                  <span className="font-headline-sm text-on-surface font-semibold">No SIF telemetry available</span>
                  <p className="font-body-sm text-on-surface-variant max-w-sm">
                    No historical precursor telemetry records found in PostgreSQL for the selected timeframe.
                  </p>
                </div>
              ) : telemetryData.length === 1 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center gap-space-sm text-center p-space-lg">
                  <span className="material-symbols-outlined text-outline text-[36px]">timeline</span>
                  <span className="font-headline-sm text-on-surface font-semibold">Insufficient historical data</span>
                  <p className="font-body-sm text-on-surface-variant max-w-sm">
                    A minimum of two telemetry intervals is required to calculate escalation dynamics.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-outline font-label-code-sm text-label-code-sm mb-2">
                    <span>
                      {telemetryData[0] ? `${telemetryData[0].week} (Baseline: ${telemetryData[0].precursorVolume != null ? `${telemetryData[0].precursorVolume} SIF` : 'No telemetry'})` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-error">
                      <span className="w-2 h-0.5 bg-error"></span> Executive Limit: {metrics?.executiveSifThreshold != null ? `${metrics.executiveSifThreshold} SIF` : 'Threshold Not Configured'}
                    </span>
                    <span>
                      {telemetryData[telemetryData.length - 1] ? `${telemetryData[telemetryData.length - 1].week} (Current: ${metrics?.activeSifPrecursors != null ? `${metrics.activeSifPrecursors} SIF` : (telemetryData[telemetryData.length - 1].precursorVolume != null ? `${telemetryData[telemetryData.length - 1].precursorVolume} SIF` : 'No telemetry')})` : ''}
                    </span>
                  </div>

                  <div className="relative h-64 w-full flex items-center justify-center">
                    {dynamicSvg.insufficientData ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant font-label-code-sm text-label-code-sm p-space-lg text-center">
                        <span className="material-symbols-outlined text-outline text-[32px]">query_stats</span>
                        <span className="text-on-surface font-semibold">Insufficient Telemetry History</span>
                        <span className="text-outline text-xs">Fewer than 2 validated numeric observations recorded for this timeframe.</span>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-full h-full overflow-visible"
                          preserveAspectRatio="none"
                          viewBox="0 0 700 240"
                        >
                          <defs>
                            <linearGradient id="gradientSIF" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="gradientBreach" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line stroke="#31353e" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="40" y2="40" />
                          <line stroke="#31353e" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="100" y2="100" />
                          <line stroke="#31353e" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="160" y2="160" />
                          <line stroke="#31353e" strokeWidth="1" x1="0" x2="700" y1="220" y2="220" />

                          {/* Critical Threshold Line - Drawn strictly if configured */}
                          {dynamicSvg.thresholdY != null && (
                            <line stroke="#ffb4ab" strokeDasharray="6 6" strokeWidth="1.5" x1="0" x2="700" y1={dynamicSvg.thresholdY} y2={dynamicSvg.thresholdY} />
                          )}

                          {/* Dynamic Database-Driven Telemetry Curve & Area */}
                          {dynamicSvg.areaPath && (
                            <path
                              d={dynamicSvg.areaPath}
                              fill="url(#gradientSIF)"
                            />
                          )}
                          {dynamicSvg.linePath && (
                            <path
                              d={dynamicSvg.linePath}
                              fill="none"
                              stroke="#38bdf8"
                              strokeLinecap="round"
                              strokeWidth="3"
                            />
                          )}

                          {/* Data Points */}
                          {dynamicSvg.points.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r="4"
                              fill="#38bdf8"
                              stroke="#0a0e16"
                              strokeWidth="1.5"
                            />
                          ))}

                          {/* Peak Marker */}
                          {dynamicSvg.peakPoint && (
                            <>
                              <circle cx={dynamicSvg.peakPoint.x} cy={dynamicSvg.peakPoint.y} r="7" fill="#38bdf8" className="animate-ping opacity-60" />
                              <circle cx={dynamicSvg.peakPoint.x} cy={dynamicSvg.peakPoint.y} r="4" fill="#dfe2ee" stroke="#004965" strokeWidth="2" />
                            </>
                          )}
                        </svg>

                        {/* Callout Annotation */}
                        {dynamicSvg.peakPoint && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-4 bg-surface-container-high px-space-md py-1 rounded shadow-md flex items-center gap-space-xs pointer-events-none">
                            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                            <span className="font-label-code-sm text-label-code-sm text-on-surface font-semibold">
                              Peak {dynamicSvg.peakPoint.week} ({dynamicSvg.peakPoint.val} SIF) - Database Telemetry
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Legend & Trajectory Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-md mt-space-sm bg-surface-container-low/40 px-space-md py-space-sm rounded-lg">
                    <div className="flex items-center gap-space-lg font-label-code-sm text-label-code-sm">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-3 h-1 bg-primary-container rounded"></span>
                        <span className="text-on-surface">Observed SIF Density</span>
                      </div>
                      {metrics?.executiveSifThreshold != null && (
                        <div className="flex items-center gap-space-xs">
                          <span className="w-3 h-0.5 bg-error rounded"></span>
                          <span className="text-on-surface-variant">Executive Limit ({metrics.executiveSifThreshold} SIF)</span>
                        </div>
                      )}
                    </div>
                    <span className="font-label-code-sm text-label-code-sm text-primary font-medium">
                      Trajectory: {metrics?.sifVelocityPct != null ? `${metrics.sifVelocityPct}% Velocity` : 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Life-Saving Rules Compliance Breakdown Card */}
          <div className="bg-surface-container-low p-space-xl rounded-xl shadow-md flex flex-col gap-space-lg border border-surface-container-high/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-0.5">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">
                  Life-Saving Rules Compliance Breakdown
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                  Active barrier failures correlated with standard IOGP protocols
                </span>
              </div>

              {/* Sub-filter tabs */}
              <div className="flex items-center bg-surface-container p-1 rounded-lg border border-surface-container-high/30">
                {(['all', 'critical', 'mechanical'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLsrCategory(cat)}
                    className={`px-space-md py-1 rounded font-label-code-sm text-label-code-sm capitalize transition-all ${
                      lsrCategory === cat
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress distributions */}
            <div className="flex flex-col gap-space-md">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        {rule.icon}
                      </span>
                      {rule.name}
                    </span>
                    <div className="flex items-center gap-space-md">
                      <span className="text-outline">{rule.incidentsCount} Incidents</span>
                      <span className="text-primary font-bold">{rule.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full ${rule.barColorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${rule.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Priority Field Interventions */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-low p-space-xl rounded-xl shadow-md flex flex-col gap-space-lg border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">
                  Priority Field Interventions
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                  Real-time SIF containment queue
                </span>
              </div>
              <span className="p-1 rounded-full bg-error/20 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              </span>
            </div>

            {/* Interventions List - Dynamic from PostgreSQL */}
            <div className="flex flex-col gap-space-md">
              {dispatchError && (
                <div className="p-space-sm rounded bg-error/15 border border-error/40 text-error font-body-sm flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{dispatchError}</span>
                  </div>
                  <button onClick={() => setDispatchError(null)} className="text-error hover:underline text-xs">
                    Dismiss
                  </button>
                </div>
              )}

              {priorityActionsError ? (
                <div className="bg-surface-container p-space-lg rounded-xl flex flex-col items-center justify-center gap-space-xs text-center border border-error/30 py-8">
                  <span className="material-symbols-outlined text-error text-[28px]">cloud_off</span>
                  <span className="font-body-md font-semibold text-error">Priority actions unavailable.</span>
                  <p className="font-body-sm text-on-surface-variant max-w-[280px]">
                    Could not retrieve priority actions from the safety intelligence service.
                  </p>
                </div>
              ) : priorityActions.length === 0 ? (
                <div className="bg-surface-container p-space-lg rounded-xl flex flex-col items-center justify-center gap-space-xs text-center border border-surface-container-high/40 py-8">
                  <span className="material-symbols-outlined text-outline text-[28px]">verified</span>
                  <span className="font-body-md font-semibold text-on-surface">No source record available</span>
                  <p className="font-body-sm text-on-surface-variant max-w-[280px]">
                    No unmitigated precursor patterns or high-severity events requiring immediate CAPA dispatch.
                  </p>
                </div>
              ) : (
                priorityActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-surface-container p-space-lg rounded-xl flex flex-col gap-space-sm transition-all hover:bg-surface-container-high border border-surface-container-high/40"
                  >
                    <div className="flex items-center justify-between">
                      {action.priority ? (
                        <span
                          className={`font-label-code-sm text-label-code-sm px-space-xs py-0.5 rounded-full font-semibold flex items-center gap-1 border ${
                            action.priority === 'Critical'
                              ? 'bg-rose-950/60 text-error border-error/30'
                              : action.priority === 'High'
                              ? 'bg-orange-950/60 text-primary-container border-primary-container/30'
                              : 'bg-amber-950/60 text-secondary border-secondary/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              action.priority === 'Critical'
                                ? 'bg-error animate-ping'
                                : action.priority === 'High'
                                ? 'bg-primary-container'
                                : 'bg-secondary'
                            }`}
                          ></span>
                          {action.priority.toUpperCase()} SIF
                        </span>
                      ) : (
                        <span className="font-label-code-sm text-label-code-sm px-space-xs py-0.5 rounded-full font-semibold text-outline border border-outline/30">
                          MONITORED
                        </span>
                      )}
                      <span className="font-label-code-sm text-label-code-sm text-outline">
                        {action.location || action.facility || 'Facility Unspecified'}
                      </span>
                    </div>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {action.title}
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {action.description}
                    </p>
                    <div className="pt-space-xs flex items-center justify-between">
                      <span className="font-label-code-sm text-label-code-sm text-error font-medium">
                        {action.escalationNotice || action.facility || ''}
                      </span>
                      <button
                        onClick={() => handleActionClick(action)}
                        disabled={!action.sourceRecordId || dispatchingId === action.id}
                        className={`font-label-code-sm text-label-code-sm px-space-md py-1.5 rounded transition-colors flex items-center gap-1 font-semibold ${
                          action.status === 'dispatched'
                            ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline/30'
                            : action.priority === 'Critical'
                            ? 'bg-error text-on-error hover:bg-error-container'
                            : 'bg-primary-container text-on-primary-container hover:bg-primary'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {!action.sourceRecordId ? (
                          <span>No source record available</span>
                        ) : action.status === 'dispatched' ? (
                          <>
                            <span className="material-symbols-outlined text-[14px]">done</span>
                            <span>Dispatched • {action.dispatchedInterventionCode || 'Open CAPA'}</span>
                          </>
                        ) : dispatchingId === action.id ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <span>Dispatch CAPA</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Status Block */}
            <div className="p-space-md rounded-lg bg-surface-container-lowest flex items-center justify-between border border-surface-container-high/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">sync</span>
                <div className="flex flex-col">
                  <span className="font-label-code-sm text-label-code-sm text-on-surface font-semibold">
                    Active Interventions
                  </span>
                  <span className="font-label-code-sm text-label-code-sm text-outline">
                    {metrics ? `${metrics.interventionsDeployed} active in database` : 'Loading...'}
                  </span>
                </div>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-primary font-semibold">
                BARRIER: {metrics?.barrierIntegrityPct != null ? `${metrics.barrierIntegrityPct}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Asset Telemetry Table */}
      <div className="bg-surface-container-low p-space-xl rounded-xl shadow-md flex flex-col gap-space-lg border border-surface-container-high/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-0.5">
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              Global Asset Risk Telemetry
            </span>
            <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
              Dynamic telemetry synthesis across all operational production platforms
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                className="bg-surface-container font-body-sm text-body-sm text-on-surface pl-8 pr-space-md py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-high w-48 sm:w-64 border border-surface-container-high/50"
                placeholder="Filter facilities..."
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-outline font-label-code-sm text-label-code-sm uppercase tracking-wider">
                <th className="py-space-sm px-space-md">Facility / Asset</th>
                <th className="py-space-sm px-space-md">SIF Precursors</th>
                <th className="py-space-sm px-space-md">Barrier Status</th>
                <th className="py-space-sm px-space-md">Risk Classification</th>
                <th className="py-space-sm px-space-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant font-label-code-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary text-[20px]">progress_activity</span>
                      <span>Loading telemetry from FastAPI backend...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-outline font-label-code-sm">
                    No facilities found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredSites.slice(0, 5).map((site) => (
                <tr key={site.id} className="hover:bg-surface-container transition-colors group">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {site.name}
                      </span>
                      <span className="font-label-code-sm text-label-code-sm text-outline">
                        {site.code} • {site.region}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md font-label-code-md text-label-code-md text-on-surface font-semibold">
                    {site.sifPrecursors}{' '}
                    <span
                      className={`font-normal ${
                        site.precursorDelta > 0
                          ? 'text-error'
                          : site.precursorDelta < 0
                          ? 'text-primary'
                          : 'text-outline'
                      }`}
                    >
                      ({site.precursorDelta > 0 ? `+${site.precursorDelta}` : site.precursorDelta})
                    </span>
                  </td>
                  <td className="py-space-md px-space-md w-48">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-code-sm text-label-code-sm">
                        <span className="text-on-surface-variant">
                          {site.barrierIntegrityPct}%
                        </span>
                        <span
                          className={
                            site.status === 'Critical Delta'
                              ? 'text-error'
                              : site.status === 'Protected'
                              ? 'text-secondary'
                              : 'text-primary'
                          }
                        >
                          {site.status}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            site.barrierIntegrityPct < 80
                              ? 'bg-error'
                              : site.barrierIntegrityPct < 90
                              ? 'bg-secondary'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${site.barrierIntegrityPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span
                      className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full font-label-code-sm text-label-code-sm font-semibold ${
                        site.riskClassification === 'Critical'
                          ? 'bg-rose-950/50 text-error border border-error/30'
                          : site.riskClassification === 'High'
                          ? 'bg-orange-950/50 text-primary-container border border-primary-container/30'
                          : site.riskClassification === 'Moderate'
                          ? 'bg-amber-950/50 text-secondary border border-secondary/30'
                          : 'bg-surface-container-high text-primary'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          site.riskClassification === 'Critical'
                            ? 'bg-error'
                            : site.riskClassification === 'High'
                            ? 'bg-primary-container'
                            : site.riskClassification === 'Moderate'
                            ? 'bg-secondary'
                            : 'bg-primary'
                        }`}
                      ></span>{' '}
                      {site.riskClassification}
                    </span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      onClick={() => {
                        if (site.id) {
                          navigate(`/risk-intelligence?site=${encodeURIComponent(site.id)}`);
                        } else {
                          showToast('No source record available.');
                        }
                      }}
                      disabled={!site.id}
                      className="font-label-code-sm text-label-code-sm text-primary hover:text-primary-container font-semibold px-space-sm py-1 rounded bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {site.id ? 'Inspect →' : 'No source record available.'}
                    </button>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>

        {/* Table Footer / Telemetry Sync Banner */}
        <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md font-label-code-sm text-label-code-sm text-outline border-t border-surface-container-high/40">
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">memory</span>
              Authoritative PostgreSQL Pipeline
            </span>
            <span>•</span>
            <span>Live Data Sync</span>
          </div>
          <div className="flex items-center gap-space-md">
            <span>
              Sites Active: <strong className="text-on-surface font-medium">{backendSites.length}</strong>
            </span>
            <span className="text-on-surface-variant">FastAPI REST v1</span>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl bg-surface-container-highest border border-primary/40 text-on-surface flex items-center gap-2 font-body-sm animate-fade-in">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
