"""
Standalone Launcher for FORENSIQ Windows Host Monitoring Agent
Can be run independently in background or alongside FastAPI server.
"""
import time
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agent.host_agent import host_agent
from app.database.db import init_db

def main():
    print("=" * 60)
    print("  FORENSIQ WINDOWS HOST MONITORING AGENT")
    print("  Endpoint Telemetry & Removable Media Activity Monitor")
    print("=" * 60)

    init_db()
    host_agent.start()

    print("[+] Agent is actively listening for removable drive events...")
    print("[+] Collecting METADATA ONLY (File names, sizes, timestamps).")
    print("[+] Press Ctrl+C to terminate the monitoring agent.\n")

    try:
        while True:
            status = host_agent.get_status()
            drives = status["monitored_drives"]
            devs = status["connected_devices"]
            print(
                f"\r[*] Active Drives: {len(drives)} ({', '.join(drives) if drives else 'None'}) | "
                f"Captured Events: {status['events_captured_count']}",
                end="",
                flush=True
            )
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n\n[-] Terminating host monitoring agent...")
        host_agent.stop()
        print("[+] Agent stopped cleanly. Exiting.")

if __name__ == "__main__":
    main()
