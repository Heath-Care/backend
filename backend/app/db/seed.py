"""
Database Seeding Script for PRECURSOR-X PostgreSQL Database.
Imports canonical seed records from seed_data.py into the relational PostgreSQL schema.
Usage:
    python -m app.db.seed            # idempotent, never overwrites existing records
    python -m app.db.seed --force    # DEV ONLY: merge-overwrites seed rows by primary key

DATA PROVENANCE: everything inserted by this module is SYNTHETIC DEMONSTRATION DATA
(facilities, telemetry, events, reports, precedents, graph, interventions, reviews, what-changed
snapshot). It is inserted into PostgreSQL only; the frontend never imports it and every API
response is read from PostgreSQL.

Startup behaviour of seed_database(force=False):
  * Each table is seeded only if it currently has ZERO rows (per-table check).
  * Table with >= 1 row (seed or real) is left completely untouched -> restarts do not duplicate
    records and never overwrite real records.
  * Schema creation is NOT done here for PostgreSQL: Alembic (`alembic upgrade head`) is the only
    schema authority. (SQLite test databases are created with metadata.create_all.)
  * Users are never seeded in production unless INITIAL_OPERATOR_EMAIL / INITIAL_OPERATOR_PASSWORD
    are provided; the local dev fixture user is created only when APP_ENV != production.
"""

import sys
import os
import logging
import secrets
from typing import Optional
from datetime import datetime, timezone

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import settings
from app.db.session import SessionLocal, engine
from sqlalchemy.orm import Session
from app.db.base import Base
from app.models.entities import (
    Facility,
    SafetyRule,
    SafetyEvent,
    SafetyReport,
    PrecursorPattern,
    PrecursorObservation,
    RiskObservation,
    SafetyMemoryRecord,
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    Intervention,
    HumanReview,
    WhatChangedSnapshot,
    User,
)
from app.core.security import hash_password
from app.data.seed_data import (
    SITES_DATA,
    SAFETY_RULES,
    PRECURSOR_PATTERNS,
    SYNTHETIC_REPORTS,
    SAFETY_MEMORY_DATA,
    KNOWLEDGE_GRAPH_NODES,
    KNOWLEDGE_GRAPH_EDGES,
    INITIAL_INTERVENTIONS,
    INITIAL_REVIEWS,
    WHAT_CHANGED_DATA,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed_database(force: bool = False, db: Optional[Session] = None):
    logger.info("Initializing database schema...")
    should_close = False
    if db is None:
        if engine.dialect.name == "sqlite":
            # Local/test convenience only. PostgreSQL schema is owned by Alembic migrations.
            Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True
    try:
        # 1. Facilities
        if force or db.query(Facility).count() == 0:
            logger.info("Seeding Facilities...")
            for s in SITES_DATA:
                site_obj = Facility(
                    id=s["id"],
                    code=s["code"],
                    name=s["name"],
                    region=s["region"],
                    type=s["type"],
                    basin=s.get("basin", ""),
                    active_permits=s.get("activePermits", 0),
                    reports_analyzed=s.get("reportsAnalyzed", 0),
                    sif_precursors=s.get("sifPrecursors", 0),
                    precursor_delta=s.get("precursorDelta", 0),
                    precursor_density_pct=s.get("precursorDensityPct", 0.0),
                    barrier_integrity_pct=s.get("barrierIntegrityPct", 0.0),
                    composite_score=s.get("compositeScore", 0),
                    trend_30d=s.get("trend30d", "+0%"),
                    trend_direction=s.get("trendDirection", "neutral"),
                    risk_classification=s.get("riskClassification", "Stable"),
                    status=s.get("status", "Nominal"),
                    activities=["confined", "isolation", "hotwork"] if "site-b" in s["id"] else ["isolation", "height"],
                    lsr_codes=["lsr-01", "lsr-04", "lsr-08"] if "site-b" in s["id"] else ["lsr-01", "lsr-02"]
                )
                db.merge(site_obj)
            db.commit()

        # 2. Safety Rules
        if force or db.query(SafetyRule).count() == 0:
            logger.info("Seeding Safety Rules...")
            for r in SAFETY_RULES:
                rule_obj = SafetyRule(
                    id=r["id"],
                    code=r["code"],
                    name=r["name"],
                    category=r["category"],
                    icon=r["icon"],
                    description=r["description"],
                    incidents_count=r.get("incidentsCount", 0),
                    percentage=r.get("percentage", 0),
                    bar_color_class=r.get("barColorClass", "bg-primary-container"),
                    standards_ref=r.get("standardsRef", "")
                )
                db.merge(rule_obj)
            db.commit()

        # 3. Precursor Patterns
        if force or db.query(PrecursorPattern).count() == 0:
            logger.info("Seeding Precursor Patterns...")
            for p in PRECURSOR_PATTERNS:
                pattern_obj = PrecursorPattern(
                    id=p["id"],
                    code=p["code"],
                    title=p.get("title", p.get("name", "")),
                    confidence=int(p.get("confidence", 85)),
                    observed_recurrence=f"{p.get('occurrences', 24)} instances across {p.get('affectedSitesCount', 3)} facilities",
                    fatal_probability_pct=p.get("sifScore", 85),
                    vector=p.get("keyVector", "Process Safety Envelope"),
                    lsr_code="LSR-04" if "CSE" in p["code"] else "LSR-01" if "LOTO" in p["code"] else "LSR-08",
                    lsr_title="Confined Space Entry" if "CSE" in p["code"] else "Energy Isolation" if "LOTO" in p["code"] else "Hot Work",
                    triad=p.get("triad", {}),
                    genomic_markers=[
                        {"marker": "Vessel Atmosphere Sniff", "status": "OMITTED", "significance": "HIGH"},
                        {"marker": "Physical Padlock Lockout", "status": "BYPASSED", "significance": "CRITICAL"},
                        {"marker": "Handover Timing Gap", "status": "CONFIRMED", "significance": "MODERATE"}
                    ],
                    pathway_nodes=[
                        {"id": "p1", "label": "Shift Turnaround Rush", "type": "Behavioral"},
                        {"id": "p2", "label": "Lockout Bypass", "type": "Procedural"},
                        {"id": "p3", "label": "Sniff Test Skip", "type": "Verification"},
                        {"id": "p4", "label": "Atmospheric Exposure", "type": "Hazard"}
                    ]
                )
                db.merge(pattern_obj)
            db.commit()

        # 3.1 Precursor Observations
        if force or db.query(PrecursorObservation).count() == 0:
            logger.info("Seeding Precursor Observations...")
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            obs_seeds = [
                ("gen-cs-loto-01", "site-b", 5, True, "Atmospheric Sniffer Calibration"),
                ("gen-cs-loto-01", "site-a", 12, False, "Mechanical LOTO Lockout"),
                ("gen-cs-loto-01", "site-wolfcamp", 21, True, "Atmospheric Sniffer Calibration"),
                ("gen-hw-sns-02", "site-b", 4, False, "Fire Watch Exclusion Zone"),
                ("gen-hw-sns-02", "site-c", 18, True, "Combustible LEL Detector"),
                ("gen-rig-lift-11", "site-a", 3, True, "Tagline Rigging Integrity"),
                ("gen-rig-lift-11", "site-c", 9, False, "Blind Lift Spotter"),
                ("gen-rig-lift-11", "site-wolfcamp", 16, False, "Blind Lift Spotter"),
                ("gen-isol-pr-04", "site-b", 2, True, "Spectacle Blind Reversal"),
                ("gen-isol-pr-04", "site-perdido", 14, False, "Pressure Gauge Bleed-Off"),
                ("gen-isol-pr-04", "site-clair-ridge", 6, True, "Flange Bolt Torque Spec"),
                ("gen-isol-pr-04", "site-troll-a", 22, False, "Gasket Integrity Check")
            ]
            for idx, (pat_id, fac_id, days_ago, spike, barrier) in enumerate(obs_seeds):
                obs_obj = PrecursorObservation(
                    id=f"obs-{idx + 1}",
                    pattern_id=pat_id,
                    facility_id=fac_id,
                    observation_time=now - timedelta(days=days_ago, hours=idx * 3),
                    shift="Night" if idx % 2 == 0 else "Day",
                    energy_spike_detected=spike,
                    barrier_failed=barrier,
                    raw_metadata={"source": "Operational Field Telemetry"}
                )
                db.merge(obs_obj)
            db.commit()

        # 4. Reports & Events
        if force or db.query(SafetyReport).count() == 0:
            logger.info("Seeding Reports & Events...")
            for idx, r in enumerate(SYNTHETIC_REPORTS):
                rep_obj = SafetyReport(
                    id=r["id"],
                    text=r["description"],
                    unit=r.get("unit"),
                    category=r.get("activity"),
                    status="ANALYZED",
                    sif_potential=r.get("sifPotential"),
                    sif_score=int(r.get("confidence") * 100) if r.get("confidence") is not None else None,
                    confidence=int(r.get("confidence") * 100) if r.get("confidence") is not None else None,
                    ai_model=None,  # Synthetic seed report: was NOT produced by a live Groq call
                    processing_duration_ms=None,
                    analysis_result=r
                )
                db.merge(rep_obj)

                # Seed corresponding SafetyEvent
                ev_obj = SafetyEvent(
                    id=f"evt-{r['id']}",
                    facility_id=r.get("siteId"),
                    facility_name=r.get("siteName") or r.get("facilityName"),
                    unit=r.get("unit"),
                    time=f"{(idx + 1) * 18}m ago",
                    type=r.get("reportType", "Near Miss"),
                    severity=r.get("sifPotential", "CRITICAL"),
                    vector=r.get("activity"),
                    consequence=4 if r.get("sifPotential") == "CRITICAL" else 3,
                    frequency=4
                )
                db.merge(ev_obj)
            db.commit()

        # 5. Risk Observations
        if force or db.query(RiskObservation).count() == 0:
            logger.info("Seeding Risk Observations...")
            risk_matrix_seed = [
                ("site-b", "confined", "lsr-04", 4, 4, 148),
                ("site-b", "isolation", "lsr-01", 4, 3, 92),
                ("site-a", "isolation", "lsr-01", 3, 4, 114),
                ("site-a", "height", "lsr-02", 3, 3, 76),
                ("site-c", "confined", "lsr-04", 3, 2, 48),
                ("site-c", "hotwork", "lsr-08", 4, 2, 39),
                ("site-d", "isolation", "lsr-01", 2, 3, 52),
                ("site-perdido", "height", "lsr-02", 4, 3, 67),
            ]
            for idx, (fac, act, lsr, c, f, cnt) in enumerate(risk_matrix_seed):
                ro = RiskObservation(
                    id=f"ro-{idx + 1}",
                    facility_id=fac,
                    activity=act,
                    lsr_code=lsr,
                    consequence_tier=c,
                    frequency_tier=f,
                    event_count=cnt
                )
                db.merge(ro)
            db.commit()

        # 6. Safety Memory
        if force or db.query(SafetyMemoryRecord).count() == 0:
            logger.info("Seeding Safety Memory Precedents...")
            for m in SAFETY_MEMORY_DATA:
                date_str = m.get("date", "")
                parsed_year = int(date_str.split("-")[0]) if (date_str and "-" in date_str) else m.get("year")
                mem_obj = SafetyMemoryRecord(
                    id=m["id"],
                    precedent_code=m.get("precedentCode") or m.get("code") or m.get("id"),
                    title=m["title"],
                    year=parsed_year if parsed_year is not None else 2023,
                    facility=m.get("facility"),
                    operational_context=m.get("operationalContext") or m.get("narrative") or "",
                    precursor_signature=m.get("precursorSignature") or (", ".join(m.get("extractedPrecursors", [])) if m.get("extractedPrecursors") else None),
                    failed_barriers=m.get("failedBarriers", [m.get("brokenBarrier")] if m.get("brokenBarrier") else []),
                    root_causes=m.get("rootCauses", [m.get("failureMechanism")] if m.get("failureMechanism") else []),
                    corrective_actions=m.get("correctiveActions", [m.get("remediation")] if m.get("remediation") else []),
                    consequence_tier=m.get("consequenceTier") or m.get("sifPotential") or "CRITICAL",
                    lsr_violated=m.get("lsrViolated") or m.get("governingLsr") or "LSR-01",
                    similarity_vector=m.get("similarityVector", {})
                )
                db.merge(mem_obj)
            db.commit()

        # 7. Knowledge Graph Nodes & Edges
        if force or db.query(KnowledgeGraphNode).count() == 0:
            logger.info("Seeding Knowledge Graph...")
            for n in KNOWLEDGE_GRAPH_NODES:
                node_obj = KnowledgeGraphNode(
                    id=n["id"],
                    node_id=n["id"],
                    label=n["label"],
                    type=n["type"],
                    severity=n.get("severity", "MEDIUM"),
                    category=n.get("category", "General"),
                    status=n.get("status", "ACTIVE").upper(),
                    failure_probability=float(n.get("sifWeight", 0.75)),
                    description=n.get("details", ""),
                    node_metadata={"x": n.get("x", 0), "y": n.get("y", 0), "centrality": n.get("centrality", 0.5)}
                )
                db.merge(node_obj)

            for e in KNOWLEDGE_GRAPH_EDGES:
                edge_obj = KnowledgeGraphEdge(
                    id=e["id"],
                    source=e.get("from", e.get("source")),
                    target=e.get("to", e.get("target")),
                    relationship=e.get("label", e.get("relationship", "relates_to")),
                    weight=float(e.get("weight", 1.0)),
                    latency_days=int(e.get("latencyDays", 0)),
                    description=e.get("type", "")
                )
                db.merge(edge_obj)
            db.commit()

        # 8. Interventions
        if force or db.query(Intervention).count() == 0:
            logger.info("Seeding Interventions...")
            for it in INITIAL_INTERVENTIONS:
                int_obj = Intervention(
                    id=it["id"],
                    code=it["code"],
                    title=it["title"],
                    description=it.get("actionPlan") or it.get("description") or it.get("title", ""),
                    precursor_pattern=it.get("precursorPattern"),
                    targeted_vector=it.get("targetedVector"),
                    lsr_code=it.get("lsrCode"),
                    lsr_title=it.get("lsrTitle"),
                    sif_risk_pct=int(it["sifRiskPct"]) if it.get("sifRiskPct") is not None else None,
                    priority=it.get("priority"),
                    status=it.get("status", "Proposed"),
                    target_facility=it.get("targetFacility") or it.get("facility"),
                    affected_sites_summary=it.get("affectedSitesSummary") or it.get("scope"),
                    observed_recurrence=it.get("observedRecurrence"),
                    protocol_steps=it.get("protocolSteps"),
                    owner=it.get("owner"),
                    owner_role=it.get("ownerRole"),
                    due_date=it.get("dueDate") or it.get("targetDate"),
                    progress_pct=int(it["progressPct"]) if it.get("progressPct") is not None else None,
                    verification_metric=it.get("verificationMetric"),
                    source_type="SEED",
                    source_record_id=it["id"]
                )
                db.merge(int_obj)
            db.commit()

        # 9. Human Reviews
        if force or db.query(HumanReview).count() == 0:
            logger.info("Seeding Human Reviews...")
            for rev in INITIAL_REVIEWS:
                raw_opt = rev.get("opticalFeed")
                opt_feed = None
                if raw_opt and isinstance(raw_opt, dict):
                    img = raw_opt.get("imageUrl", "")
                    if img and "unsplash.com" not in img:
                        opt_feed = raw_opt

                rev_obj = HumanReview(
                    id=rev["id"],
                    incident_code=rev.get("incidentCode") or rev.get("code") or rev["id"],
                    title=rev["title"],
                    site_name=rev.get("siteName") or rev.get("site"),
                    unit=rev.get("unit"),
                    event_time=rev.get("eventTime") or rev.get("timestamp") or "",
                    status=rev.get("status", "PENDING_REVIEW"),
                    ai_sif_level=rev.get("aiSifLevel"),
                    ai_sif_score_pct=int(rev["aiSifScorePct"]) if rev.get("aiSifScorePct") is not None else (int(rev["aiConfidence"]) if rev.get("aiConfidence") is not None else None),
                    ai_confidence_pct=int(rev["aiConfidencePct"]) if rev.get("aiConfidencePct") is not None else (int(rev["aiConfidence"]) if rev.get("aiConfidence") is not None else None),
                    optical_feed=opt_feed,
                    classification_rationale=rev.get("narrative") or rev.get("aiRationale") or rev.get("specialistNotes"),
                    specialist_calibration=rev.get("calibration"),
                    audit_trail=rev.get("auditTrail", []),
                    reporter=rev.get("reporter"),
                    primary_lsr=rev.get("primaryLsr"),
                    secondary_lsr=rev.get("secondaryLsr"),
                    annotated_tokens=rev.get("annotatedTokens", []),
                    feature_tags=rev.get("featureTags", []),
                    barriers=rev.get("barriers", []),
                    review_decision=rev.get("review_decision") or rev.get("decision"),
                    reviewer=rev.get("reviewer"),
                    reviewer_notes=rev.get("specialistNotes")
                )
                db.merge(rev_obj)
            db.commit()

        # 10. What Changed Snapshots
        if force or db.query(WhatChangedSnapshot).count() == 0:
            logger.info("Seeding What Changed Snapshots...")
            wc = WHAT_CHANGED_DATA
            snap_obj = WhatChangedSnapshot(
                id="snap-current-7d",
                baseline_period=wc.get("baselinePeriod", "Last 30-60 Days Baseline"),
                active_period=wc.get("activePeriod", "Trailing 7-Day Window"),
                precursor_acceleration=wc.get("precursorVelocityDelta") or wc.get("precursorAcceleration", "N/A"),
                events_in_active=wc.get("eventsInActive") or wc.get("activeEventsCount", 0),
                events_in_baseline=wc.get("eventsInBaseline") or wc.get("baselineEventsCount", 0),
                barrier_integrity_drop=wc.get("barrierIntegrityDrop", "N/A"),
                baseline_integrity=wc.get("baselineIntegrity") or wc.get("baselineIntegrityPct", 0.0),
                current_integrity=wc.get("currentIntegrity") or wc.get("currentIntegrityPct", 0.0),
                emergent_failure_modes=wc.get("emergentFailureModes") or wc.get("emergentFailureModesCount", 0),
                high_energy_spikes=wc.get("highEnergySpikes") or wc.get("highEnergySpikeCount", 0),
                key_shift_observation=wc.get("keyShiftObservation", "Atmospheric sniff skips escalated during shift turnover."),
                divergence_curve=wc.get("velocitySeries", []),
                flagged_precursors=wc.get("flaggedPrecursors", [])
            )
            db.merge(snap_obj)
            db.commit()

        # 11. Initial Verified Users (Controlled provisioning)
        if force or db.query(User).count() == 0:
            init_email = os.environ.get("INITIAL_OPERATOR_EMAIL")
            init_pass = os.environ.get("INITIAL_OPERATOR_PASSWORD")
            if init_email and init_pass:
                logger.info(f"Provisioning initial administrative operator: {init_email}")
                init_user = User(
                    id=f"usr_init_{secrets.token_hex(8)}",
                    email=init_email.strip().lower(),
                    password_hash=hash_password(init_pass),
                    full_name=os.environ.get("INITIAL_OPERATOR_NAME", "Lead Process Safety Specialist"),
                    role="safety_engineer",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    last_login_at=datetime.now(timezone.utc),
                )
                db.merge(init_user)
                db.commit()
            elif settings.APP_ENV != "production":
                logger.info("Provisioning development test operator fixture for local engineering verification...")
                dev_user = User(
                    id="usr_dev_safety_specialist",
                    email="operator.dev@precursorx.internal",
                    password_hash=hash_password("PrecursorX#Dev2026!"),
                    full_name="Dr. Elena Vance (Lead Process Safety Specialist)",
                    role="safety_engineer",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    last_login_at=datetime.now(timezone.utc),
                )
                db.merge(dev_user)
                db.commit()
            else:
                logger.info("Production mode: Skipping default operator seeding. Operators register via /api/v1/auth/register or initial admin provisioning.")

        logger.info("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    force_seed = "--force" in sys.argv
    seed_database(force=force_seed)
