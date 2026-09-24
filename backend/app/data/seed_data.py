"""
Canonical seed data for PRECURSOR-X FastAPI Backend.
Maintains 100% schema alignment with the frontend datasets.
"""

from typing import List, Dict, Any

SITES_DATA: List[Dict[str, Any]] = [
    {
        "id": "site-b",
        "code": "US-GULF-03",
        "name": "Site B (Eagle Ford Hub)",
        "region": "US Exclusive Zone",
        "type": "Deepwater Hub & Gas Separation",
        "basin": "Permian & Eagle Ford",
        "activePermits": 142,
        "reportsAnalyzed": 1090,
        "sifPrecursors": 182,
        "precursorDelta": 4,
        "precursorDensityPct": 16.7,
        "barrierIntegrityPct": 74.2,
        "compositeScore": 89,
        "trend30d": "+22%",
        "trendDirection": "up",
        "riskClassification": "Critical",
        "status": "Critical Delta"
    },
    {
        "id": "site-a",
        "code": "US-TX-08",
        "name": "Site A (Permian Basin Extraction 04)",
        "region": "US Southwest",
        "type": "Extraction Unit 04 & Wellheads",
        "basin": "Permian High-Pressure Basin",
        "activePermits": 88,
        "reportsAnalyzed": 1194,
        "sifPrecursors": 74,
        "precursorDelta": -2,
        "precursorDensityPct": 6.2,
        "barrierIntegrityPct": 84.6,
        "compositeScore": 74,
        "trend30d": "+8%",
        "trendDirection": "up",
        "riskClassification": "High",
        "status": "Protected"
    },
    {
        "id": "site-c",
        "code": "UK-NS-02",
        "name": "Site C (North Sea Bravo Platform)",
        "region": "North Sea Field (UK)",
        "type": "Bravo Fixed Offshore Platform",
        "basin": "North Sea Brent Complex",
        "activePermits": 63,
        "reportsAnalyzed": 875,
        "sifPrecursors": 42,
        "precursorDelta": -6,
        "precursorDensityPct": 4.8,
        "barrierIntegrityPct": 89.4,
        "compositeScore": 48,
        "trend30d": "-4%",
        "trendDirection": "down",
        "riskClassification": "Moderate",
        "status": "Nominal"
    },
    {
        "id": "site-d",
        "code": "US-ND-01",
        "name": "Site D (Bakken Shale Processing)",
        "region": "US North Central",
        "type": "Hydrocarbon Processing Terminal",
        "basin": "Bakken Shale",
        "activePermits": 51,
        "reportsAnalyzed": 744,
        "sifPrecursors": 29,
        "precursorDelta": -3,
        "precursorDensityPct": 3.9,
        "barrierIntegrityPct": 93.5,
        "compositeScore": 41,
        "trend30d": "-6%",
        "trendDirection": "down",
        "riskClassification": "Stable",
        "status": "Optimal"
    },
    {
        "id": "site-perdido",
        "code": "GOM-SPAR-01",
        "name": "Perdido Deepwater Spar",
        "region": "Gulf of Mexico Ultra-Deep",
        "type": "Floating Spar Production Facility",
        "basin": "Gulf of Mexico Deepwater",
        "activePermits": 110,
        "reportsAnalyzed": 940,
        "sifPrecursors": 28,
        "precursorDelta": 4,
        "precursorDensityPct": 7.2,
        "barrierIntegrityPct": 74.2,
        "compositeScore": 82,
        "trend30d": "+14%",
        "trendDirection": "up",
        "riskClassification": "Critical",
        "status": "Critical Delta"
    },
    {
        "id": "site-troll-a",
        "code": "NOR-CS-04",
        "name": "Troll A Condeep Platform",
        "region": "Norwegian Continental Shelf",
        "type": "Gravity-Base Condeep Gas Platform",
        "basin": "Troll Gas Field",
        "activePermits": 74,
        "reportsAnalyzed": 1180,
        "sifPrecursors": 22,
        "precursorDelta": 2,
        "precursorDensityPct": 4.1,
        "barrierIntegrityPct": 88.6,
        "compositeScore": 61,
        "trend30d": "+6%",
        "trendDirection": "up",
        "riskClassification": "High",
        "status": "Protected"
    },
    {
        "id": "site-clair-ridge",
        "code": "UK-WOS-01",
        "name": "Clair Ridge Offshore Complex",
        "region": "West of Shetland",
        "type": "Dual Bridge-Linked Steel Jackets",
        "basin": "Clair Field Heavy Oil",
        "activePermits": 66,
        "reportsAnalyzed": 810,
        "sifPrecursors": 19,
        "precursorDelta": -3,
        "precursorDensityPct": 3.7,
        "barrierIntegrityPct": 91.2,
        "compositeScore": 54,
        "trend30d": "-3%",
        "trendDirection": "down",
        "riskClassification": "Moderate",
        "status": "Nominal"
    },
    {
        "id": "site-wolfcamp",
        "code": "US-DEL-02",
        "name": "Wolfcamp Delaware Facility",
        "region": "Delaware Basin",
        "type": "Modular Central Delivery Point",
        "basin": "Delaware Basin Unconventional",
        "activePermits": 92,
        "reportsAnalyzed": 1340,
        "sifPrecursors": 31,
        "precursorDelta": 5,
        "precursorDensityPct": 8.1,
        "barrierIntegrityPct": 71.8,
        "compositeScore": 86,
        "trend30d": "+18%",
        "trendDirection": "up",
        "riskClassification": "Critical",
        "status": "Critical Delta"
    }
]

PRECURSOR_PATTERNS: List[Dict[str, Any]] = [
    {
        "id": "gen-cs-loto-01",
        "code": "GEN-CS-LOTO-01",
        "name": "Confined Space + Omitted Gas Sniff + Padlock Defect",
        "category": "Atmospheric / Isolation",
        "sifPotential": "CRITICAL",
        "sifScore": 87,
        "occurrences": 31,
        "affectedSitesCount": 4,
        "affectedSites": ["Site B (Permian)", "Site A (Assam)", "Site D", "Rig 19"],
        "trend30dPct": 24,
        "mtboDays": 4.2,
        "confidence": 94.6,
        "keyVector": "TK-402 Desander / Separator Vessel",
        "status": "ACTIVE THREAT VECTOR",
        "description": "Entry into purged vessel without complete 4-gas sniff telemetry verification combined with unpadlocked LOTO valve tags during night shift changeover.",
        "triad": {
            "hazardClass": "Confined Space Vessel Entry",
            "trigger": "Omitted Gas Sniffing (O2 / H2S)",
            "proceduralBreach": "Valve V-12 Tagged Without Padlock",
            "behavioralVariance": "PTW Handover Drift (02:00-05:00 hrs)",
            "consequence": "Operator Asphyxiation / Loss of Containment"
        }
    },
    {
        "id": "gen-isol-pr-04",
        "code": "GEN-ISOL-PR-04",
        "name": "Energy Isolation + Lockout Bypass + Fast Turnaround",
        "category": "Mechanical Isolation",
        "sifPotential": "HIGH",
        "sifScore": 82,
        "occurrences": 28,
        "affectedSitesCount": 3,
        "affectedSites": ["Site B", "Site C", "North Sea Brent Complex"],
        "trend30dPct": 18,
        "mtboDays": 5.8,
        "confidence": 91.2,
        "keyVector": "Hydrocracker Compression Train",
        "status": "ESCALATED AUDIT",
        "description": "Maintenance fitters bypassing mechanical disconnects and relying solely on paper tags during expedited pump seal overhauls.",
        "triad": {
            "hazardClass": "Stored Mechanical / Fluid Pressure",
            "trigger": "Residual Hydrocarbon Head (45 PSI)",
            "proceduralBreach": "Breaker Disconnect Omission",
            "behavioralVariance": "Turnaround Time-Pressure Rush",
            "consequence": "High-Pressure Hydrocarbon Fluid Spray"
        }
    },
    {
        "id": "gen-hw-sns-02",
        "code": "GEN-HW-SNS-02",
        "name": "Hot Work + Sniffer Drift + Blanket Misalignment",
        "category": "Flammable Atmosphere",
        "sifPotential": "MODERATE",
        "sifScore": 74,
        "occurrences": 19,
        "affectedSitesCount": 2,
        "affectedSites": ["Site B", "Site E Refineries"],
        "trend30dPct": -8,
        "mtboDays": 7.4,
        "confidence": 88.5,
        "keyVector": "CDU Column Flange Perimeter",
        "status": "STABILIZING VECTOR",
        "description": "Combustible gas monitor calibrated out of zero tolerance combined with fire blanket gaps allowing welding slag to travel near volatile process lines.",
        "triad": {
            "hazardClass": "Hot Work Cutting & Welding",
            "trigger": "Combustible LEL Detector Zero-Drift",
            "proceduralBreach": "Fire Watch Exclusion Zone Breach",
            "behavioralVariance": "Single-Operator Permitting",
            "consequence": "Hydrocarbon Vapor Flash Ignition"
        }
    },
    {
        "id": "gen-rig-lift-11",
        "code": "GEN-RIG-LIFT-11",
        "name": "Heavy Rigging + Blind Lift + Uncertified Tagline",
        "category": "Lifting & Rigging",
        "sifPotential": "HIGH",
        "sifScore": 81,
        "occurrences": 24,
        "affectedSitesCount": 3,
        "affectedSites": ["Site A", "Site C", "Wolfcamp"],
        "trend30dPct": 12,
        "mtboDays": 6.1,
        "confidence": 90.4,
        "keyVector": "Skid Transfer Crane Pedestal #2",
        "status": "ACTIVE THREAT VECTOR",
        "description": "Critical heavy lift over energized subsea process piping executed in blind spot without designated banksman audio channel.",
        "triad": {
            "hazardClass": "Suspended Dynamic Load (14 Metric Tons)",
            "trigger": "Uncertified Tagline Failure under Gust",
            "proceduralBreach": "No Radio Signal Confirmation",
            "behavioralVariance": "Rushed Pre-Shift Rigging Review",
            "consequence": "Dropped Object / High-Energy Impact on Piping"
        }
    }
]

SYNTHETIC_REPORTS: List[Dict[str, Any]] = [
    {
        "id": "rep-0941",
        "code": "NM-2024-0941",
        "date": "2024-02-18",
        "siteId": "site-b",
        "siteName": "Site B (Eagle Ford Hub)",
        "unit": "TK-402 Desander",
        "activity": "Confined Space Vessel Entry",
        "reportType": "Near Miss",
        "description": "During vessel purge inspection, crew entered the confined space [TK-402] at 03:15 hrs without continuous gas telemetry. Isolation valve V-12 was tagged but not mechanically locked with verified padlock. Area supervisor noticed the void, intervened, and initiated Stop Work Authority (SWA) prior to oxygen depletion event.",
        "sifPotential": "CRITICAL",
        "confidence": 0.942,
        "hazards": ["Hydrogen Sulfide (H2S) Accumulation", "Oxygen Deficiency (<19.5% Vol)"],
        "precursors": [
            "Omitted secondary gas sniff",
            "Incomplete mechanical lockout (tag without padlock)",
            "Shift change temporal window (03:15 hrs)"
        ],
        "lifeSavingRules": ["LSR-04: Confined Space Entry", "LSR-01: Energy Isolation (LOTO)"],
        "barrierFailures": [
            {"name": "Atmospheric Gas Testing", "status": "FAILED"},
            {"name": "Mechanical LOTO Lockout", "status": "BYPASSED"},
            {"name": "Stop Work Authority (SWA)", "status": "EFFECTIVE"}
        ],
        "consequences": ["Operator Asphyxiation", "Catastrophic Toxic Exposure"],
        "reporter": "S. Jenkins (PTW Holder)",
        "status": "COMMITTED"
    },
    {
        "id": "rep-4109",
        "code": "INC-2022-4109",
        "date": "2022-10-11",
        "siteId": "site-c",
        "siteName": "Site C (North Sea Platform)",
        "unit": "Flash Drum Separator V-104",
        "activity": "Vessel Internal Cleaning & Descaling",
        "reportType": "Incident",
        "description": "Residual hydrocarbon vapor pocket remained after primary nitrogen purge sequence caused by manifold valve pass-through leakage. Portable atmospheric sniffer alarm activated immediately at manway coaming threshold as work party attempted access.",
        "sifPotential": "CRITICAL",
        "confidence": 0.912,
        "hazards": ["Hydrocarbon Vapor Ingress", "Flash Fire Potential"],
        "precursors": [
            "Manifold pass-through leak during purge",
            "Inadequate continuous sniffer placement",
            "Defective seal seating"
        ],
        "lifeSavingRules": ["LSR-04: Confined Space Entry", "LSR-08: Hot Work & Ignition"],
        "barrierFailures": [
            {"name": "Nitrogen Purge Verification", "status": "FAILED"},
            {"name": "Manifold Isolation Seat", "status": "FAILED"},
            {"name": "Threshold Sniffer Alarm", "status": "EFFECTIVE"}
        ],
        "consequences": ["Vessel Explosion / Flash Burn"],
        "reporter": "J. McDonnell (Shift Lead)",
        "status": "VERIFIED"
    },
    {
        "id": "rep-7720",
        "code": "NM-2023-7720",
        "date": "2023-06-04",
        "siteId": "site-a",
        "siteName": "Site A (Permian Extraction)",
        "unit": "Turbine Compressor Unit-3",
        "activity": "Electrical Breaker Maintenance",
        "reportType": "Near Miss",
        "description": "During planned gas turbine overhaul, physical lockout tag was attached to adjacent motorized actuator circuit breaker rather than feeder breaker panel 4B. Mandatory multimeter zero-energy verification step detected 480V live bus, preventing major arc flash shock hazard.",
        "sifPotential": "HIGH",
        "confidence": 0.887,
        "hazards": ["480V Live Bus Energization", "Arc Flash Potential"],
        "precursors": [
            "Adjacent breaker mislabeling",
            "Night-shift turnover communication lapse",
            "Incomplete visual verification"
        ],
        "lifeSavingRules": ["LSR-01: Energy Isolation (LOTO)"],
        "barrierFailures": [
            {"name": "Breaker Tagout Placement", "status": "BYPASSED"},
            {"name": "Live-Dead-Live Probe Verification", "status": "EFFECTIVE"}
        ],
        "consequences": ["Electrocution / Severe Arc Flash Fatality"],
        "reporter": "R. Saikia (Senior Electrician)",
        "status": "COMMITTED"
    }
]

SAFETY_MEMORY_DATA: List[Dict[str, Any]] = [
    {
        "id": "mem-0941",
        "code": "NM-2024-0941",
        "title": "Confined Space TK-402 Sniffer & LOTO Bypass",
        "matchScore": 96.4,
        "sifPotential": "CRITICAL",
        "sifClassification": "High SIF Potential",
        "facility": "Site B (Eagle Ford Hub)",
        "unit": "TK-402 Desander",
        "date": "Feb 18, 2024",
        "governingLsr": "Confined Space Entry / Energy Isolation (LOTO)",
        "narrative": "Technician prepared to enter purged separation vessel without completing atmospheric 4-gas calibration verification. Simultaneously, a high-pressure master padlock was omitted on upstream isolation valve V-12, leaving active fluid intake unisolated during preparatory manway hatch removal.",
        "extractedPrecursors": [
            "Omitted secondary sniff",
            "Incomplete mechanical lockout",
            "SWA Executed (Barrier Saved)"
        ],
        "remediation": "Supervisor SWA halt, shift permit revoked, 48h barrier audit executed.",
        "verified": True,
        "category": "Confined Space",
        "brokenBarrier": "Atmospheric Gas Testing & Valve Padlock Lockout",
        "lessonsLearned": "Mandatory optical barcode scan on physical padlock keys before PTW activation.",
        "failureMechanism": "Human slip during night shift handover coupled with missing physical lockout key."
    },
    {
        "id": "mem-4109",
        "code": "INC-2022-4109",
        "title": "Residual Hydrocarbon Pocket Exposure During Manway Opening",
        "matchScore": 91.2,
        "sifPotential": "CRITICAL",
        "sifClassification": "SIF Actualized / Tier 2",
        "facility": "Site C (North Sea Platform)",
        "unit": "Flash Drum Separator",
        "date": "Oct 11, 2022",
        "governingLsr": "Confined Space Entry (Toxic/Hydrocarbon Ingress)",
        "narrative": "Residual hydrocarbon vapor pocket remained after primary nitrogen purge sequence caused by manifold valve pass-through leakage. Portable atmospheric sniffer alarm activated immediately at manway coaming threshold as work party attempted access.",
        "extractedPrecursors": [
            "Manifold leak during purge",
            "Inadequate continuous sniffer placement",
            "Defective seal seating"
        ],
        "remediation": "CAPA-098 implemented; automated acoustic leak sniffing mandated on purge loops.",
        "verified": True,
        "category": "Confined Space",
        "brokenBarrier": "Nitrogen Purge Manifold Valve Seal",
        "lessonsLearned": "Always conduct dual sniff at top manway and bottom drain outlet before human entry.",
        "failureMechanism": "Valve seat scoring allowed continuous trace ethane/propane seep through nitrogen line."
    },
    {
        "id": "mem-7720",
        "code": "NM-2023-7720",
        "title": "Adjacent Breaker Lockout Misalignment on Gas Turbine",
        "matchScore": 88.7,
        "sifPotential": "HIGH",
        "sifClassification": "High SIF Potential",
        "facility": "Site A (Permian Extraction)",
        "unit": "Turbine Compressor Unit-3",
        "date": "June 04, 2023",
        "governingLsr": "Energy Isolation (LOTO Electrical Safeguards)",
        "narrative": "During planned gas turbine overhaul, physical lockout tag was attached to adjacent motorized actuator circuit breaker rather than feeder breaker panel 4B. Mandatory multimeter zero-energy verification step detected 480V live bus, preventing major arc flash shock hazard.",
        "extractedPrecursors": [
            "Adjacent breaker mislabeling",
            "Live-dead-live probe check triggered safeguard"
        ],
        "remediation": "Breaker cluster relabeled; digital barcode scanning mandatory on MCC cabinets.",
        "verified": True,
        "category": "Energy Isolation",
        "brokenBarrier": "Visual Breaker Panel Designation",
        "lessonsLearned": "Never rely solely on engraved nameplates without cross-referencing single-line electrical diagrams.",
        "failureMechanism": "Panel re-wiring during turnaround created discrepancy between physical door and chassis label."
    },
    {
        "id": "mem-1044",
        "code": "INC-2021-1044",
        "title": "Unpurged Flare Knockout Drum Toxic Off-Gas",
        "matchScore": 84.1,
        "sifPotential": "CRITICAL",
        "sifClassification": "High SIF Potential",
        "facility": "Site B (Eagle Ford Hub)",
        "unit": "Sector 3 Flange 108",
        "date": "Nov 29, 2021",
        "governingLsr": "Confined Space Entry / Process Safety",
        "narrative": "Condensate drum unbolted without secondary blind installed. Toxic H2S gas released into wind-sheltered bay, triggering static sensor alarms at 42 ppm.",
        "extractedPrecursors": [
            "Lack of positive physical blind",
            "Wind void accumulation area"
        ],
        "remediation": "Installation of permanent double-block-and-bleed manifold.",
        "verified": True,
        "category": "Process Safety",
        "brokenBarrier": "Physical Pipe Blind Spectacle Flange",
        "lessonsLearned": "Single valve shutoff must never substitute for positive physical pancake blind.",
        "failureMechanism": "Gate valve seat passing under 120 PSI static hydrostatic line pressure."
    }
]

KNOWLEDGE_GRAPH_NODES: List[Dict[str, Any]] = [
    {
        "id": "ND-402",
        "label": "Confined Space Entry",
        "type": "hub",
        "category": "Primary Activity / Hazardous Environment",
        "sifWeight": 0.942,
        "severity": "CRITICAL",
        "centrality": 0.89,
        "betweenness": 0.764,
        "details": "Central activity node characterized by permit-required vessel, drum, or tank entry where atmospheric and isolation controls are primary defenses.",
        "x": 500.0,
        "y": 350.0,
        "connections": ["ND-901", "ND-112", "ND-115", "ND-119", "ND-501", "ND-504", "ND-204", "ND-209", "ND-214", "ND-701", "ND-702"],
        "status": "nominal"
    },
    {
        "id": "ND-901",
        "label": "Asphyxiation / Fatal Exposure",
        "type": "outcome",
        "category": "Critical Outcome Vector",
        "sifWeight": 0.98,
        "severity": "CATASTROPHIC",
        "centrality": 0.72,
        "betweenness": 0.65,
        "details": "Loss of life consequence vector directly actualized when toxic gas inhalation or oxygen starvation persists > 90 seconds.",
        "x": 130.0,
        "y": 340.0,
        "connections": ["ND-115", "ND-112"],
        "status": "critical"
    },
    {
        "id": "ND-112",
        "label": "Toxic H2S Gas Pocket",
        "type": "hazard",
        "category": "Process Gas Hazard",
        "sifWeight": 0.88,
        "severity": "CAT-4",
        "centrality": 0.64,
        "betweenness": 0.52,
        "details": "Sour crude hydrocarbon off-gassing with atmospheric concentrations exceeding 10 ppm IDLH threshold.",
        "x": 270.0,
        "y": 210.0,
        "connections": ["ND-402", "ND-901", "ND-501"],
        "status": "nominal"
    },
    {
        "id": "ND-115",
        "label": "Oxygen Depletion < 19.5%",
        "type": "hazard",
        "category": "Atmospheric Asphyxiation Hazard",
        "sifWeight": 0.92,
        "severity": "CAT-4",
        "centrality": 0.78,
        "betweenness": 0.69,
        "details": "Displacement of breathable atmosphere by nitrogen purge gas or biological oxidation inside vessel volume.",
        "x": 230.0,
        "y": 340.0,
        "connections": ["ND-402", "ND-901"],
        "status": "nominal"
    },
    {
        "id": "ND-501",
        "label": "LSR: Confined Space Entry",
        "type": "rule",
        "category": "IOGP Mandated Life-Saving Rule #04",
        "sifWeight": 0.95,
        "severity": "MANDATORY",
        "centrality": 0.81,
        "betweenness": 0.70,
        "details": "Rule 04 requires confirmed atmospheric verification, certified rescue standby, and dual authorization prior to transit.",
        "x": 480.0,
        "y": 130.0,
        "connections": ["ND-402", "ND-112"],
        "status": "nominal"
    },
    {
        "id": "ND-504",
        "label": "LSR: Energy Isolation (LOTO)",
        "type": "rule",
        "category": "IOGP Mandated Life-Saving Rule #01",
        "sifWeight": 0.91,
        "severity": "MANDATORY",
        "centrality": 0.79,
        "betweenness": 0.68,
        "details": "Rule 01 requires zero energy proof, positive padlocked physical isolation, and tag tracking on all upstream headers.",
        "x": 310.0,
        "y": 100.0,
        "connections": ["ND-402"],
        "status": "nominal"
    },
    {
        "id": "ND-204",
        "label": "Atmospheric Gas Testing",
        "type": "barrier",
        "category": "Engineered & Administrative Barrier",
        "sifWeight": 0.96,
        "severity": "CRITICAL DEFENSE",
        "centrality": 0.91,
        "betweenness": 0.84,
        "details": "Continuous multi-gas sniffing detector measuring LEL, O2, H2S, and CO at multiple vessel depths.",
        "x": 680.0,
        "y": 240.0,
        "connections": ["ND-402", "ND-112"],
        "status": "failed"
    },
    {
        "id": "ND-209",
        "label": "Physical Padlock LOTO",
        "type": "barrier",
        "category": "Mechanical Barrier",
        "sifWeight": 0.93,
        "severity": "PRIMARY DEFENSE",
        "centrality": 0.88,
        "betweenness": 0.81,
        "details": "Hardened master lock preventing actuation of line valve V-12 during internal work cycles.",
        "x": 730.0,
        "y": 380.0,
        "connections": ["ND-402", "ND-504"],
        "status": "failed"
    },
    {
        "id": "ND-214",
        "label": "Stop Work Authority (SWA)",
        "type": "barrier",
        "category": "Human Line of Defense",
        "sifWeight": 0.99,
        "severity": "ULTIMATE SAFEGUARD",
        "centrality": 0.94,
        "betweenness": 0.91,
        "details": "Field team right and obligation to halt unmitigated work upon detecting bypassed barriers.",
        "x": 700.0,
        "y": 510.0,
        "connections": ["ND-402", "ND-901"],
        "status": "nominal"
    }
]

KNOWLEDGE_GRAPH_EDGES: List[Dict[str, Any]] = [
    {"id": "e-1", "from": "ND-402", "to": "ND-901", "label": "can lead to", "type": "leads_to", "weight": 0.94, "color": "#f87171"},
    {"id": "e-2", "from": "ND-402", "to": "ND-112", "label": "harbors", "type": "harbors", "weight": 0.88, "color": "#fb923c"},
    {"id": "e-3", "from": "ND-402", "to": "ND-115", "label": "harbors", "type": "harbors", "weight": 0.92, "color": "#fb923c"},
    {"id": "e-4", "from": "ND-112", "to": "ND-901", "label": "triggers", "type": "triggers", "weight": 0.95, "color": "#ef4444"},
    {"id": "e-5", "from": "ND-115", "to": "ND-901", "label": "triggers", "type": "triggers", "weight": 0.98, "color": "#ef4444"},
    {"id": "e-6", "from": "ND-501", "to": "ND-402", "label": "governs", "type": "rules", "weight": 0.90, "color": "#38bdf8"},
    {"id": "e-7", "from": "ND-504", "to": "ND-402", "label": "governs", "type": "rules", "weight": 0.90, "color": "#38bdf8"},
    {"id": "e-8", "from": "ND-204", "to": "ND-402", "label": "safeguards", "type": "mitigates", "weight": 0.96, "color": "#4ade80"},
    {"id": "e-9", "from": "ND-209", "to": "ND-402", "label": "safeguards", "type": "mitigates", "weight": 0.93, "color": "#4ade80"},
    {"id": "e-10", "from": "ND-214", "to": "ND-901", "label": "prevents", "type": "mitigates", "weight": 0.99, "color": "#10b981"}
]

INITIAL_INTERVENTIONS: List[Dict[str, Any]] = [
    {
        "id": "int-902",
        "code": "INT-902",
        "title": "Mandatory Dual-Signoff Gas Testing Prior to Vessel Entry",
        "description": "Continuous multi-gas sniff + electronic PTW secondary verification before hatch threshold entry plane is crossed.",
        "precursorPattern": "Pattern #01 (Confined Space + Omitted Sniff + LOTO Defect)",
        "targetedVector": "Confined Space Vessel Entry / Atmospheric Decay",
        "lsrCode": "LSR-04",
        "lsrTitle": "Confined Space Entry",
        "sifRiskPct": 94.0,
        "priority": "Critical",
        "status": "In Progress",
        "targetFacility": "Site B (Eagle Ford Hub)",
        "affectedSitesSummary": "Site B, Site A, Site D, Rig 19 (4 Operating Units)",
        "observedRecurrence": "31 Reports (Past 30 Rolling Days)",
        "protocolSteps": [
            "Mandate continuous multi-gas monitor telemetry stream into central HSE console.",
            "Require secondary supervisor verification signoff on electronic PTW within 15 min of entry.",
            "Conduct 24-hr field stand-down with maintenance shift crews."
        ],
        "owner": "D. Holloway",
        "ownerRole": "Lead HSE Specialist",
        "dueDate": "2024-03-28",
        "progressPct": 65.0,
        "verificationMetric": "-84% Precursors Post-Rollout",
        "createdAt": "2024-02-20"
    },
    {
        "id": "int-889",
        "code": "INT-889",
        "title": "Digital Lockout/Tagout (LOTO) Physical QR Sentry Audit",
        "description": "Optical padlock QR scan barrier for master electrical switchboards and pressurized valve headers.",
        "precursorPattern": "Pattern #02 (LOTO Tag without Master Padlock)",
        "targetedVector": "Mechanical Energy Isolation / Stored Fluid Head",
        "lsrCode": "LSR-01",
        "lsrTitle": "Energy Isolation (LOTO)",
        "sifRiskPct": 81.0,
        "priority": "High",
        "status": "Approved",
        "targetFacility": "Site B / Site C",
        "affectedSitesSummary": "Site B, Site C, North Sea Brent Complex (3 Units)",
        "observedRecurrence": "28 Reports (Persistent Barrier Drift)",
        "protocolSteps": [
            "Deploy smart mobile QR scanning on all 14 breaker & valve isolation racks.",
            "Enforce dual optical validation before issuing hot work electrical permits.",
            "Re-baseline master padlock inventory across North Sea Hub."
        ],
        "owner": "E. Vance",
        "ownerRole": "Ops Lead",
        "dueDate": "2024-04-04",
        "progressPct": 30.0,
        "verificationMetric": "-61% Defect Rate",
        "createdAt": "2024-02-25"
    },
    {
        "id": "int-856",
        "code": "INT-856",
        "title": "Hot Work Flammable Sniffer Sensor Recalibration Sweep",
        "description": "Daily bump-testing audit of all portable Lower Explosive Limit (LEL) meters and catalytic bead replacements.",
        "precursorPattern": "Pattern #03 (LEL Sniffer Drift in Distillation Column)",
        "targetedVector": "Flammable Hydrocarbon Buffer / Hot Cutting",
        "lsrCode": "LSR-08",
        "lsrTitle": "Hot Work & Ignition Controls",
        "sifRiskPct": 62.0,
        "priority": "Moderate",
        "status": "Proposed",
        "targetFacility": "Site B, Site E Refineries",
        "affectedSitesSummary": "Site B, Site E Refineries (2 Operating Units)",
        "observedRecurrence": "19 Reports (Sensor Zero Drift Metric)",
        "protocolSteps": [
            "Daily bump-testing audit of all portable Lower Explosive Limit (LEL) meters.",
            "Immediate swap of out-of-spec catalytic diffusion beads in Column Unit 4.",
            "Issue field safety bulletin on VOC sensor cross-sensitivity."
        ],
        "owner": "M. Vance",
        "ownerRole": "Lead HSE Officer",
        "dueDate": "2024-04-12",
        "progressPct": 10.0,
        "verificationMetric": "-45% Sensor Variance",
        "createdAt": "2024-03-01"
    }
]

INITIAL_REVIEWS: List[Dict[str, Any]] = [
    {
        "id": "rev-0941",
        "incidentCode": "NM-2024-0941",
        "siteName": "Site B (Eagle Ford Hub)",
        "unit": "Permian Basin Unit TK-402 Desander",
        "eventTime": "Today, 03:15 UTC",
        "reporter": "S. Jenkins (PTW Holder)",
        "vectorHash": "#8f01b-c12",
        "title": "Confined Space TK-402 Gas Isolation Failure",
        "narrative": "During routine maintenance at Site B, a mechanical contractor entered vessel [TK-402] without secondary atmospheric gas testing. Isolation valve V-12 was tagged with plastic hazard tape but not mechanically locked with verified padlock. HSE Area Supervisor halted operations immediately (SWA triggered) prior to internal flange unbolting.",
        "annotatedTokens": [
            {
                "id": "tok-1",
                "text": "[TK-402]",
                "type": "asset-tag",
                "weightPct": 88.0,
                "description": "Vessel unit designated as high-consequence sour crude desander."
            },
            {
                "id": "tok-2",
                "text": "secondary atmospheric gas testing",
                "type": "critical-precursor",
                "weightPct": 97.8,
                "description": "Mandatory continuous multi-gas sensor sniff omitted prior to entry plane transit."
            },
            {
                "id": "tok-3",
                "text": "not mechanically locked with verified padlock",
                "type": "barrier-breach",
                "weightPct": 92.6,
                "description": "Breach of positive mechanical lockout rule (LOTO Cardinal Rule #1)."
            },
            {
                "id": "tok-4",
                "text": "(SWA triggered)",
                "type": "mitigating-action",
                "weightPct": 99.1,
                "description": "Supervisor Stop Work Authority halted actualized exposure."
            }
        ],
        "aiSifLevel": "CRITICAL",
        "aiSifScorePct": 87.4,
        "aiConfidencePct": 94.6,
        "primaryLsr": "LSR-04: Confined Space Entry (IOGP Matched)",
        "secondaryLsr": "LSR-01: Energy Isolation (LOTO)",
        "featureTags": [
            {"name": "No Secondary Gas Sniff", "weight": 97.8},
            {"name": "Unverified Padlock LOTO", "weight": 92.6},
            {"name": "Supervisor SWA Action", "weight": 99.1}
        ],
        "barriers": [
            {
                "id": "b-01",
                "code": "B-01",
                "name": "Multi-Gas Sniff Test",
                "description": "Atmospheric verify at threshold coaming",
                "status": "FAILED"
            },
            {
                "id": "b-02",
                "code": "B-02",
                "name": "Mechanical LOTO",
                "description": "Energy containment padlock on V-12",
                "status": "BYPASSED"
            },
            {
                "id": "b-03",
                "code": "B-03",
                "name": "SWA Intervention",
                "description": "Human line-of-defense verbal stop",
                "status": "EFFECTIVE"
            }
        ],
        "specialistNotes": "Supervisor SWA intervention successfully prevented toxic H2S/hydrocarbon exposure. Mandatory 48h barrier audit and second-party gas sniff protocol dispatched to Site B. Incident calibrated as High SIF Precursor and logged into corporate institutional memory.",
        "status": "PENDING_REVIEW",
        "opticalFeed": None
    }
]

RISK_MATRIX_CELLS: List[Dict[str, Any]] = [
    {"row": 0, "col": 0, "consequence": "Catastrophic (SIF)", "likelihood": "Rare", "count": 14, "severity": "HIGH", "facilityIds": ["site-b", "site-a"]},
    {"row": 0, "col": 1, "consequence": "Catastrophic (SIF)", "likelihood": "Unlikely", "count": 28, "severity": "CRITICAL", "facilityIds": ["site-b", "site-wolfcamp"]},
    {"row": 0, "col": 2, "consequence": "Catastrophic (SIF)", "likelihood": "Possible", "count": 82, "severity": "CRITICAL", "facilityIds": ["site-b", "site-perdido"]},
    {"row": 0, "col": 3, "consequence": "Catastrophic (SIF)", "likelihood": "Likely", "count": 182, "severity": "CRITICAL", "facilityIds": ["site-b"]},
    {"row": 0, "col": 4, "consequence": "Catastrophic (SIF)", "likelihood": "Frequent", "count": 48, "severity": "CRITICAL", "facilityIds": ["site-b"]},
    {"row": 1, "col": 0, "consequence": "Major Impact", "likelihood": "Rare", "count": 35, "severity": "MODERATE", "facilityIds": ["site-c"]},
    {"row": 1, "col": 1, "consequence": "Major Impact", "likelihood": "Unlikely", "count": 68, "severity": "HIGH", "facilityIds": ["site-a", "site-c"]},
    {"row": 1, "col": 2, "consequence": "Major Impact", "likelihood": "Possible", "count": 124, "severity": "HIGH", "facilityIds": ["site-a", "site-troll-a"]},
    {"row": 1, "col": 3, "consequence": "Major Impact", "likelihood": "Likely", "count": 142, "severity": "CRITICAL", "facilityIds": ["site-wolfcamp"]},
    {"row": 1, "col": 4, "consequence": "Major Impact", "likelihood": "Frequent", "count": 31, "severity": "CRITICAL", "facilityIds": ["site-b", "site-a"]},
    {"row": 2, "col": 0, "consequence": "Moderate Loss", "likelihood": "Rare", "count": 88, "severity": "LOW", "facilityIds": ["site-d"]},
    {"row": 2, "col": 1, "consequence": "Moderate Loss", "likelihood": "Unlikely", "count": 145, "severity": "MODERATE", "facilityIds": ["site-c", "site-d"]},
    {"row": 2, "col": 2, "consequence": "Moderate Loss", "likelihood": "Possible", "count": 210, "severity": "MODERATE", "facilityIds": ["site-a", "site-c"]},
    {"row": 2, "col": 3, "consequence": "Moderate Loss", "likelihood": "Likely", "count": 94, "severity": "HIGH", "facilityIds": ["site-troll-a"]},
    {"row": 2, "col": 4, "consequence": "Moderate Loss", "likelihood": "Frequent", "count": 18, "severity": "HIGH", "facilityIds": ["site-perdido"]},
    {"row": 3, "col": 0, "consequence": "Minor Damage", "likelihood": "Rare", "count": 190, "severity": "LOW", "facilityIds": ["site-d", "site-clair-ridge"]},
    {"row": 3, "col": 1, "consequence": "Minor Damage", "likelihood": "Unlikely", "count": 340, "severity": "LOW", "facilityIds": ["site-c", "site-clair-ridge"]},
    {"row": 3, "col": 2, "consequence": "Minor Damage", "likelihood": "Possible", "count": 412, "severity": "MODERATE", "facilityIds": ["site-d"]},
    {"row": 3, "col": 3, "consequence": "Minor Damage", "likelihood": "Likely", "count": 180, "severity": "MODERATE", "facilityIds": ["site-a"]},
    {"row": 3, "col": 4, "consequence": "Minor Damage", "likelihood": "Frequent", "count": 22, "severity": "MODERATE", "facilityIds": ["site-b"]},
    {"row": 4, "col": 0, "consequence": "Insignificant", "likelihood": "Rare", "count": 420, "severity": "LOW", "facilityIds": ["site-d"]},
    {"row": 4, "col": 1, "consequence": "Insignificant", "likelihood": "Unlikely", "count": 510, "severity": "LOW", "facilityIds": ["site-c", "site-d"]},
    {"row": 4, "col": 2, "consequence": "Insignificant", "likelihood": "Possible", "count": 320, "severity": "LOW", "facilityIds": ["site-a"]},
    {"row": 4, "col": 3, "consequence": "Insignificant", "likelihood": "Likely", "count": 110, "severity": "LOW", "facilityIds": ["site-wolfcamp"]},
    {"row": 4, "col": 4, "consequence": "Insignificant", "likelihood": "Frequent", "count": 16, "severity": "LOW", "facilityIds": ["site-b"]}
]

WHAT_CHANGED_DATA: Dict[str, Any] = {
    "baselinePeriod": "Q3 Baseline (90D Rolling Average)",
    "activePeriod": "Current Trailing 30-Day Window",
    "precursorAcceleration": "+34.2%",
    "eventsInActive": 412,
    "eventsInBaseline": 307,
    "barrierIntegrityDrop": "-14.6%",
    "baselineIntegrity": 88.8,
    "currentIntegrity": 74.2,
    "emergentFailureModes": 3,
    "highEnergySpikes": 8,
    "keyShiftObservation": "Concentration of unverified LOTO valves coinciding with expedited turnaround hours (02:00 - 05:00 UTC shift turnover window).",
    "divergenceCurve": {
        "baselinePath": "M 0 140 Q 150 135 300 130 T 600 120 T 900 115",
        "activePath": "M 0 140 Q 150 125 300 95 T 600 50 T 900 32",
        "activePeakX": 640,
        "activePeakY": 48,
        "peakLabel": "Velocity Divergence Spike (+34.2% Precursors)",
        "shiftDeltaPct": "+34.2%"
    },
    "flaggedPrecursors": [
        {
            "id": "chg-1",
            "name": "Omitted Atmospheric 4-Gas Sniff",
            "lsr": "LSR-04: Confined Space Entry",
            "asset": "Site B (Eagle Ford Hub)",
            "baselineRate": "2.1 / wk",
            "activeRate": "7.4 / wk",
            "delta": "+252%",
            "badgeClass": "text-error bg-error-container",
            "recommendedCapaTitle": "Mandate Continuous Telemetry Sniffing Protocol",
            "recommendedCapaVector": "Confined Space / Atmospheric Decay",
            "recommendedPriority": "Critical"
        },
        {
            "id": "chg-2",
            "name": "Tag Placed Without Master Padlock",
            "lsr": "LSR-01: Energy Isolation (LOTO)",
            "asset": "Site B / Site A Extraction 04",
            "baselineRate": "3.4 / wk",
            "activeRate": "8.9 / wk",
            "delta": "+161%",
            "badgeClass": "text-error bg-error-container",
            "recommendedCapaTitle": "Deploy Optical QR Lockout Verification Sentry",
            "recommendedCapaVector": "Mechanical Isolation / Stored Pressure",
            "recommendedPriority": "High"
        },
        {
            "id": "chg-3",
            "name": "Torn Welding Fire Blanket Gap (>10cm)",
            "lsr": "LSR-08: Hot Work & Ignition",
            "asset": "Site C (North Sea Platform)",
            "baselineRate": "1.2 / wk",
            "activeRate": "3.1 / wk",
            "delta": "+158%",
            "badgeClass": "text-secondary bg-secondary-container/40",
            "recommendedCapaTitle": "Mandate Fire Blanket Pre-Flight Integrity Signoff",
            "recommendedCapaVector": "Hot Work / Flammable Atmosphere",
            "recommendedPriority": "Moderate"
        }
    ]
}

SAFETY_RULES: List[Dict[str, Any]] = [
    {
        "id": "lsr-01",
        "code": "LSR-01",
        "name": "Energy Isolation (LOTO)",
        "category": "critical",
        "icon": "lock_clock",
        "description": "Verify zero energy state and positive mechanical lockout before touching systems.",
        "incidentsCount": 40,
        "percentage": 38,
        "barColorClass": "bg-primary-container",
        "standardsRef": "IOGP 459 Standard 1 / OSHA 1910.147"
    },
    {
        "id": "lsr-02",
        "code": "LSR-02",
        "name": "Working at Height (Harness & Decking)",
        "category": "critical",
        "icon": "height",
        "description": "Protect against falls from height with 100% tie-off and certified anchor points.",
        "incidentsCount": 25,
        "percentage": 24,
        "barColorClass": "bg-secondary",
        "standardsRef": "IOGP 459 Standard 2 / OSHA 1910.140"
    },
    {
        "id": "lsr-04",
        "code": "LSR-04",
        "name": "Confined Space Entry",
        "category": "critical",
        "icon": "sensor_door",
        "description": "Obtain authorization, verify atmospheric testing, and maintain standby rescue.",
        "incidentsCount": 20,
        "percentage": 19,
        "barColorClass": "bg-error",
        "standardsRef": "IOGP 459 Standard 4 / OSHA 1910.146"
    },
    {
        "id": "lsr-05",
        "code": "LSR-05",
        "name": "Line of Fire / Suspended Loads",
        "category": "mechanical",
        "icon": "track_changes",
        "description": "Position personnel away from moving machinery, heavy rigging drop zones, and pressurized lines.",
        "incidentsCount": 13,
        "percentage": 12,
        "barColorClass": "bg-primary-fixed",
        "standardsRef": "IOGP 459 Standard 5 / API RP 54"
    },
    {
        "id": "lsr-07",
        "code": "LSR-07",
        "name": "Bypass Safety Controls / Interlocks",
        "category": "mechanical",
        "icon": "tune",
        "description": "Obtain special authorization before overriding, disabling, or modifying safety interlocks.",
        "incidentsCount": 7,
        "percentage": 7,
        "barColorClass": "bg-outline",
        "standardsRef": "IOGP 459 Standard 7 / IEC 61511"
    },
    {
        "id": "lsr-08",
        "code": "LSR-08",
        "name": "Hot Work & Flammable Atmospheres",
        "category": "critical",
        "icon": "local_fire_department",
        "description": "Identify ignition sources, continuous gas monitoring, and combustible fire-watch blankets.",
        "incidentsCount": 18,
        "percentage": 16,
        "barColorClass": "bg-amber-500",
        "standardsRef": "IOGP 459 Standard 8 / NFPA 51B"
    }
]
