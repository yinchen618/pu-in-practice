#!/usr/bin/env python3
"""
AI学习平台启动脚本
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def print_banner():
    banner = """
    ╔═══════════════════════════════════════════════════════════╗
    ║                    🧠 AI 学习平台 🚀                     ║
    ║              基于 PyTorch 的交互式 AI 演示平台              ║
    ╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_requirements():
    """检查必要的依赖"""
    print("📋 检查环境依赖...")
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ 错误：需要 Python 3.8 或更高版本")
        return False
    
    # 检查是否有pip
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"], 
                      check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("❌ 错误：未找到 pip")
        return False
    
    # 检查是否有pnpm或npm
    has_pnpm = False
    has_npm = False
    
    try:
        subprocess.run(["pnpm", "--version"], 
                      check=True, capture_output=True)
        has_pnpm = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    try:
        subprocess.run(["npm", "--version"], 
                      check=True, capture_output=True)
        has_npm = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    if not has_pnpm and not has_npm:
        print("❌ 错误：未找到 pnpm 或 npm，请安装 Node.js")
        return False
    
    print("✅ 环境检查通过")
    return True

def install_python_deps():
    """安装Python依赖"""
    print("📦 安装Python依赖...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True)
        print("✅ Python依赖安装完成")
        return True
    except subprocess.CalledProcessError:
        print("❌ Python依赖安装失败")
        return False

def install_node_deps():
    """安装Node.js依赖"""
    print("📦 安装Node.js依赖...")
    try:
        os.chdir("../web")
        # 优先使用pnpm
        try:
            subprocess.run(["pnpm", "install"], check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            # 如果pnpm不可用，使用npm
            subprocess.run(["npm", "install"], check=True)
        os.chdir("../backend")
        print("✅ Node.js依赖安装完成")
        return True
    except subprocess.CalledProcessError:
        print("❌ Node.js依赖安装失败")
        return False

def start_backend():
    """启动后端服务"""
    print("🚀 启动后端服务 (FastAPI + PyTorch)...")
    try:
        # 启动FastAPI服务
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n⭐ 后端服务已停止")
    except Exception as e:
        print(f"❌ 后端服务启动失败: {e}")

def start_frontend():
    """启动前端服务"""
    print("🚀 启动前端服务 (Next.js)...")
    try:
        os.chdir("../web")
        # 优先使用pnpm
        try:
            subprocess.run(["pnpm", "dev"])
        except (subprocess.CalledProcessError, FileNotFoundError):
            # 如果pnpm不可用，使用npm
            subprocess.run(["npm", "run", "dev"])
    except KeyboardInterrupt:
        print("\n⭐ 前端服务已停止")
    except Exception as e:
        print(f"❌ 前端服务启动失败: {e}")
    finally:
        os.chdir("../backend")

def main():
    print_banner()
    
    # 检查环境
    if not check_requirements():
        return
    
    # 询问是否安装依赖
    install_deps = input("🤔 是否需要安装/更新依赖？(y/n): ").lower().strip() == 'y'
    
    if install_deps:
        if not install_python_deps():
            return
        if not install_node_deps():
            return
    
    print("\n🎯 准备启动服务...")
    print("📍 后端地址: http://localhost:8000")
    print("📍 前端地址: http://localhost:3000")
    print("📍 按 Ctrl+C 停止服务")
    
    # 等待用户确认
    input("\n按回车键开始启动服务...")
    
    # 启动后端服务（在新线程中）
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # 等待后端启动
    print("⏳ 等待后端服务启动...")
    time.sleep(3)
    
    # 启动前端服务
    try:
        start_frontend()
    except KeyboardInterrupt:
        print("\n\n🎉 感谢使用 AI 学习平台！")
        print("📚 如有问题，请查看 README.md 或提交 issue")

if __name__ == "__main__":
    main() 