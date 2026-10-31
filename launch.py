"""
launch.py - Memory Master Game Launcher
=======================================
Starts the Vite dev server AND opens the browser with hand tracking
auto-enabled — all from a single Python script.

Usage:
    python launch.py

Requirements:
    - Python 3.7+
    - Node.js + npm installed
"""

import subprocess
import sys
import os
import time
import socket
import webbrowser
import threading
import shutil

# ── Config ─────────────────────────────────────────────────────
PORT        = 5173
GAME_URL    = f"http://localhost:{PORT}/?autoCamera=1"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
MAX_WAIT_S  = 60   # seconds to wait for server before giving up

# ── Colours (ANSI — work on Windows 10+ terminal) ──────────────
class C:
    RESET  = "\033[0m"
    GREEN  = "\033[92m"
    CYAN   = "\033[96m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    BOLD   = "\033[1m"
    DIM    = "\033[2m"

def ok(msg):    print(f"  {C.GREEN}[OK]{C.RESET}    {msg}")
def info(msg):  print(f"  {C.CYAN}[INFO]{C.RESET}  {msg}")
def warn(msg):  print(f"  {C.YELLOW}[WARN]{C.RESET}  {msg}")
def err(msg):   print(f"  {C.RED}[ERROR]{C.RESET} {msg}")
def step(msg):  print(f"\n{C.BOLD}{msg}{C.RESET}")

# ── Enable ANSI colours & UTF-8 on Windows ─────────────────────
if sys.platform == "win32":
    # Ensure stdout & stderr can output Unicode without crashing cp1252/cp437
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass
    os.system("")   # triggers VT100 mode in Windows console

# ─────────────────────────────────────────────────────────────────
def banner():
    print(C.BOLD + C.CYAN)
    print("  +------------------------------------------------------+")
    print("  |        Memory Master - Hand Tracking Launcher        |")
    print("  |         Webcam + Game Website -> Together!           |")
    print("  +------------------------------------------------------+")
    print(C.RESET)

# ─────────────────────────────────────────────────────────────────
def find_npm():
    """Return the correct npm executable name for this OS."""
    # Windows: npm.cmd or npm
    for candidate in ["npm.cmd", "npm"]:
        if shutil.which(candidate):
            return candidate
    return None


def check_requirements():
    """Verify Node.js and npm are installed."""
    step("Step 1 — Checking requirements")

    # Node.js
    node = shutil.which("node")
    if not node:
        err("Node.js is not installed or not in PATH.")
        err("Install it from: https://nodejs.org")
        sys.exit(1)

    node_ver = subprocess.check_output(["node", "--version"],
                                       text=True).strip()
    ok(f"Node.js {node_ver}")

    # npm
    npm = find_npm()
    if not npm:
        err("npm not found. Re-install Node.js from https://nodejs.org")
        sys.exit(1)

    npm_ver = subprocess.check_output([npm, "--version"],
                                      text=True).strip()
    ok(f"npm v{npm_ver}")
    return npm


def install_deps(npm):
    """Install node_modules if they don't exist yet."""
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    if os.path.isdir(node_modules):
        return  # already installed

    step("Step 2 — Installing dependencies (first time only)")
    info("Running npm install, please wait...")

    result = subprocess.run([npm, "install"], cwd=PROJECT_DIR)
    if result.returncode != 0:
        err("npm install failed. Check your internet connection.")
        sys.exit(1)
    ok("Dependencies installed successfully.")


def is_port_open(port: int) -> bool:
    """Return True if something is listening on localhost:port (checks both IPv6 and IPv4)."""
    for host in ["::1", "127.0.0.1", "localhost"]:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except OSError:
            pass
    return False


def start_server(npm) -> subprocess.Popen:
    """Start the Vite dev server as a background subprocess."""
    step("Step 3 — Starting Vite dev server")
    info(f"Launching dev server on port {PORT}...")

    # On Windows, using shell=True ensures batch/cmd scripts execute reliably
    cmd = [npm, "run", "dev", "--", "--port", str(PORT)]
    use_shell = sys.platform == "win32"

    proc = subprocess.Popen(
        cmd,
        cwd=PROJECT_DIR,
        shell=use_shell
    )
    return proc


def wait_for_server(port: int, timeout: int) -> int:
    """Poll until the server is ready on target port (or port+1 / port+2 fallback). Returns active port or 0."""
    step("Step 4 — Waiting for server to be ready")
    deadline = time.time() + timeout

    dots = 0
    while time.time() < deadline:
        # Check target port and potential fallback ports if 5173 was taken
        for p in range(port, port + 5):
            if is_port_open(p):
                print()
                return p
        print(".", end="", flush=True)
        dots += 1
        time.sleep(0.5)

    print()
    return 0

    print()
    return 0


def open_browser(port: int):
    """Open the game in the default browser with autoCamera flag."""
    target_url = f"http://localhost:{port}/?autoCamera=1"
    step("Step 5 — Opening browser")
    info(f"URL: {target_url}")
    info("Hand tracking will AUTO-START (allow camera when browser asks)")
    webbrowser.open(target_url)
    ok("Browser opened!")


def keep_alive(proc: subprocess.Popen, port: int):
    """Keep the script running; stream server output; handle Ctrl+C."""
    target_url = f"http://localhost:{port}/?autoCamera=1"
    print()
    print(C.BOLD + "  +------------------------------------------------------+")
    print(         "  |                 GAME IS RUNNING!                     |")
    print(         "  |                                                      |")
    print(f"  |  Website : {target_url:<41} |")
    print(         "  |  Camera  : Auto-starting (grant browser permission)  |")
    print(         "  |                                                      |")
    print(         "  |  Press  Ctrl + C  to stop everything                 |")
    print(         "  +------------------------------------------------------+" + C.RESET)
    print()

    try:
        proc.wait()   # block until server process exits
    except KeyboardInterrupt:
        print()
        warn("Shutting down server...")
        if sys.platform == "win32":
            try:
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                proc.terminate()
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        ok("Server stopped. Goodbye!")


# ─────────────────────────────────────────────────────────────────
def main():
    banner()

    # 1. Check Node + npm
    npm = check_requirements()

    # 2. Install deps if needed
    install_deps(npm)

    # 3. Start Vite dev server
    proc = start_server(npm)

    # 4. Wait for server to be ready
    active_port = wait_for_server(PORT, MAX_WAIT_S)
    if not active_port:
        warn(f"Server didn't respond in {MAX_WAIT_S}s — attempting to open default port...")
        active_port = PORT

    # 5. Open browser
    open_browser(active_port)

    # 6. Keep alive & handle Ctrl+C
    keep_alive(proc, active_port)


if __name__ == "__main__":
    main()
