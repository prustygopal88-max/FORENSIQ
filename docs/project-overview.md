# FORENSIQ: Project Overview & Novelty

## Executive Summary
**FORENSIQ** is a high-performance Digital Forensic Investigation and Temporal Query System designed to enable cybersecurity investigators, incident responders, and forensic auditors to query heterogeneous forensic telemetry using plain natural language.

## The Forensic Challenge
Traditional incident response workflows suffer from significant friction:
1. **Query Barrier:** Investigators must write complex SQL statements or SIEM query languages (KQL, SPL, Lucene).
2. **Log Silos:** Authentication logs (Windows Security Event Logs), peripheral logs (SetupAPI, USBSTOR), and file audit logs (NTFS USN Journal, Sysmon) adhere to disparate schemas.
3. **Temporal Inefficiency:** Pinpointing what occurred *immediately before* an intrusion or *subsequent to* a peripheral insertion requires error-prone manual timestamp arithmetic.
4. **Black-Box AI Risks:** LLM-based assistants are notorious for hallucinations, fabricating event IDs, or unscientifically claiming criminal activity without verifiable proof.

## The FORENSIQ Novelty
FORENSIQ introduces a 4-pillar architectural breakthrough:
1. **Deterministic NLP-to-Forensic-Query Engine:**
   Extracts intent, target actions, status, temporal directional operators (`BEFORE`, `AFTER`, `WITHIN`, `BETWEEN`), and landmark reference events without external cloud LLM dependencies.
2. **Dynamic Temporal Interval Reasoning:**
   Automatically discovers landmark reference anchors in the database (e.g., $T_{ref}$ of a successful login or USB insertion) and computes relative time bounds and deltas.
3. **Normalized Heterogeneous Storage:**
   Unifies Authentication, File, USB, and System events into a normalized schema with dataset provenance tagging (`Live Authentication`, `Simulated Forensic Source`, `Public Dataset`).
4. **Explainable AI (XAI) Verification Matrix:**
   Rather than stating "AI detected suspicious activity", FORENSIQ provides a verifiable 5-point proof breakdown for every retrieved evidence artifact.
