#!/usr/bin/env python3
"""
測試API是否使用真實的PU Learning引擎還是Mock數據
"""
import requests
import json

def test_api_data_source():
    """測試API數據來源"""
    
    # API端點
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 測試配置
    test_config = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "two_moons",
            "dims": 2,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.001,
            "hidden_dim": 64,
            "weight_decay": 0.0001
        }
    }
    
    print("🧪 測試API數據來源...")
    print("="*60)
    
    try:
        # 發送請求
        response = requests.post(url, json=test_config, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            error_rate = data['metrics']['error_rate']
            estimated_prior = data['metrics']['estimated_prior']
            
            print(f"📊 API回傳結果:")
            print(f"   • 錯誤率: {error_rate:.3f} ({error_rate*100:.1f}%)")
            print(f"   • 估計先驗: {estimated_prior:.3f}")
            print(f"   • 真實先驗: {test_config['data_params']['prior']}")
            
            # 檢查是否為Mock數據的特徵
            if 0.05 <= error_rate <= 0.2:
                if abs(estimated_prior - test_config['data_params']['prior']) <= 0.1:
                    print("\n⚠️  疑似Mock數據特徵:")
                    print("   • 錯誤率在0.05-0.2範圍內")
                    print("   • 先驗估計在±0.1範圍內")
                    print("\n🔍 進行多次測試確認...")
                    
                    # 多次測試查看一致性
                    error_rates = []
                    for i in range(3):
                        test_response = requests.post(url, json=test_config, timeout=30)
                        if test_response.status_code == 200:
                            test_data = test_response.json()
                            error_rates.append(test_data['metrics']['error_rate'])
                            print(f"   測試{i+1}: 錯誤率 = {test_data['metrics']['error_rate']:.3f}")
                    
                    # 檢查變異度
                    if len(set([round(er, 3) for er in error_rates])) > 1:
                        print("\n✅ 結果有變異 → 疑似使用真實PU Learning引擎")
                        print("   但錯誤率過高，可能存在配置問題")
                        return "REAL_ENGINE_HIGH_ERROR"
                    else:
                        print("\n❌ 結果完全一致 → 確定是Mock數據")
                        return "MOCK_DATA"
                else:
                    print("\n✅ 使用真實PU Learning引擎")
                    return "REAL_ENGINE"
            else:
                print("\n✅ 使用真實PU Learning引擎")
                return "REAL_ENGINE"
                
        else:
            print(f"❌ API請求失敗: {response.status_code}")
            print(f"   回應: {response.text}")
            return "API_ERROR"
            
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return "TEST_ERROR"

if __name__ == "__main__":
    result = test_api_data_source()
    
    print("\n" + "="*60)
    print("📋 測試結論:")
    
    if result == "MOCK_DATA":
        print("❌ API正在使用Mock數據，需要修復真實引擎")
    elif result == "REAL_ENGINE_HIGH_ERROR":
        print("✅ API使用真實引擎，但錯誤率過高")
        print("💡 建議檢查數據生成和模型配置")
    elif result == "REAL_ENGINE":
        print("✅ API正常使用真實PU Learning引擎")
    else:
        print(f"⚠️  測試結果: {result}")
