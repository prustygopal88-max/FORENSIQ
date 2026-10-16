import random
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

# Ensure parent directory is on sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database.db import get_connection, record_forensic_events_batch, init_db

USERS_BY_DEPT = {
    "Executive": ["Gopal", "Victoria.Chen", "David.Sterling"],
    "Engineering": ["Marcus.Vance", "Elena.Rostova", "Devon.Park"],
    "Finance": ["Sarah.Jenkins", "Robert.Perez", "Ananya.Iyer"],
    "HR": ["Jessica.Alba", "Liam.OConnor"],
    "IT": ["Admin.Gopal", "SysAdmin.Root", "Kiran.Nair"],
    "Sales": ["Carlos.Mendez", "Rachel.Green"]
}

ALL_USERS = [u for users in USERS_BY_DEPT.values() for u in users]
MACHINES = ["FORENSIQ-PC", "WS-ENG-04", "WS-FIN-12", "WS-EXEC-01", "WS-HR-07", "WS-IT-02"]

SENSITIVE_FILES = [
    ("Q4_Merger_Strategy.docx", "RESTRICTED", 4850000, "word.exe"),
    ("Customer_PII_Database.sql", "RESTRICTED", 185000000, "sqlcmd.exe"),
    ("Executive_Payroll_2026.xlsx", "CONFIDENTIAL", 3200000, "excel.exe"),
    ("Patent_Blueprints_Core_V2.dwg", "CONFIDENTIAL", 85000000, "autocad.exe"),
    ("Client_Credit_Card_Records.csv", "RESTRICTED", 14500000, "excel.exe"),
    ("Source_Code_Repo_Master.zip", "CONFIDENTIAL", 450000000, "git.exe"),
    ("Forensic_Audit_Report_2026.pdf", "CONFIDENTIAL", 6200000, "acrobat.exe"),
    ("Acquisition_Target_Valuation.xlsx", "CONFIDENTIAL", 5100000, "excel.exe")
]

NORMAL_FILES = [
    ("Weekly_Sync_Notes.docx", "INTERNAL", 35000, "word.exe"),
    ("Sprint_Backlog_March.xlsx", "INTERNAL", 120000, "excel.exe"),
    ("Company_Holiday_Calendar_2026.pdf", "PUBLIC", 540000, "acrobat.exe"),
    ("README_Setup_Guide.md", "PUBLIC", 12000, "code.exe"),
    ("Quarterly_Townhall_Slides.pptx", "INTERNAL", 8500000, "powerpnt.exe"),
    ("Expense_Reimbursement_Policy.pdf", "INTERNAL", 410000, "acrobat.exe"),
    ("Customer_Onboarding_Workflow.vsdx", "INTERNAL", 980000, "visio.exe"),
    ("System_Health_Dashboard.json", "INTERNAL", 65000, "powershell.exe")
]

USB_DEVICES = [
    {"type": "USB_FLASH_DRIVE", "mfr": "SanDisk", "model": "Ultra Flair USB 3.0", "serial": "4C530001221012112345", "drive": "E:"},
    {"type": "USB_FLASH_DRIVE", "mfr": "Kingston", "model": "DataTraveler Max 128GB", "serial": "001A92837482934", "drive": "E:"},
    {"type": "USB_FLASH_DRIVE", "mfr": "Samsung", "model": "Bar Plus 64GB", "serial": "SAM789234120938", "drive": "F:"},
    {"type": "EXTERNAL_HDD", "mfr": "Western Digital", "model": "My Passport Ultra 2TB", "serial": "WX21A83KD921", "drive": "E:"},
    {"type": "EXTERNAL_SSD", "mfr": "Samsung", "model": "T7 Shield 1TB", "serial": "S69ENX0W102938", "drive": "F:"},
    {"type": "EXTERNAL_HDD", "mfr": "Seagate", "model": "Backup Plus Slim 1TB", "serial": "NA9109282381", "drive": "E:"}
]

EXTERNAL_DOMAINS = ["proton.me", "gmail.com", "competitor-corp.com", "anon-drop.net", "mega.nz", "exfil-server.org"]
INTERNAL_DOMAIN = "corp.internal"

def generate_synthetic_dataset(
    target_count: int = 15000,
    seed: int = 42,
    days_span: int = 14
) -> List[Dict[str, Any]]:
    """
    Generates a realistic, deterministic synthetic digital forensic telemetry dataset.
    Balanced with 65% normal enterprise activity and 35% suspicious multi-stage temporal attack sequences.
    """
    random.seed(seed)
    events: List[Dict[str, Any]] = []

    # Anchor end time to recent hours
    end_time = datetime.now(timezone.utc) - timedelta(minutes=15)
    start_time = end_time - timedelta(days=days_span)
    total_seconds = int((end_time - start_time).total_seconds())

    def get_random_timestamp(offset_sec: int = 0) -> datetime:
        sec = random.randint(0, total_seconds - 3600) + offset_sec
        return start_time + timedelta(seconds=sec)

    evt_seq = 1

    # ---------------------------------------------------------
    # 1. SUSPICIOUS ATTACK SEQUENCES (~35% of total events)
    # ---------------------------------------------------------
    suspicious_target = int(target_count * 0.35)
    suspicious_generated = 0

    while suspicious_generated < suspicious_target:
        scenario_choice = random.choice([
            "MULTIPLE_FAILED_LOGIN",
            "USB_DATA_EXFILTRATION",
            "EXTERNAL_DRIVE_DATA_EXFILTRATION",
            "EMAIL_DATA_EXFILTRATION"
        ])

        chain_start = get_random_timestamp()
        user = random.choice(ALL_USERS)
        machine = random.choice(MACHINES)

        if scenario_choice == "MULTIPLE_FAILED_LOGIN":
            # 3 to 6 failed logins followed by 1 successful login within 1-5 minutes
            fail_count = random.randint(3, 6)
            for i in range(fail_count):
                t_fail = chain_start + timedelta(seconds=i * random.randint(10, 45))
                event_id = f"EVT-AUTH-{evt_seq:06d}"
                evt_seq += 1
                events.append({
                    "event_id": event_id,
                    "timestamp": t_fail.isoformat(),
                    "event_type": "authentication",
                    "user": user,
                    "machine": machine,
                    "source": "Windows Security Event Log (ID 4625)",
                    "action": "FAILED_LOGIN",
                    "status": "FAILED",
                    "device": None,
                    "file": None,
                    "metadata": {
                        "logon_type": 2,
                        "failure_reason": "Unknown user name or bad password",
                        "status_code": "0xC000006A",
                        "ip_address": f"192.168.1.{random.randint(10, 200)}"
                    },
                    "dataset_label": "SYNTHETIC_DATASET",
                    "destination": None,
                    "device_type": None,
                    "manufacturer": None,
                    "model": None,
                    "serial_number": None,
                    "drive_letter": None,
                    "file_path": None,
                    "file_size": None,
                    "file_sensitivity": None,
                    "email_service": None,
                    "sender": None,
                    "recipient": None,
                    "recipient_type": None,
                    "recipient_domain": None,
                    "process": "lsass.exe",
                    "scenario_type": "MULTIPLE_FAILED_LOGIN",
                    "is_suspicious": 1,
                    "description": f"Failed logon attempt for account {user} (Bad Password)"
                })
                suspicious_generated += 1

            # Success event concluding the brute-force / credential attempt
            t_success = chain_start + timedelta(seconds=(fail_count * 45) + random.randint(5, 30))
            event_id = f"EVT-AUTH-{evt_seq:06d}"
            evt_seq += 1
            events.append({
                "event_id": event_id,
                "timestamp": t_success.isoformat(),
                "event_type": "authentication",
                "user": user,
                "machine": machine,
                "source": "Windows Security Event Log (ID 4624)",
                "action": "SUCCESSFUL_LOGIN",
                "status": "SUCCESS",
                "device": None,
                "file": None,
                "metadata": {
                    "logon_type": 2,
                    "auth_package": "Kerberos",
                    "elevated_token": True,
                    "ip_address": f"192.168.1.{random.randint(10, 200)}"
                },
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": None,
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "lsass.exe",
                "scenario_type": "MULTIPLE_FAILED_LOGIN",
                "is_suspicious": 1,
                "description": f"Logon succeeded for account {user} immediately after sequential credential failures"
            })
            suspicious_generated += 1

        elif scenario_choice == "USB_DATA_EXFILTRATION":
            # USB connected -> sensitive file accessed -> file copied to removable drive -> USB removed
            dev = random.choice([d for d in USB_DEVICES if d["type"] == "USB_FLASH_DRIVE"])
            s_file, sens, fsize, proc = random.choice(SENSITIVE_FILES)
            t_conn = chain_start
            t_access = chain_start + timedelta(seconds=random.randint(15, 60))
            t_copy = chain_start + timedelta(seconds=random.randint(70, 180))
            t_rem = chain_start + timedelta(seconds=random.randint(200, 400))

            # 1. USB_CONNECTED
            events.append({
                "event_id": f"EVT-USB-{evt_seq:06d}",
                "timestamp": t_conn.isoformat(),
                "event_type": "usb",
                "user": user,
                "machine": machine,
                "source": "Windows Plug-and-Play Manager",
                "action": "USB_CONNECTED",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']} ({dev['serial']})",
                "file": None,
                "metadata": {"mount_point": dev["drive"] + "\\", "device_type": dev["type"]},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": dev["drive"] + "\\",
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "services.exe",
                "scenario_type": "USB_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Removable USB storage {dev['model']} attached and assigned {dev['drive']}"
            })
            evt_seq += 1

            # 2. SENSITIVE FILE ACCESS
            events.append({
                "event_id": f"EVT-FILE-{evt_seq:06d}",
                "timestamp": t_access.isoformat(),
                "event_type": "file",
                "user": user,
                "machine": machine,
                "source": "Windows Security Event Log (ID 4663)",
                "action": "FILE_ACCESS",
                "status": "SUCCESS",
                "device": None,
                "file": s_file,
                "metadata": {"access_mask": "0x2 (Read)", "sensitivity": sens},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": "C:",
                "file_path": f"C:\\Confidential_Assets\\{s_file}",
                "file_size": fsize,
                "file_sensitivity": sens,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": proc,
                "scenario_type": "USB_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"High sensitivity file {s_file} ({sens}) opened for reading"
            })
            evt_seq += 1

            # 3. FILE_COPIED_TO_REMOVABLE_DEVICE
            events.append({
                "event_id": f"EVT-FILE-{evt_seq:06d}",
                "timestamp": t_copy.isoformat(),
                "event_type": "file",
                "user": user,
                "machine": machine,
                "source": "Endpoint File Activity Monitor",
                "action": "FILE_COPIED_TO_REMOVABLE_DEVICE",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']}",
                "file": s_file,
                "metadata": {
                    "source_path": f"C:\\Confidential_Assets\\{s_file}",
                    "dest_path": f"{dev['drive']}\\{s_file}",
                    "bytes": fsize
                },
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": f"{dev['drive']}\\{s_file}",
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": f"{dev['drive']}\\{s_file}",
                "file_size": fsize,
                "file_sensitivity": sens,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "explorer.exe",
                "scenario_type": "USB_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Confidential file {s_file} copied to removable storage drive {dev['drive']}"
            })
            evt_seq += 1

            # 4. USB_REMOVED
            events.append({
                "event_id": f"EVT-USB-{evt_seq:06d}",
                "timestamp": t_rem.isoformat(),
                "event_type": "usb",
                "user": user,
                "machine": machine,
                "source": "Windows Plug-and-Play Manager",
                "action": "USB_REMOVED",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']} ({dev['serial']})",
                "file": None,
                "metadata": {"unmount_status": "Device Safely Removed", "drive": dev["drive"]},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "services.exe",
                "scenario_type": "USB_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Removable USB device {dev['model']} disconnected from system"
            })
            evt_seq += 1
            suspicious_generated += 4

        elif scenario_choice == "EXTERNAL_DRIVE_DATA_EXFILTRATION":
            # High capacity External HDD/SSD mounted -> bulk exfiltration of multiple files
            dev = random.choice([d for d in USB_DEVICES if d["type"] in ("EXTERNAL_HDD", "EXTERNAL_SSD")])
            t_conn = chain_start
            events.append({
                "event_id": f"EVT-USB-{evt_seq:06d}",
                "timestamp": t_conn.isoformat(),
                "event_type": "usb",
                "user": user,
                "machine": machine,
                "source": "Windows Storage Management Telemetry",
                "action": "USB_CONNECTED",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']} ({dev['serial']})",
                "file": None,
                "metadata": {"device_type": dev["type"], "capacity": "1TB-2TB", "drive": dev["drive"]},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": dev["drive"] + "\\",
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "services.exe",
                "scenario_type": "EXTERNAL_DRIVE_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"High-capacity storage device {dev['model']} mounted at {dev['drive']}"
            })
            evt_seq += 1
            suspicious_generated += 1

            # Bulk file transfer (2 to 4 sensitive files)
            num_files = random.randint(2, 4)
            chosen_files = random.sample(SENSITIVE_FILES, num_files)
            for idx, (s_file, sens, fsize, proc) in enumerate(chosen_files):
                t_copy = chain_start + timedelta(seconds=60 + (idx * 40))
                events.append({
                    "event_id": f"EVT-FILE-{evt_seq:06d}",
                    "timestamp": t_copy.isoformat(),
                    "event_type": "file",
                    "user": user,
                    "machine": machine,
                    "source": "Endpoint File Activity Monitor",
                    "action": "FILE_COPIED_TO_REMOVABLE_DEVICE",
                    "status": "SUCCESS",
                    "device": f"{dev['mfr']} {dev['model']}",
                    "file": s_file,
                    "metadata": {
                        "source_path": f"C:\\Data_Vault\\{s_file}",
                        "dest_path": f"{dev['drive']}\\Vault_Backup\\{s_file}",
                        "bytes": fsize
                    },
                    "dataset_label": "SYNTHETIC_DATASET",
                    "destination": f"{dev['drive']}\\Vault_Backup\\{s_file}",
                    "device_type": dev["type"],
                    "manufacturer": dev["mfr"],
                    "model": dev["model"],
                    "serial_number": dev["serial"],
                    "drive_letter": dev["drive"],
                    "file_path": f"{dev['drive']}\\Vault_Backup\\{s_file}",
                    "file_size": fsize,
                    "file_sensitivity": sens,
                    "email_service": None,
                    "sender": None,
                    "recipient": None,
                    "recipient_type": None,
                    "recipient_domain": None,
                    "process": "explorer.exe",
                    "scenario_type": "EXTERNAL_DRIVE_DATA_EXFILTRATION",
                    "is_suspicious": 1,
                    "description": f"Bulk data transfer: {s_file} ({sens}) written to external volume {dev['drive']}"
                })
                evt_seq += 1
                suspicious_generated += 1

            # External drive removed
            t_rem = chain_start + timedelta(seconds=250 + (num_files * 40))
            events.append({
                "event_id": f"EVT-USB-{evt_seq:06d}",
                "timestamp": t_rem.isoformat(),
                "event_type": "usb",
                "user": user,
                "machine": machine,
                "source": "Windows Storage Management Telemetry",
                "action": "USB_REMOVED",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']} ({dev['serial']})",
                "file": None,
                "metadata": {"unmount_status": "Device Disconnected", "drive": dev["drive"]},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "services.exe",
                "scenario_type": "EXTERNAL_DRIVE_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"External storage {dev['model']} unmounted after bulk write operations"
            })
            evt_seq += 1
            suspicious_generated += 1

        elif scenario_choice == "EMAIL_DATA_EXFILTRATION":
            # Sensitive file accessed -> file attached to email -> email sent to external address
            s_file, sens, fsize, proc = random.choice(SENSITIVE_FILES)
            ext_dom = random.choice(EXTERNAL_DOMAINS)
            ext_recip = f"inbox.{random.randint(100,999)}@{ext_dom}"
            sender_mail = f"{user.lower().replace('.', '')}@{INTERNAL_DOMAIN}"
            svc = random.choice(["GMAIL", "OUTLOOK"])

            t_access = chain_start
            t_attach = chain_start + timedelta(seconds=random.randint(30, 90))
            t_send = chain_start + timedelta(seconds=random.randint(120, 240))

            # 1. FILE_ACCESS
            events.append({
                "event_id": f"EVT-FILE-{evt_seq:06d}",
                "timestamp": t_access.isoformat(),
                "event_type": "file",
                "user": user,
                "machine": machine,
                "source": "Windows Security Event Log (ID 4663)",
                "action": "FILE_ACCESS",
                "status": "SUCCESS",
                "device": None,
                "file": s_file,
                "metadata": {"file_sensitivity": sens, "process": proc},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": "C:",
                "file_path": f"C:\\Confidential_Assets\\{s_file}",
                "file_size": fsize,
                "file_sensitivity": sens,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": proc,
                "scenario_type": "EMAIL_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Suspicious access to {sens} document {s_file}"
            })
            evt_seq += 1

            # 2. FILE_ATTACHED_TO_EMAIL
            events.append({
                "event_id": f"EVT-MAIL-{evt_seq:06d}",
                "timestamp": t_attach.isoformat(),
                "event_type": "email",
                "user": user,
                "machine": machine,
                "source": f"{svc} Application Audit Log",
                "action": "FILE_ATTACHED_TO_EMAIL",
                "status": "SUCCESS",
                "device": None,
                "file": s_file,
                "metadata": {
                    "email_service": svc,
                    "attachment_name": s_file,
                    "attachment_size": fsize,
                    "sensitivity": sens
                },
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": ext_recip,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": "C:",
                "file_path": f"C:\\Confidential_Assets\\{s_file}",
                "file_size": fsize,
                "file_sensitivity": sens,
                "email_service": svc,
                "sender": sender_mail,
                "recipient": ext_recip,
                "recipient_type": "EXTERNAL",
                "recipient_domain": ext_dom,
                "process": "OUTLOOK.EXE" if svc == "OUTLOOK" else "chrome.exe",
                "scenario_type": "EMAIL_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Sensitive file {s_file} ({sens}) attached to outgoing message draft"
            })
            evt_seq += 1

            # 3. EMAIL_SENT
            events.append({
                "event_id": f"EVT-MAIL-{evt_seq:06d}",
                "timestamp": t_send.isoformat(),
                "event_type": "email",
                "user": user,
                "machine": machine,
                "source": f"{svc} Mail Transfer Agent",
                "action": "EMAIL_SENT",
                "status": "SUCCESS",
                "device": None,
                "file": s_file,
                "metadata": {
                    "subject": "Requested Information Update",
                    "has_attachment": True,
                    "external_recipient": True
                },
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": ext_recip,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": None,
                "file_path": f"C:\\Confidential_Assets\\{s_file}",
                "file_size": fsize,
                "file_sensitivity": sens,
                "email_service": svc,
                "sender": sender_mail,
                "recipient": ext_recip,
                "recipient_type": "EXTERNAL",
                "recipient_domain": ext_dom,
                "process": "OUTLOOK.EXE" if svc == "OUTLOOK" else "chrome.exe",
                "scenario_type": "EMAIL_DATA_EXFILTRATION",
                "is_suspicious": 1,
                "description": f"Email containing sensitive attachment dispatched to external domain {ext_dom}"
            })
            evt_seq += 1
            suspicious_generated += 3

    # ---------------------------------------------------------
    # 2. NORMAL BENIGN ACTIVITY (~65% of total events)
    # ---------------------------------------------------------
    normal_target = target_count - len(events)

    for _ in range(normal_target):
        t_rand = get_random_timestamp()
        user = random.choice(ALL_USERS)
        machine = random.choice(MACHINES)
        cat = random.choice(["auth", "file", "email", "system", "usb_benign"])

        if cat == "auth":
            events.append({
                "event_id": f"EVT-AUTH-{evt_seq:06d}",
                "timestamp": t_rand.isoformat(),
                "event_type": "authentication",
                "user": user,
                "machine": machine,
                "source": "Windows Security Event Log (ID 4624)",
                "action": "SUCCESSFUL_LOGIN",
                "status": "SUCCESS",
                "device": None,
                "file": None,
                "metadata": {"logon_type": 2, "auth_provider": "Negotiate/NTLM"},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": None,
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "lsass.exe",
                "scenario_type": "NORMAL_ACTIVITY",
                "is_suspicious": 0,
                "description": f"Routine workstation logon for user {user}"
            })

        elif cat == "file":
            n_file, n_sens, n_size, n_proc = random.choice(NORMAL_FILES)
            f_act = random.choice(["FILE_ACCESS", "FILE_MODIFIED", "FILE_CREATED"])
            events.append({
                "event_id": f"EVT-FILE-{evt_seq:06d}",
                "timestamp": t_rand.isoformat(),
                "event_type": "file",
                "user": user,
                "machine": machine,
                "source": "Windows Security Event Log (ID 4663)",
                "action": f_act,
                "status": "SUCCESS",
                "device": None,
                "file": n_file,
                "metadata": {"path": f"C:\\Users\\{user}\\Documents\\{n_file}", "sensitivity": n_sens},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": "C:",
                "file_path": f"C:\\Users\\{user}\\Documents\\{n_file}",
                "file_size": n_size,
                "file_sensitivity": n_sens,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": n_proc,
                "scenario_type": "NORMAL_ACTIVITY",
                "is_suspicious": 0,
                "description": f"Standard document operation ({f_act}) on {n_file}"
            })

        elif cat == "email":
            sender_mail = f"{user.lower().replace('.', '')}@{INTERNAL_DOMAIN}"
            recip_user = random.choice([u for u in ALL_USERS if u != user])
            recip_mail = f"{recip_user.lower().replace('.', '')}@{INTERNAL_DOMAIN}"
            events.append({
                "event_id": f"EVT-MAIL-{evt_seq:06d}",
                "timestamp": t_rand.isoformat(),
                "event_type": "email",
                "user": user,
                "machine": machine,
                "source": "Corporate Exchange Gateway",
                "action": "EMAIL_SENT",
                "status": "SUCCESS",
                "device": None,
                "file": None,
                "metadata": {"subject": "Weekly Department Sync Agenda", "has_attachment": False},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": recip_mail,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": None,
                "file_path": None,
                "file_size": None,
                "file_sensitivity": "INTERNAL",
                "email_service": "CORPORATE_MAIL",
                "sender": sender_mail,
                "recipient": recip_mail,
                "recipient_type": "INTERNAL",
                "recipient_domain": INTERNAL_DOMAIN,
                "process": "OUTLOOK.EXE",
                "scenario_type": "NORMAL_ACTIVITY",
                "is_suspicious": 0,
                "description": f"Internal email communication from {user} to {recip_user}"
            })

        elif cat == "usb_benign":
            dev = random.choice([d for d in USB_DEVICES if d["type"] == "USB_FLASH_DRIVE"])
            events.append({
                "event_id": f"EVT-USB-{evt_seq:06d}",
                "timestamp": t_rand.isoformat(),
                "event_type": "usb",
                "user": user,
                "machine": machine,
                "source": "Windows Plug-and-Play Manager",
                "action": "USB_CONNECTED",
                "status": "SUCCESS",
                "device": f"{dev['mfr']} {dev['model']}",
                "file": None,
                "metadata": {"volume_label": "PRESENTATION", "drive": dev["drive"]},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": dev["drive"] + "\\",
                "device_type": dev["type"],
                "manufacturer": dev["mfr"],
                "model": dev["model"],
                "serial_number": dev["serial"],
                "drive_letter": dev["drive"],
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "services.exe",
                "scenario_type": "NORMAL_ACTIVITY",
                "is_suspicious": 0,
                "description": f"Standard USB flash drive connection for meeting slides"
            })

        else: # system
            events.append({
                "event_id": f"EVT-SYS-{evt_seq:06d}",
                "timestamp": t_rand.isoformat(),
                "event_type": "system",
                "user": "SYSTEM",
                "machine": machine,
                "source": "Windows System Telemetry",
                "action": random.choice(["SERVICE_START", "PROCESS_SPAWN", "SCHEDULED_TASK"]),
                "status": "SUCCESS",
                "device": None,
                "file": None,
                "metadata": {"service": "WinDefend", "pid": random.randint(1000, 9999)},
                "dataset_label": "SYNTHETIC_DATASET",
                "destination": None,
                "device_type": None,
                "manufacturer": None,
                "model": None,
                "serial_number": None,
                "drive_letter": None,
                "file_path": None,
                "file_size": None,
                "file_sensitivity": None,
                "email_service": None,
                "sender": None,
                "recipient": None,
                "recipient_type": None,
                "recipient_domain": None,
                "process": "svchost.exe",
                "scenario_type": "NORMAL_ACTIVITY",
                "is_suspicious": 0,
                "description": "Routine Windows system background service activity"
            })

        evt_seq += 1

    # Sort all events chronologically so the timeline is naturally ordered
    events.sort(key=lambda x: x["timestamp"])
    return events

def populate_database_with_synthetic_dataset(count: int = 15000, seed: int = 42):
    """
    Seeds the SQLite database with the synthetic dataset in high-performance batches.
    """
    print(f"[*] Initializing database schema...")
    init_db()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM forensic_events WHERE dataset_label = 'SYNTHETIC_DATASET'")
    existing = cursor.fetchone()["cnt"]
    conn.close()

    if existing >= count:
        print(f"[+] Synthetic dataset already present ({existing} events). Skipping re-generation.")
        return existing

    print(f"[*] Generating {count} synthetic forensic events (Seed: {seed})...")
    events = generate_synthetic_dataset(target_count=count, seed=seed)
    print(f"[+] Generated {len(events)} events. Inserting into SQLite database in batches...")

    # Batch insert in chunks of 2,000 for maximum SQLite performance
    batch_size = 2000
    total_inserted = 0
    for i in range(0, len(events), batch_size):
        chunk = events[i:i + batch_size]
        inserted = record_forensic_events_batch(chunk)
        total_inserted += len(chunk)
        print(f"    Inserted {total_inserted}/{len(events)} events...")

    print(f"[SUCCESS] Successfully inserted {total_inserted} synthetic forensic events into database.")
    return total_inserted

if __name__ == "__main__":
    count = 15000
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    populate_database_with_synthetic_dataset(count=count, seed=42)
