import subprocess
import sys
import os

PORT = 8000

def run_server():
    """Starts Python's simple HTTP server in the project directory."""
    # Ensure we run the command from the script's directory (project root)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Use sys.executable to ensure we use the interpreter running this script
    # (which should be the one from .venv if activated correctly)
    command = [sys.executable, "-m", "http.server", str(PORT)]

    print(f"Starting HTTP server on port {PORT}...")
    print(f"Serving files from: {script_dir}")
    print(f"Access the player at: http://localhost:{PORT}/")
    print("Press Ctrl+C to stop the server.")

    try:
        # Run the server command
        subprocess.run(command, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except subprocess.CalledProcessError as e:
        print(f"Error running server: {e}")
    except FileNotFoundError:
        print(f"Error: Could not find Python executable '{sys.executable}'. Make sure the virtual environment is active.")

if __name__ == "__main__":
    run_server() 