#!/usr/bin/env python3
"""
測試程式碼格式化功能
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_formatting():
    print("🧪 開始測試程式碼格式化功能...")
    
    # 1. 初始化 session
    print("\n1. 初始化 session...")
    response = requests.post(f"{BASE_URL}/coding/session/init")
    if response.status_code != 200:
        print(f"❌ Session 初始化失敗: {response.status_code}")
        return False
    
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"✅ Session 初始化成功: {session_id}")
    
    # 2. 創建測試 JavaScript 檔案（未格式化）
    print("\n2. 創建未格式化的測試檔案...")
    unformatted_js = """function hello(){console.log('Hello, World!');return true;}
const test={name:'test',value:123,items:[1,2,3]};
if(test.value>100){console.log('Value is high');}else{console.log('Value is low');}"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.js",
            "content": unformatted_js
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 創建測試檔案失敗: {response.status_code}")
        return False
    
    print("✅ 未格式化的測試檔案創建成功")
    print(f"原始程式碼長度: {len(unformatted_js)} 字元")
    
    # 3. 創建測試 HTML 檔案（未格式化）
    print("\n3. 創建未格式化的 HTML 檔案...")
    unformatted_html = """<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1><p>This is a test</p><script>console.log('test');</script></body></html>"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.html",
            "content": unformatted_html
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 創建 HTML 檔案失敗: {response.status_code}")
        return False
    
    print("✅ 未格式化的 HTML 檔案創建成功")
    
    # 4. 創建測試 CSS 檔案（未格式化）
    print("\n4. 創建未格式化的 CSS 檔案...")
    unformatted_css = """body{margin:0;padding:0;font-family:Arial,sans-serif;}.container{width:100%;max-width:1200px;margin:0 auto;}.header{background:#333;color:white;padding:20px;}"""
    
    response = requests.post(
        f"{BASE_URL}/coding/files/{session_id}/content",
        json={
            "path": "test.css",
            "content": unformatted_css
        }
    )
    
    if response.status_code != 200:
        print(f"❌ 創建 CSS 檔案失敗: {response.status_code}")
        return False
    
    print("✅ 未格式化的 CSS 檔案創建成功")
    
    # 5. 測試檔案列表
    print("\n5. 測試檔案列表...")
    response = requests.get(f"{BASE_URL}/coding/files/?session_id={session_id}")
    if response.status_code != 200:
        print(f"❌ 檔案列表獲取失敗: {response.status_code}")
        return False
    
    files = response.json()  # 直接使用回應，不是 {"files": ...}
    test_files = ["test.js", "test.html", "test.css"]
    for test_file in test_files:
        if not any(f["path"] == test_file for f in files):
            print(f"❌ 測試檔案 {test_file} 未在列表中")
            return False
    
    print("✅ 所有測試檔案都在列表中")
    
    print("\n🎉 格式化功能測試準備完成！")
    print("📝 說明：")
    print("- 已創建未格式化的 JavaScript、HTML、CSS 檔案")
    print("- 在前端編輯器中可以使用 Ctrl+Shift+F 進行格式化")
    print("- 格式化後程式碼會自動調整縮排和排版")
    print("- 支援的檔案類型：JS、JSX、TS、TSX、HTML、CSS、MD、JSON")
    
    return True

def test_formatted_examples():
    print("\n📋 格式化範例：")
    
    print("\nJavaScript 格式化前：")
    print("""function hello(){console.log('Hello, World!');return true;}""")
    
    print("\nJavaScript 格式化後：")
    print("""function hello() {
  console.log('Hello, World!');
  return true;
}""")
    
    print("\nHTML 格式化前：")
    print("""<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>""")
    
    print("\nHTML 格式化後：")
    print("""<!DOCTYPE html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <h1>Hello</h1>
  </body>
</html>""")

if __name__ == "__main__":
    try:
        success = test_formatting()
        if success:
            test_formatted_examples()
        else:
            print("❌ 格式化功能測試失敗")
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務器，請確保 main.py 正在運行")
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {e}")
