#!/usr/bin/env python3
"""
系統性搜索最佳配置參數
測試不同的隱藏層大小和正規化強度組合
"""

import requests
import json
import time
import itertools

def test_configuration(hidden_dim, lambda_reg, algorithm="nnPU"):
    """測試指定配置"""

    config = {
        "algorithm": algorithm,
        "prior_estimation_method": "median",
        "data_params": {
            "distribution": "two_moons",
            "dims": 50,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.01,
            "hidden_dim": hidden_dim,
            "lambda_regularization": lambda_reg
        }
    }

    try:
        response = requests.post(
            "https://weakrisk.yinchen.tw/api/pu-learning/run-simulation",
            json=config,
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            return {
                "hidden_dim": hidden_dim,
                "lambda_reg": lambda_reg,
                "estimated_prior": result['metrics']['estimated_prior'],
                "error_rate": result['metrics']['error_rate'],
                "prior_error": abs(result['metrics']['estimated_prior'] - 0.3),
                "success": True
            }
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def run_parameter_search():
    """運行參數搜索"""

    print("🔍 開始系統性參數搜索")
    print("目標: 找到錯誤率 < 5% 且先驗估計準確的配置")
    print("="*80)

    # 測試範圍
    hidden_sizes = [32, 48, 64, 96, 128, 160, 200]
    lambda_values = [0, 0.00001, 0.00005, 0.0001, 0.0005, 0.001, 0.005]

    print(f"📋 搜索範圍:")
    print(f"   • 隱藏層大小: {hidden_sizes}")
    print(f"   • λ 正規化: {lambda_values}")
    print(f"   • 總組合數: {len(hidden_sizes) * len(lambda_values)}")

    results = []
    total_tests = len(hidden_sizes) * len(lambda_values)
    current_test = 0

    print(f"\n🚀 開始測試...")

    for hidden_dim in hidden_sizes:
        for lambda_reg in lambda_values:
            current_test += 1
            print(f"[{current_test}/{total_tests}] 測試 hidden={hidden_dim}, λ={lambda_reg}...", end=" ")

            result = test_configuration(hidden_dim, lambda_reg)

            if result["success"]:
                results.append(result)
                print(f"錯誤率: {result['error_rate']:.3f} ({result['error_rate']*100:.1f}%)")
            else:
                print(f"失敗: {result['error']}")

            time.sleep(0.5)  # 避免過載後端

    return results

def analyze_results(results):
    """分析結果並找出最佳配置"""

    print(f"\n" + "="*80)
    print("📊 結果分析")
    print("="*80)

    if not results:
        print("❌ 沒有成功的測試結果")
        return

    # 按錯誤率排序
    results_by_error = sorted(results, key=lambda x: x['error_rate'])

    print(f"\n🏆 錯誤率最低的前 5 個配置:")
    print("-" * 60)
    for i, result in enumerate(results_by_error[:5]):
        print(f"{i+1:2d}. Hidden={result['hidden_dim']:3d}, λ={result['lambda_reg']:7.5f} "
              f"→ 錯誤率={result['error_rate']*100:5.1f}%, 先驗誤差={result['prior_error']:.3f}")

    # 按先驗估計準確度排序
    results_by_prior = sorted(results, key=lambda x: x['prior_error'])

    print(f"\n🎯 先驗估計最準確的前 5 個配置:")
    print("-" * 60)
    for i, result in enumerate(results_by_prior[:5]):
        print(f"{i+1:2d}. Hidden={result['hidden_dim']:3d}, λ={result['lambda_reg']:7.5f} "
              f"→ 先驗誤差={result['prior_error']:.3f}, 錯誤率={result['error_rate']*100:5.1f}%")

    # 尋找平衡最佳配置
    print(f"\n⚖️  綜合評分最佳配置 (錯誤率權重=70%, 先驗準確度權重=30%):")
    print("-" * 60)

    for result in results:
        # 綜合評分 (越低越好)
        error_score = result['error_rate']  # 0-1
        prior_score = result['prior_error'] / 0.1  # 歸一化到 0-1 (假設最大誤差 0.1)
        result['composite_score'] = 0.7 * error_score + 0.3 * prior_score

    results_by_composite = sorted(results, key=lambda x: x['composite_score'])

    for i, result in enumerate(results_by_composite[:5]):
        print(f"{i+1:2d}. Hidden={result['hidden_dim']:3d}, λ={result['lambda_reg']:7.5f} "
              f"→ 綜合分數={result['composite_score']:.3f}, "
              f"錯誤率={result['error_rate']*100:5.1f}%, 先驗誤差={result['prior_error']:.3f}")

    # 推薦最佳配置
    best_config = results_by_composite[0]

    print(f"\n🌟 推薦的最佳配置:")
    print(f"   • 隱藏層大小: {best_config['hidden_dim']}")
    print(f"   • λ 正規化: {best_config['lambda_reg']}")
    print(f"   • 預期錯誤率: {best_config['error_rate']*100:.2f}%")
    print(f"   • 預期先驗估計: {best_config['estimated_prior']:.3f} (真實值: 0.300)")

    # 檢查是否需要更新前端
    print(f"\n🔧 前端更新建議:")

    current_hidden = 64
    current_lambda = 0.0001

    if (best_config['hidden_dim'] != current_hidden or
        abs(best_config['lambda_reg'] - current_lambda) > 0.00001):

        print(f"   ⚠️  需要更新前端配置:")
        print(f"      • 當前隱藏層: {current_hidden} → 建議: {best_config['hidden_dim']}")
        print(f"      • 當前λ: {current_lambda} → 建議: {best_config['lambda_reg']}")

        # 檢查是否需要新增下拉選項
        lambda_options = [0, 0.0001, 0.01, 0.1]
        if best_config['lambda_reg'] not in lambda_options:
            print(f"      • 需要在λ下拉選單新增選項: {best_config['lambda_reg']}")

        hidden_options = [16, 32, 64, 128, 256]
        if best_config['hidden_dim'] not in hidden_options:
            print(f"      • 需要在隱藏層下拉選單新增選項: {best_config['hidden_dim']}")

    else:
        print(f"   ✅ 當前前端配置已經是最佳，無需更改")

    return best_config

if __name__ == "__main__":
    results = run_parameter_search()
    best_config = analyze_results(results)
