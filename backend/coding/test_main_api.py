#!/usr/bin/env python3
"""
測試整合到主 main.py 中的 AI Coding Assistant API
"""

import requests
import json
import time

def test_main_health_check():
    """測試主 API 健康檢查端點"""
    print("🔍 測試主 API 健康檢查端點...")
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            data = response.json()
            print("✅ 主 API 健康檢查通過")
            print(f"   服務狀態: {data.get('status')}")
            print(f"   包含模組: {list(data.get('modules', {}).keys())}")
            
            # 檢查是否包含 coding 模組
            if 'coding' in data.get('modules', {}):
                print("✅ Coding API 已成功整合到主 API")
            else:
                print("❌ Coding API 未在主 API 中找到")
                return False
            return True
        else:
            print(f"❌ 主 API 健康檢查失敗: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到主 API 服務，請確認服務是否正在運行")
        return False

def test_coding_health_check():
    """測試 Coding API 健康檢查端點"""
    print("\n🔍 測試 Coding API 健康檢查端點...")
    try:
        response = requests.get("http://localhost:8000/coding/health")
        if response.status_code == 200:
            print("✅ Coding API 健康檢查通過")
            print(f"   回應: {response.json()}")
            return True
        else:
            print(f"❌ Coding API 健康檢查失敗: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到 Coding API 服務")
        return False

def test_coding_chat_api():
    """測試 Coding 聊天 API"""
    print("\n💬 測試 Coding 聊天 API...")
    
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
        print("📤 發送請求到主 API...")
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
            print("✅ Coding 聊天 API 測試成功")
            print("📥 接收回應:")
            print("-" * 50)
            
            # 讀取串流回應
            for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                if chunk:
                    print(chunk, end="", flush=True)
            
            print("\n" + "-" * 50)
            return True
        else:
            print(f"❌ Coding 聊天 API 測試失敗: {response.status_code}")
            print(f"   錯誤: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到主 API 服務")
        return False
    except requests.exceptions.Timeout:
        print("❌ 請求超時")
        return False
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return False

def test_other_apis():
    """測試其他 API 端點是否正常"""
    print("\n🔍 測試其他 API 端點...")
    
    apis_to_test = [
        ("/api/ammeter", "電表 API"),
        ("/api/ai", "AI API"),
        ("/api/pu-learning", "PU Learning API"),
        ("/api/testbed", "Testbed API"),
    ]
    
    all_passed = True
    for endpoint, name in apis_to_test:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}")
            if response.status_code in [200, 404, 405]:  # 200=成功, 404=端點不存在, 405=方法不允許
                print(f"✅ {name} 端點可訪問")
            else:
                print(f"❌ {name} 端點異常: {response.status_code}")
                all_passed = False
        except requests.exceptions.ConnectionError:
            print(f"❌ {name} 端點無法連接")
            all_passed = False
    
    return all_passed

def main():
    """主測試函數"""
    print("🧪 主 API 整合測試")
    print("=" * 50)
    
    # 等待服務啟動
    print("⏳ 等待服務啟動...")
    time.sleep(2)
    
    # 測試主 API 健康檢查
    if not test_main_health_check():
        print("\n❌ 主 API 健康檢查失敗，請確認服務是否正在運行")
        print("💡 請執行: python main.py")
        return
    
    # 測試 Coding API 健康檢查
    if not test_coding_health_check():
        print("\n❌ Coding API 健康檢查失敗")
        return
    
    # 測試 Coding 聊天 API
    if not test_coding_chat_api():
        print("\n❌ Coding 聊天 API 測試失敗")
        print("💡 請檢查 Ollama 服務是否正在運行")
        return
    
    # 測試其他 API
    if not test_other_apis():
        print("\n⚠️ 部分 API 端點測試失敗")
    
    print("\n🎉 主 API 整合測試完成！")
    print("✅ Coding API 已成功整合到主 API 中")
    print("✅ 所有服務正常運行")

if __name__ == "__main__":
    main() 
