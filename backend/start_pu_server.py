#!/usr/bin/env python3
"""
PU Learning 服務啟動腳本
"""
import subprocess
import sys
import os

def check_dependencies():
    """檢查是否安裝了必要的依賴"""
    required_packages = [
        'fastapi', 'uvicorn', 'pydantic', 'numpy', 'scipy', 
        'scikit-learn', 'torch'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Missing packages: {missing_packages}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    return True

def start_pu_learning_server():
    """啟動 PU Learning 服務"""
    if not check_dependencies():
        print("Dependencies check failed. Please install required packages.")
        return
    
    print("Starting PU Learning Simulation Engine...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    
    try:
        # 啟動服務
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "pu_main:app", 
            "--host", "127.0.0.1", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    start_pu_learning_server()
