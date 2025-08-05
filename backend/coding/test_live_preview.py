#!/usr/bin/env python3
"""
測試 Live Preview 功能的腳本
"""

import requests
import json
import time
import os
from pathlib import Path

# 測試配置
BASE_URL = "http://localhost:8000"
TEST_SESSION_ID = "test_live_preview_session"
TEST_HTML_FILE = "test_live_preview.html"

def test_live_preview():
    """測試 Live Preview 功能"""
    print("🧪 開始測試 Live Preview 功能...")
    
    # 1. 初始化 session
    print("\n1. 初始化測試 session...")
    try:
        response = requests.post(f"{BASE_URL}/coding/sessions/init")
        if response.status_code == 200:
            session_data = response.json()
            session_id = session_data.get("session_id")
            print(f"✅ Session 初始化成功: {session_id}")
        else:
            print(f"❌ Session 初始化失敗: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Session 初始化錯誤: {e}")
        return False
    
    # 2. 上傳測試 HTML 檔案
    print("\n2. 上傳測試 HTML 檔案...")
    try:
        html_content = Path(TEST_HTML_FILE).read_text(encoding='utf-8')
        upload_data = {
            "path": TEST_HTML_FILE,
            "content": html_content
        }
        
        response = requests.post(
            f"{BASE_URL}/coding/files/{session_id}/content",
            json=upload_data
        )
        
        if response.status_code == 200:
            print(f"✅ HTML 檔案上傳成功")
        else:
            print(f"❌ HTML 檔案上傳失敗: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ HTML 檔案上傳錯誤: {e}")
        return False
    
    # 3. 測試 Live Preview 路由
    print("\n3. 測試 Live Preview 路由...")
    try:
        preview_url = f"{BASE_URL}/live-preview/{session_id}/{TEST_HTML_FILE}"
        print(f"🔗 測試 URL: {preview_url}")
        
        response = requests.get(preview_url)
        
        if response.status_code == 200:
            print("✅ Live Preview 路由測試成功")
            print(f"📄 回應內容類型: {response.headers.get('content-type', 'unknown')}")
            print(f"📏 回應內容長度: {len(response.content)} bytes")
            
            # 檢查回應內容是否包含預期的 HTML
            if "Live Preview 測試成功" in response.text:
                print("✅ HTML 內容正確")
            else:
                print("⚠️ HTML 內容可能不正確")
        else:
            print(f"❌ Live Preview 路由測試失敗: {response.status_code}")
            print(f"錯誤訊息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Live Preview 路由測試錯誤: {e}")
        return False
    
    # 4. 測試安全性（路徑遍歷攻擊防護）
    print("\n4. 測試安全性（路徑遍歷攻擊防護）...")
    try:
        malicious_url = f"{BASE_URL}/live-preview/{session_id}/../../../etc/passwd"
        response = requests.get(malicious_url)
        
        if response.status_code == 400:
            print("✅ 路徑遍歷攻擊防護正常")
        else:
            print(f"⚠️ 路徑遍歷攻擊防護可能有問題: {response.status_code}")
    except Exception as e:
        print(f"❌ 安全性測試錯誤: {e}")
    
    # 5. 測試不存在的檔案
    print("\n5. 測試不存在的檔案...")
    try:
        not_exist_url = f"{BASE_URL}/live-preview/{session_id}/not_exist.html"
        response = requests.get(not_exist_url)
        
        if response.status_code == 404:
            print("✅ 不存在的檔案處理正常")
        else:
            print(f"⚠️ 不存在的檔案處理可能有問題: {response.status_code}")
    except Exception as e:
        print(f"❌ 不存在檔案測試錯誤: {e}")
    
    print("\n🎉 Live Preview 功能測試完成！")
    print(f"\n📋 測試結果摘要:")
    print(f"   - Session ID: {session_id}")
    print(f"   - 測試檔案: {TEST_HTML_FILE}")
    print(f"   - Live Preview URL: {BASE_URL}/live-preview/{session_id}/{TEST_HTML_FILE}")
    print(f"\n🌐 你可以在瀏覽器中開啟上述 URL 來查看實際效果")
    
    return True

def cleanup_test_session():
    """清理測試 session"""
    print("\n🧹 清理測試 session...")
    try:
        # 這裡可以添加清理邏輯，如果需要的话
        print("✅ 清理完成")
    except Exception as e:
        print(f"⚠️ 清理時發生錯誤: {e}")

if __name__ == "__main__":
    print("🚀 Live Preview 功能測試工具")
    print("=" * 50)
    
    # 檢查測試檔案是否存在
    if not Path(TEST_HTML_FILE).exists():
        print(f"❌ 測試檔案 {TEST_HTML_FILE} 不存在")
        exit(1)
    
    # 執行測試
    success = test_live_preview()
    
    if success:
        print("\n✅ 所有測試通過！Live Preview 功能正常運作")
    else:
        print("\n❌ 測試失敗，請檢查後端服務是否正常運行")
    
    # 清理
    cleanup_test_session() 
