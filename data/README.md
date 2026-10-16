# FORENSIQ Forensic Event Datasets

This directory contains reference datasets and samples used by FORENSIQ for heterogeneous forensic event analysis.

## Sources

1. **Live Authentication Source (`Live Authentication`)**
   - Generated dynamically in real time during investigator and suspect login attempts.
   - Records true timestamps, machine identifiers, status (`SUCCESS` / `FAILED`), and authentication metadata.

2. **Simulated Forensic Source (`Simulated Forensic Source`)**
   - Simulated USB and file system events generated via the USB Simulator control deck.
   - Used to demonstrate temporal ordering (`USB_CONNECTED` -> `FILE_ACCESS` -> `FILE_COPY` -> `USB_REMOVED`) in a safe, controlled sandbox without invasive kernel hooks.

3. **Public Dataset (`Public Dataset`)**
   - Normalized subset derived from the **LANL Cyber Security Dataset** (Los Alamos National Laboratory Comprehensive Multi-Source Cyber Security Dataset).
   - Contains authentic enterprise authentication sequences (Kerberos/NTLM authentication tickets, logon types, workstations, domain controllers) and system process events.
