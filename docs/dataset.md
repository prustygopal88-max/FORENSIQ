# FORENSIQ Synthetic Digital Forensic Dataset

## Overview
The FORENSIQ Synthetic Telemetry Dataset contains **15,000+ realistic, chronologically ordered forensic endpoint events** designed for training, evaluating, and demonstrating NLP-based temporal reasoning engines.

Generated via `backend/app/database/generate_dataset.py`, the dataset is **100% reproducible** using a fixed pseudorandom seed (`seed = 42`).

---

## Dataset Characteristics

| Attribute | Specification |
|---|---|
| **Total Event Count** | 15,000+ events |
| **Random Seed** | `42` (Fixed & Fully Reproducible) |
| **Time Span** | 14 days preceding execution |
| **Provenance Label** | `SYNTHETIC_DATASET` |
| **Storage Engine** | SQLite 3 (`backend/forensiq.db`) |
| **Normal Benign Ratio** | 65% (~9,750 events) |
| **Suspicious Scenario Ratio** | 35% (~5,250 events) |
| **Departments Represented** | Executive, Engineering, Finance, HR, IT Administration, Sales |
| **Monitored Workstations** | `FORENSIQ-PC`, `WS-ENG-04`, `WS-FIN-12`, `WS-EXEC-01`, `WS-HR-07`, `WS-IT-02` |

---

## Schema & Column Reference

All events conform to the normalized 31-column forensic relational schema:

```sql
CREATE TABLE forensic_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user TEXT NOT NULL,
    machine TEXT NOT NULL,
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    device TEXT,
    file TEXT,
    metadata TEXT,
    dataset_label TEXT NOT NULL,
    destination TEXT,
    device_type TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    drive_letter TEXT,
    file_path TEXT,
    file_size INTEGER,
    file_sensitivity TEXT,
    email_service TEXT,
    sender TEXT,
    recipient TEXT,
    recipient_type TEXT,
    recipient_domain TEXT,
    process TEXT,
    scenario_type TEXT,
    is_suspicious INTEGER DEFAULT 0,
    description TEXT
);
```

---

## Scenario Distribution

### 1. Normal Benign Activity (~65%)
- **Workstation Logons:** Routine morning Kerberos and NTLM authentications (`SUCCESSFUL_LOGIN`).
- **Standard Document Operations:** Internal business file creations, modifications, and reads (`FILE_ACCESS`, `FILE_MODIFIED`, `FILE_CREATED`) with sensitivity `PUBLIC` and `INTERNAL`.
- **Internal Communications:** Benign corporate emails dispatched via `CORPORATE_MAIL` or `OUTLOOK` to `@corp.internal` recipients.
- **Authorized Removable Media Usage:** Benign USB connections for presentations.
- **Operating System Services:** Routine Windows background service spawns and audit heartbeats.

### 2. Suspicious & Exfiltration Attack Sequences (~35%)

#### A. Brute-Force & Credential Stuffing (`MULTIPLE_FAILED_LOGIN`)
- **Pattern:** 3 to 6 rapid `FAILED_LOGIN` events (Windows Event ID 4625, bad password) within 1 to 5 minutes, followed immediately by a single `SUCCESSFUL_LOGIN` (Event ID 4624) or account lockout.
- **Forensic Landmark:** `successful_login`
- **Target Inquiry:** `"Show failed login attempts within 5 minutes before the successful login."`

#### B. USB Removable Flash Drive Exfiltration (`USB_DATA_EXFILTRATION`)
- **Pattern:**
  1. `USB_CONNECTED` (`USB_FLASH_DRIVE`, e.g., SanDisk Ultra, Kingston DataTraveler mounted at `E:\`)
  2. `FILE_ACCESS` on high-sensitivity document (`RESTRICTED` / `CONFIDENTIAL`, e.g., `Customer_PII_Database.sql`, `Q4_Merger_Strategy.docx`)
  3. `FILE_COPIED_TO_REMOVABLE_DEVICE` (written to `E:\...`)
  4. `USB_REMOVED` within 2 to 10 minutes.
- **Forensic Landmark:** `usb_connected`
- **Target Inquiry:** `"Show files copied to USB after pendrive was connected."`

#### C. External HDD / SSD Bulk Storage Exfiltration (`EXTERNAL_DRIVE_DATA_EXFILTRATION`)
- **Pattern:**
  1. `USB_CONNECTED` (`EXTERNAL_HDD` or `EXTERNAL_SSD`, e.g., Western Digital My Passport 2TB, Samsung T7 Shield mounted at `F:\`)
  2. Sequential bulk file reads and writes across proprietary archives (`Source_Code_Repo_Master.zip`, `Financial_Ledger_2026.db`)
  3. `USB_REMOVED`.
- **Forensic Landmark:** `external_drive_connected`
- **Target Inquiry:** `"Show files copied to external hard drive after it was connected"`

#### D. Email Data Exfiltration (`EMAIL_DATA_EXFILTRATION`)
- **Pattern:**
  1. `FILE_ACCESS` of sensitive asset (`RESTRICTED` / `CONFIDENTIAL`)
  2. `FILE_ATTACHED_TO_EMAIL` in Outlook or Gmail
  3. `EMAIL_SENT` with `recipient_type = 'EXTERNAL'`, dispatched to untrusted domains (`proton.me`, `anon-drop.net`, `competitor-corp.com`).
- **Forensic Landmark:** `sensitive_file_access`
- **Target Inquiry:** `"Show sensitive files emailed to external recipients within 10 minutes after access"`

---

## Reproducing the Dataset

To generate or re-populate the dataset from scratch:

```bash
cd backend
python app/database/generate_dataset.py 15000
```
