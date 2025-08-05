#!/usr/bin/env python3
"""
測試 AI Coding Assistant API
"""

import requests
import json
import time

def test_health_check():
    """測試健康檢查端點"""
    print("🔍 測試健康檢查端點...")
    try:
        response = requests.get("http://localhost:8000/coding/health")
        if response.status_code == 200:
            print("✅ 健康檢查通過")
            print(f"   回應: {response.json()}")
            return True
        else:
            print(f"❌ 健康檢查失敗: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務，請確認服務是否正在運行")
        return False

def test_chat_api():
    """測試聊天 API"""
    print("\n💬 測試聊天 API...")
    
    test_data = {
        "prompt": "請解釋這段 JavaScript 程式碼的作用",
        "code_context": """
function calculateSum(a, b) {
    return a + b;
}

const result = calculateSum(5, 3);
console.log(result);
"""
    }
    
    try:
        print("📤 發送請求...")
        print(f"   問題: {test_data['prompt']}")
        print(f"   程式碼: {test_data['code_context'].strip()}")
        
        response = requests.post(
            "http://localhost:8000/coding/chat",
            json=test_data,
            headers={"Accept": "text/plain"},
            stream=True,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ 聊天 API 測試成功")
            print("📥 接收回應:")
            print("-" * 50)
            
            # 讀取串流回應
            for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                if chunk:
                    print(chunk, end="", flush=True)
            
            print("\n" + "-" * 50)
            return True
        else:
            print(f"❌ 聊天 API 測試失敗: {response.status_code}")
            print(f"   錯誤: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務")
        return False
    except requests.exceptions.Timeout:
        print("❌ 請求超時")
        return False
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("🧪 AI Coding Assistant API 測試")
    print("=" * 50)
    
    # 等待服務啟動
    print("⏳ 等待服務啟動...")
    time.sleep(2)
    
    # 測試健康檢查
    if not test_health_check():
        print("\n❌ 健康檢查失敗，請確認後端服務是否正在運行")
        print("💡 請執行: python start_server.py")
        return
    
    # 測試聊天 API
    if test_chat_api():
        print("\n🎉 所有測試通過！")
        print("✅ API 服務正常運行")
    else:
        print("\n❌ 聊天 API 測試失敗")
        print("💡 請檢查 Ollama 服務是否正在運行")

if __name__ == "__main__":
    main() 
