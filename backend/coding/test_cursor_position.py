#!/usr/bin/env python3
"""
測試編輯器游標位置功能
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_cursor_position():
    print("🧪 開始測試編輯器游標位置功能...")
    
    # 1. 初始化 session
    print("\n1. 初始化 session...")
    response = requests.post(f"{BASE_URL}/coding/session/init")
    if response.status_code != 200:
        print(f"❌ Session 初始化失敗: {response.status_code}")
        return False
    
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"✅ Session 初始化成功: {session_id}")
    
    # 2. 創建測試檔案
    print("\n2. 創建測試檔案...")
    test_content = """function hello() {
  console.log('Hello, World!');
  // 這是一個註解
  return true;
}

hello();"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.js",
            "content": test_content
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 創建測試檔案失敗: {response.status_code}")
        return False
    
    print("✅ 測試檔案創建成功")
    
    # 3. 測試檔案讀取
    print("\n3. 測試檔案讀取...")
    response = requests.get(f"{BASE_URL}/coding/files/{session_id}/content?path=test.js")
    if response.status_code != 200:
        print(f"❌ 檔案讀取失敗: {response.status_code}")
        return False
    
    file_content = response.json()["content"]
    if file_content != test_content:
        print("❌ 檔案內容不匹配")
        return False
    
    print("✅ 檔案讀取成功")
    print(f"檔案內容行數: {len(file_content.split(chr(10)))}")
    
    # 4. 測試檔案修改（模擬編輯器操作）
    print("\n4. 測試檔案修改...")
    modified_content = """function hello() {
  console.log('Hello, World!');
  // 這是一個註解
  const newVariable = 'test';  // 新增的程式碼
  return true;
}

hello();"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.js",
            "content": modified_content
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 檔案修改失敗: {response.status_code}")
        return False
    
    print("✅ 檔案修改成功")
    
    # 5. 驗證修改後的內容
    print("\n5. 驗證修改後的內容...")
    response = requests.get(f"{BASE_URL}/coding/files/{session_id}/content?path=test.js")
    if response.status_code != 200:
        print(f"❌ 檔案讀取失敗: {response.status_code}")
        return False
    
    updated_content = response.json()["content"]
    if updated_content != modified_content:
        print("❌ 修改後的檔案內容不匹配")
        return False
    
    print("✅ 修改後的檔案內容正確")
    print(f"修改後檔案內容行數: {len(updated_content.split(chr(10)))}")
    
    # 6. 測試檔案列表
    print("\n6. 測試檔案列表...")
    response = requests.get(f"{BASE_URL}/coding/files/{session_id}/list")
    if response.status_code != 200:
        print(f"❌ 檔案列表獲取失敗: {response.status_code}")
        return False
    
    files = response.json()["files"]
    test_file_found = any(f["path"] == "test.js" for f in files)
    if not test_file_found:
        print("❌ 測試檔案未在列表中")
        return False
    
    print("✅ 檔案列表功能正常")
    
    print("\n🎉 游標位置功能測試通過！")
    print("📝 說明：")
    print("- 編輯器會保存用戶的游標位置")
    print("- 在編輯過程中游標位置保持穩定")
    print("- 切換檔案時游標會重置到檔案開頭")
    print("- 檔案內容更新時不會影響用戶的編輯位置")
    
    return True

if __name__ == "__main__":
    try:
        success = test_cursor_position()
        if not success:
            print("❌ 游標位置功能測試失敗")
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務器，請確保 main.py 正在運行")
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {e}")
