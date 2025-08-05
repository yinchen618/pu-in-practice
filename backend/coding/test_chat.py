#!/usr/bin/env python3
import requests
import json

def test_chat_api():
    """測試聊天 API"""
    url = "http://localhost:8000/coding/chat"
    
    payload = {
        "prompt": "Hello, can you help me write a simple Python function?",
        "code_context": "# This is a test code context\nprint('Hello World')"
    }
    
    print("發送測試請求...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, stream=True)
        
        if response.status_code == 200:
            print("✅ 請求成功！開始接收串流回應...")
            print("-" * 50)
            
            for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                if chunk:
                    print(chunk, end='', flush=True)
            
            print("\n" + "-" * 50)
            print("✅ 串流回應完成")
        else:
            print(f"❌ 請求失敗，狀態碼: {response.status_code}")
            print(f"錯誤內容: {response.text}")
            
    except Exception as e:
        print(f"❌ 請求異常: {e}")

if __name__ == "__main__":
    test_chat_api() 
