import uvicorn
import sys
import os

# Add backend directory to path
sys.path.append('backend')

try:
    from server import app
    print("App imported successfully. Starting uvicorn...")
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level="debug")
except Exception as e:
    print(f"CRASH during startup: {e}")
    import traceback
    traceback.print_exc()
except SystemExit as e:
    print(f"SystemExit caught: {e}")
