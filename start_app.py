#!/usr/bin/env python3
"""
Automated startup script for TeaQnet Application
Starts both backend (Flask) and frontend (React/Vite) servers simultaneously
"""

import subprocess
import sys
import os
import signal
import time
import importlib
import webbrowser
import io
from pathlib import Path

# Set UTF-8 encoding for Windows
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    # Set environment variable for subprocess
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "Teavision"
FRONTEND_DIR = PROJECT_ROOT / "TeaQnet"

# Process references
backend_process = None
frontend_process = None
shutting_down = False
npm_command = "npm"  # Default npm command, will be updated during dependency check


def check_python_package_installed(package_name):
    """Check if a Python package is installed"""
    try:
        # Handle special cases for package name differences
        import_map = {
            'cv2': 'cv2',
            'PIL': 'PIL',
            'sklearn': 'sklearn',
            'flask-cors': 'flask_cors',
            'opencv-python': 'cv2',
            'scikit-learn': 'sklearn',
            'pillow': 'PIL',
            'waitress': 'waitress',
        }
        
        import_name = import_map.get(package_name.lower(), package_name.lower().replace('-', '_'))
        importlib.import_module(import_name)
        return True
    except ImportError:
        return False


def check_and_install_python_dependencies(requirements_file):
    """Check if Python dependencies are installed and install if missing"""
    try:
        # Read requirements.txt to get package list
        with open(requirements_file, 'r', encoding='utf-8', errors='replace') as f:
            requirements = f.readlines()
        
        # Extract package names (remove comments, empty lines, version specifiers)
        packages_to_check = []
        for line in requirements:
            line = line.strip()
            if line and not line.startswith('#'):
                # Extract package name (before >=, ==, etc.)
                package_name = line.split('>=')[0].split('==')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
                if package_name:
                    packages_to_check.append(package_name)
        
        # Check which packages are missing
        missing_packages = []
        for package in packages_to_check:
            if not check_python_package_installed(package):
                missing_packages.append(package)
        
        if missing_packages:
            print(f"⚠️  Missing packages detected: {', '.join(missing_packages[:5])}{'...' if len(missing_packages) > 5 else ''}")
            print(f"📦 Installing {len(missing_packages)} missing backend dependencies...")
            print("   This may take a few minutes, especially for PyTorch...")
            
            install_result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
                cwd=BACKEND_DIR,
                timeout=1800,  # 30 minutes timeout for large packages like PyTorch
                capture_output=False
            )
            
            if install_result.returncode != 0:
                return False
            
            print("✅ Backend dependencies installed successfully")
        else:
            print("✅ All backend dependencies are already installed")
        
        return True
    except FileNotFoundError:
        print("⚠️  requirements.txt not found")
        return True  # Don't fail, just warn
    except Exception as e:
        print(f"⚠️  Error checking dependencies: {e}")
        # Try to install anyway
        print("📦 Attempting to install all dependencies...")
        try:
            install_result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
                cwd=BACKEND_DIR,
                timeout=1800,
                capture_output=False
            )
            return install_result.returncode == 0
        except Exception as install_error:
            print(f"❌ Installation failed: {install_error}")
            return False


def check_npm_package_installed(package_name, node_modules_dir):
    """Check if an npm package is installed in node_modules"""
    try:
        # Remove version specifiers (^, ~, etc.) and scope (@scope/package)
        clean_name = package_name.split('@')[0] if not package_name.startswith('@') else package_name.split('/')[1] if '/' in package_name else package_name
        
        # Check if package directory exists in node_modules
        package_dir = node_modules_dir / clean_name
        if package_dir.exists() and package_dir.is_dir():
            return True
        
        # Also check scoped packages (@scope/package)
        if package_name.startswith('@'):
            parts = package_name.split('/')
            if len(parts) == 2:
                scope_dir = node_modules_dir / parts[0]
                pkg_dir = scope_dir / parts[1] if scope_dir.exists() else None
                if pkg_dir and pkg_dir.exists():
                    return True
        
        return False
    except Exception:
        return False


def check_and_install_npm_dependencies():
    """Check if npm dependencies are installed and install if missing"""
    package_json = FRONTEND_DIR / "package.json"
    node_modules = FRONTEND_DIR / "node_modules"
    
    if not package_json.exists():
        print("❌ package.json not found")
        return False
    
    # Read package.json to get dependencies
    try:
        import json
        with open(package_json, 'r', encoding='utf-8', errors='replace') as f:
            package_data = json.load(f)
        
        # Get all dependencies (both dependencies and devDependencies)
        all_dependencies = {}
        all_dependencies.update(package_data.get('dependencies', {}))
        all_dependencies.update(package_data.get('devDependencies', {}))
        
        if not all_dependencies:
            print("⚠️  No dependencies found in package.json")
            return True
        
        # Check if node_modules exists
        if not node_modules.exists():
            print("⚠️  node_modules directory not found")
            print(f"📦 Installing {len(all_dependencies)} frontend dependencies...")
            print("   This may take a few minutes...")
            
            try:
                install_result = subprocess.run(
                    [npm_command, "install"],
                    cwd=FRONTEND_DIR,
                    timeout=600,  # 10 minutes timeout
                    capture_output=False,
                    shell=(os.name == 'nt' and npm_command == "npm")  # Use shell for npm on Windows
                )
                
                if install_result.returncode != 0:
                    return False
                
                print("✅ Frontend dependencies installed successfully")
                return True
            except subprocess.TimeoutExpired:
                print("❌ npm install timed out")
                return False
            except Exception as e:
                print(f"❌ Error installing frontend dependencies: {e}")
                return False
        
        # Check which packages are missing
        missing_packages = []
        for package_name in all_dependencies.keys():
            if not check_npm_package_installed(package_name, node_modules):
                missing_packages.append(package_name)
        
        if missing_packages:
            print(f"⚠️  Missing packages detected: {', '.join(missing_packages[:5])}{'...' if len(missing_packages) > 5 else ''}")
            print(f"📦 Installing {len(missing_packages)} missing frontend dependencies...")
            print("   This may take a few minutes...")
            
            try:
                install_result = subprocess.run(
                    [npm_command, "install"],
                    cwd=FRONTEND_DIR,
                    timeout=600,  # 10 minutes timeout
                    capture_output=False,
                    shell=(os.name == 'nt' and npm_command == "npm")  # Use shell for npm on Windows
                )
                
                if install_result.returncode != 0:
                    return False
                
                print("✅ Frontend dependencies installed successfully")
                return True
            except subprocess.TimeoutExpired:
                print("❌ npm install timed out")
                return False
            except Exception as e:
                print(f"❌ Error installing frontend dependencies: {e}")
                return False
        else:
            print("✅ All frontend dependencies are already installed")
            return True
            
    except json.JSONDecodeError:
        print("⚠️  Error reading package.json (invalid JSON)")
        # Try to install anyway
        print("📦 Attempting to install dependencies...")
        try:
            install_result = subprocess.run(
                [npm_command, "install"],
                cwd=FRONTEND_DIR,
                timeout=600,
                capture_output=False,
                shell=(os.name == 'nt' and npm_command == "npm")
            )
            return install_result.returncode == 0
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            return False
    except Exception as e:
        print(f"⚠️  Error checking dependencies: {e}")
        # Try to install anyway
        print("📦 Attempting to install dependencies...")
        try:
            install_result = subprocess.run(
                [npm_command, "install"],
                cwd=FRONTEND_DIR,
                timeout=600,
                capture_output=False,
                shell=(os.name == 'nt' and npm_command == "npm")
            )
            return install_result.returncode == 0
        except Exception as install_error:
            print(f"❌ Installation failed: {install_error}")
            return False


def check_dependencies():
    """Check if required dependencies are available"""
    print("🔍 Checking dependencies...")
    
    # Check Python
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
        print("❌ Python 3.7+ is required")
        return False
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check Node.js
    try:
        node_result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=5
        )
        if node_result.returncode == 0:
            print(f"✅ Node.js {node_result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("❌ Node.js not found. Please install Node.js from https://nodejs.org/")
        return False
    
    # Check npm
    npm_found = False
    npm_version = None
    
    # Try different ways to find npm (especially on Windows)
    npm_commands = ["npm", "npm.cmd"]
    if os.name == 'nt':  # Windows
        # On Windows, try npm.cmd explicitly
        npm_commands = ["npm.cmd", "npm"]
    
    for npm_cmd in npm_commands:
        try:
            npm_result = subprocess.run(
                [npm_cmd, "--version"],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=5,
                shell=(os.name == 'nt' and npm_cmd == "npm")  # Use shell for npm on Windows
            )
            if npm_result.returncode == 0:
                npm_version = npm_result.stdout.strip()
                npm_found = True
                print(f"✅ npm {npm_version}")
                # Store the working npm command for later use
                globals()['npm_command'] = npm_cmd
                break
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
        except Exception:
            continue
    
    if not npm_found:
        print("❌ npm not found")
        print("\n💡 Troubleshooting:")
        print("   1. npm usually comes with Node.js")
        print("   2. Make sure Node.js is installed: https://nodejs.org/")
        print("   3. Restart your terminal after installing Node.js")
        print("   4. Verify installation:")
        print("      - node --version")
        print("      - npm --version")
        if os.name == 'nt':  # Windows
            print("   5. On Windows, make sure Node.js is added to PATH")
            print("   6. Try running: npm.cmd --version")
        return False
    
    # Check if backend directory exists
    if not BACKEND_DIR.exists():
        print(f"❌ Backend directory not found: {BACKEND_DIR}")
        return False
    print(f"✅ Backend directory found: {BACKEND_DIR}")
    
    # Check if frontend directory exists
    if not FRONTEND_DIR.exists():
        print(f"❌ Frontend directory not found: {FRONTEND_DIR}")
        return False
    print(f"✅ Frontend directory found: {FRONTEND_DIR}")
    
    # Check if app.py exists
    if not (BACKEND_DIR / "app.py").exists():
        print(f"❌ Backend app.py not found: {BACKEND_DIR / 'app.py'}")
        return False
    print(f"✅ Backend app.py found")
    
    # Check and install backend Python dependencies from requirements.txt
    requirements_file = BACKEND_DIR / "requirements.txt"
    if requirements_file.exists():
        print("📦 Checking backend Python dependencies...")
        if not check_and_install_python_dependencies(requirements_file):
            print("❌ Failed to install backend dependencies")
            print("   Try installing manually: pip install -r Teavision/requirements.txt")
            return False
    else:
        print("⚠️  requirements.txt not found in backend directory")
        print("   Backend dependencies may need to be installed manually")
    
    # Check if package.json exists
    if not (FRONTEND_DIR / "package.json").exists():
        print(f"❌ Frontend package.json not found: {FRONTEND_DIR / 'package.json'}")
        return False
    print(f"✅ Frontend package.json found")
    
    # Check and install frontend dependencies
    print("📦 Checking frontend dependencies...")
    if not check_and_install_npm_dependencies():
        print("❌ Failed to install frontend dependencies")
        return False
    
    return True


def start_backend():
    """Start the Flask backend server"""
    global backend_process
    print("\n🚀 Starting backend server...")
    print(f"📁 Working directory: {BACKEND_DIR}")
    
    try:
        # Start Flask backend
        # On Windows, use shell=True for better compatibility
        kwargs = {
            "cwd": BACKEND_DIR,
            "stdout": subprocess.PIPE,
            "stderr": subprocess.STDOUT,
            "text": True,
            "encoding": "utf-8",
            "errors": "replace",
            "bufsize": 1,  # Line buffered for real-time output
            "universal_newlines": True
        }
        # On Windows, set PYTHONUNBUFFERED for unbuffered output
        if os.name == 'nt':
            env = os.environ.copy()
            env['PYTHONUNBUFFERED'] = '1'
            kwargs['env'] = env
        if os.name == 'nt':  # Windows
            kwargs["shell"] = True
            backend_process = subprocess.Popen(
                f'"{sys.executable}" app.py',
                **kwargs
            )
        else:  # Unix/Linux/Mac
            backend_process = subprocess.Popen(
                [sys.executable, "app.py"],
                **kwargs
            )
        print(f"✅ Backend process started (PID: {backend_process.pid})")
        print("   Backend will be available at: http://127.0.0.1:5000")
        return True
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False


def start_frontend():
    """Start the React/Vite frontend server"""
    global frontend_process
    print("\n🚀 Starting frontend server...")
    print(f"📁 Working directory: {FRONTEND_DIR}")
    
    try:
        # Start Vite dev server
        # Set environment for npm to output unbuffered
        env = os.environ.copy()
        if os.name == 'nt':
            env['PYTHONUNBUFFERED'] = '1'
        
        frontend_process = subprocess.Popen(
            [npm_command, "run", "dev"],
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            bufsize=1,  # Line buffered for real-time output
            universal_newlines=True,
            shell=(os.name == 'nt' and npm_command == "npm"),  # Use shell for npm on Windows
            env=env
        )
        print(f"✅ Frontend process started (PID: {frontend_process.pid})")
        print("   Frontend will be available at: http://127.0.0.1:5173")
        return True
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return False


def print_output(process, name):
    """Print output from a process in real-time"""
    try:
        if process and process.stdout:
            # Read output line by line with immediate flushing
            while True:
                line = process.stdout.readline()
                if not line:
                    # Check if process has ended
                    if process.poll() is not None:
                        break
                    # Small sleep to avoid busy waiting
                    time.sleep(0.01)
                    continue
                
                # Print immediately with flush
                print(f"[{name}] {line.rstrip()}", flush=True)
                
                # Check if process ended after reading line
                if process.poll() is not None:
                    # Read any remaining output
                    remaining = process.stdout.read()
                    if remaining:
                        for line in remaining.splitlines():
                            if line.strip():
                                print(f"[{name}] {line.rstrip()}", flush=True)
                    break
    except Exception as e:
        # Don't silently fail - log the error
        print(f"[{name}] Error reading output: {e}", flush=True)


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global shutting_down
    if shutting_down:
        # Force exit if already shutting down
        print("\n⚠️  Force terminating...")
        cleanup(force=True)
        sys.exit(1)
    
    shutting_down = True
    print("\n\n🛑 Shutting down servers...")
    print("   Press Ctrl+C again to force terminate")
    cleanup()
    sys.exit(0)


def cleanup(force=False):
    """Clean up processes"""
    global backend_process, frontend_process
    
    timeout = 2 if force else 5  # Shorter timeout if forcing
    
    if backend_process:
        print("🛑 Stopping backend server...")
        try:
            if os.name == 'nt':  # Windows
                # On Windows, terminate sends SIGTERM to process group
                backend_process.terminate()
            else:  # Unix/Linux/Mac
                backend_process.terminate()
            
            try:
                backend_process.wait(timeout=timeout)
                print("✅ Backend server stopped")
            except subprocess.TimeoutExpired:
                print("⚠️  Backend server didn't stop gracefully, forcing...")
                if os.name == 'nt':  # Windows
                    # Use taskkill on Windows for more reliable termination
                    try:
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(backend_process.pid)],
                            capture_output=True,
                            timeout=3
                        )
                    except:
                        backend_process.kill()
                else:
                    backend_process.kill()
                backend_process.wait(timeout=1)
                print("✅ Backend server force stopped")
        except Exception as e:
            print(f"⚠️  Error stopping backend: {e}")
            try:
                backend_process.kill()
            except:
                pass
        finally:
            backend_process = None
    
    if frontend_process:
        print("🛑 Stopping frontend server...")
        try:
            if os.name == 'nt':  # Windows
                frontend_process.terminate()
            else:  # Unix/Linux/Mac
                frontend_process.terminate()
            
            try:
                frontend_process.wait(timeout=timeout)
                print("✅ Frontend server stopped")
            except subprocess.TimeoutExpired:
                print("⚠️  Frontend server didn't stop gracefully, forcing...")
                if os.name == 'nt':  # Windows
                    try:
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(frontend_process.pid)],
                            capture_output=True,
                            timeout=3
                        )
                    except:
                        frontend_process.kill()
                else:
                    frontend_process.kill()
                frontend_process.wait(timeout=1)
                print("✅ Frontend server force stopped")
        except Exception as e:
            print(f"⚠️  Error stopping frontend: {e}")
            try:
                frontend_process.kill()
            except:
                pass
        finally:
            frontend_process = None


def main():
    """Main function"""
    global shutting_down
    
    try:
        print("=" * 60)
        print("🫖 TeaQnet Application Startup Script")
        print("=" * 60)
        
        # Register signal handler for graceful shutdown
        if os.name == 'nt':  # Windows
            # Windows uses different signal handling
            signal.signal(signal.SIGINT, signal_handler)
            signal.signal(signal.SIGTERM, signal_handler)
            # Also handle CTRL_BREAK_EVENT
            if hasattr(signal, 'SIGBREAK'):
                signal.signal(signal.SIGBREAK, signal_handler)
        else:  # Unix/Linux/Mac
            signal.signal(signal.SIGINT, signal_handler)
            signal.signal(signal.SIGTERM, signal_handler)
            # Handle SIGHUP as well
            signal.signal(signal.SIGHUP, signal_handler)
        
        # Check dependencies
        if not check_dependencies():
            print("\n❌ Dependency check failed. Please fix the issues above.")
            cleanup()
            sys.exit(1)
        
        # Start backend
        try:
            if not start_backend():
                print("\n❌ Failed to start backend server")
                cleanup()
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ Error starting backend server: {e}")
            cleanup()
            sys.exit(1)
        
        # Wait a moment for backend to initialize
        time.sleep(2)
        
        # Start frontend
        try:
            if not start_frontend():
                print("\n❌ Failed to start frontend server")
                cleanup()
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ Error starting frontend server: {e}")
            cleanup()
            sys.exit(1)
        
        # Wait a moment for frontend to initialize
        time.sleep(2)
        
        print("\n" + "=" * 60)
        print("✅ Both servers are starting up!")
        print("=" * 60)
        print("\n📋 Server Information:")
        print("   Backend:  http://127.0.0.1:5000")
        print("   Frontend: http://127.0.0.1:5173")
        print("\n💡 Press Ctrl+C to stop both servers")
        print("=" * 60 + "\n")
        
        # Monitor processes and print output
        import threading
        
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, "BACKEND"),
            daemon=True
        )
        frontend_thread = threading.Thread(
            target=print_output,
            args=(frontend_process, "FRONTEND"),
            daemon=True
        )
        
        backend_thread.start()
        frontend_thread.start()
        webbrowser.open("http://127.0.0.1:5173")
        
        # Give threads a moment to start reading
        time.sleep(0.1)
        
        # Wait for processes to complete (or be interrupted)
        try:
            while True:
                # Check if we're shutting down
                if shutting_down:
                    break
                
                # Check if processes are still running
                backend_exited = False
                frontend_exited = False
                
                if backend_process:
                    backend_status = backend_process.poll()
                    if backend_status is not None:
                        backend_exited = True
                        if backend_status != 0:
                            print(f"\n❌ Backend process crashed with exit code {backend_status}")
                        else:
                            print("\n⚠️  Backend process ended unexpectedly")
                
                if frontend_process:
                    frontend_status = frontend_process.poll()
                    if frontend_status is not None:
                        frontend_exited = True
                        if frontend_status != 0:
                            print(f"\n❌ Frontend process crashed with exit code {frontend_status}")
                        else:
                            print("\n⚠️  Frontend process ended unexpectedly")
                
                # If either process exited, terminate both
                if backend_exited or frontend_exited:
                    print("\n🛑 Terminating remaining processes...")
                    cleanup()
                    break
                
                time.sleep(0.5)  # Check more frequently for faster response
                
        except KeyboardInterrupt:
            # This should be caught by signal handler, but just in case
            if not shutting_down:
                signal_handler(None, None)
        except Exception as e:
            print(f"\n❌ Unexpected error occurred: {e}")
            print("🛑 Terminating all processes...")
            cleanup()
            sys.exit(1)
        
        if not shutting_down:
            cleanup()
        print("\n👋 Goodbye!")
        
    except Exception as e:
        # Catch any unexpected errors during startup or execution
        print(f"\n❌ Fatal error occurred: {e}")
        import traceback
        traceback.print_exc()
        print("\n🛑 Terminating all processes...")
        cleanup()
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        # Final safety net for Ctrl+C
        print("\n\n🛑 Interrupted by user")
        cleanup()
        sys.exit(0)
    except Exception as e:
        # Final safety net for any unhandled exceptions
        print(f"\n❌ Fatal error: {e}")
        cleanup()
        sys.exit(1)

