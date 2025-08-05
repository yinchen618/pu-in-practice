#!/usr/bin/env python3
"""
測試編輯器功能：檔案修改狀態、米字號顯示、預覽更新
"""

import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

def test_editor_features():
    print("🧪 開始測試編輯器功能...")
    
    # 1. 初始化 session
    print("\n1. 初始化 session...")
    response = requests.post(f"{BASE_URL}/coding/session/init")
    if response.status_code != 200:
        print(f"❌ Session 初始化失敗: {response.status_code}")
        return False
    
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"✅ Session 初始化成功: {session_id}")
    
    # 2. 創建測試 HTML 檔案
    print("\n2. 創建測試 HTML 檔案...")
    test_html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>測試頁面</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .test { color: blue; }
    </style>
</head>
<body>
    <h1>測試頁面</h1>
    <p class="test">這是一個測試頁面</p>
    <script>
        console.log('測試 JavaScript');
    </script>
</body>
</html>
"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.html",
            "content": test_html_content
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 創建測試檔案失敗: {response.status_code}")
        return False
    
    print("✅ 測試檔案創建成功")
    
    # 3. 測試檔案讀取
    print("\n3. 測試檔案讀取...")
    response = requests.get(f"{BASE_URL}/coding/files/{session_id}/content?path=test.html")
    if response.status_code != 200:
        print(f"❌ 檔案讀取失敗: {response.status_code}")
        return False
    
    file_content = response.json()["content"]
    if file_content != test_html_content:
        print("❌ 檔案內容不匹配")
        return False
    
    print("✅ 檔案讀取成功")
    
    # 4. 測試檔案修改
    print("\n4. 測試檔案修改...")
    modified_content = test_html_content.replace("測試頁面", "修改後的測試頁面")
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.html",
            "content": modified_content
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 檔案修改失敗: {response.status_code}")
        return False
    
    print("✅ 檔案修改成功")
    
    # 5. 測試 live-preview 功能
    print("\n5. 測試 live-preview 功能...")
    response = requests.get(f"{BASE_URL}/live-preview/{session_id}/test.html")
    if response.status_code != 200:
        print(f"❌ Live preview 失敗: {response.status_code}")
        return False
    
    preview_content = response.text
    if "修改後的測試頁面" not in preview_content:
        print("❌ Live preview 內容不正確")
        return False
    
    print("✅ Live preview 功能正常")
    
    # 6. 測試檔案列表
    print("\n6. 測試檔案列表...")
    response = requests.get(f"{BASE_URL}/coding/files/{session_id}/list")
    if response.status_code != 200:
        print(f"❌ 檔案列表獲取失敗: {response.status_code}")
        return False
    
    files = response.json()["files"]
    test_file_found = any(f["path"] == "test.html" for f in files)
    if not test_file_found:
        print("❌ 測試檔案未在列表中")
        return False
    
    print("✅ 檔案列表功能正常")
    
    print("\n🎉 所有測試通過！編輯器功能正常運作")
    return True

def test_error_cases():
    print("\n🧪 測試錯誤情況...")
    
    # 測試不存在的 session
    response = requests.get(f"{BASE_URL}/live-preview/nonexistent-session/test.html")
    if response.status_code == 404:
        print("✅ 不存在的 session 正確返回 404")
    else:
        print(f"❌ 不存在的 session 返回錯誤狀態碼: {response.status_code}")
    
    # 測試不存在的檔案
    response = requests.post(f"{BASE_URL}/coding/session/init")
    if response.status_code == 200:
        session_id = response.json()["session_id"]
        response = requests.get(f"{BASE_URL}/live-preview/{session_id}/nonexistent.html")
        if response.status_code == 404:
            print("✅ 不存在的檔案正確返回 404")
        else:
            print(f"❌ 不存在的檔案返回錯誤狀態碼: {response.status_code}")

if __name__ == "__main__":
    try:
        success = test_editor_features()
        if success:
            test_error_cases()
        else:
            print("❌ 基本功能測試失敗，跳過錯誤情況測試")
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務器，請確保 main.py 正在運行")
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {e}")
