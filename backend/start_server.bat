@echo off
REM Start the Flask app using the venv python
"%~dp0.venv\Scripts\python.exe" -u "%~dp0backend_app.py"
