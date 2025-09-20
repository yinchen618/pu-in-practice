#!/usr/bin/env python3
"""
nnPU 基準配置搜索
現在先驗估計修正後，重新搜索最佳的 nnPU 配置
目標：找到既準確又平滑的決策邊界
"""

import requests
import time
import json

def test_nnpu_config(config):
    """測試單一 nnPU 配置"""
    url = "https://weakrisk.yinchen.tw/api/pu-learning/run-simulation"

    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "two_moons",
            "dims": 2,
            "n_p": 100,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": config["epochs"],
            "learning_rate": config["learning_rate"],
            "hidden_dim": config["hidden_size"],
            "weight_decay": config["weight_decay"]
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=120)
        if response.status_code == 200:
            result = response.json()

            # 提取關鍵指標
            error_rate = result["metrics"]["error_rate"]
            estimated_prior = result["metrics"]["estimated_prior"]
            prior_error = abs(estimated_prior - 0.3)

            # 計算綜合得分
            # 權重：準確性 60%，先驗估計 30%，穩定性 10%
            accuracy_score = max(0, 1 - error_rate)  # 錯誤率越低越好
            prior_score = max(0, 1 - prior_error * 3)  # 先驗誤差 < 0.33 才得分

            # 簡單的穩定性指標（可以後續改進）
            stability_score = 0.8  # 預設值

            composite_score = (0.6 * accuracy_score +
                             0.3 * prior_score +
                             0.1 * stability_score)

            return {
                "config": config,
                "error_rate": error_rate,
                "estimated_prior": estimated_prior,
                "prior_error": prior_error,
                "composite_score": composite_score,
                "success": True
            }
        else:
            return {"config": config, "success": False, "error": f"HTTP {response.status_code}"}

    except Exception as e:
        return {"config": config, "success": False, "error": str(e)}

def main():
    print("🔍 nnPU 基準配置搜索")
    print("=" * 60)
    print("目標：找到先驗估計修正後的最佳 nnPU 配置")
    print("評估標準：分類準確度 + 先驗估計精度 + 穩定性")
    print()

    # 搜索空間（聚焦於可能有良好表現的配置）
    configs = [
        # 基礎配置組（移除 beta 參數）
        {"learning_rate": 0.01, "weight_decay": 1e-4, "epochs": 100, "hidden_size": 64},
        {"learning_rate": 0.01, "weight_decay": 1e-3, "epochs": 100, "hidden_size": 64},
        {"learning_rate": 0.005, "weight_decay": 1e-4, "epochs": 150, "hidden_size": 64},

        # 更深層網絡
        {"learning_rate": 0.01, "weight_decay": 1e-4, "epochs": 100, "hidden_size": 128},
        {"learning_rate": 0.005, "weight_decay": 1e-3, "epochs": 150, "hidden_size": 128},

        # 增加正則化
        {"learning_rate": 0.01, "weight_decay": 5e-3, "epochs": 100, "hidden_size": 64},
        {"learning_rate": 0.005, "weight_decay": 5e-3, "epochs": 150, "hidden_size": 64},

        # 更長訓練
        {"learning_rate": 0.005, "weight_decay": 1e-4, "epochs": 200, "hidden_size": 64},
        {"learning_rate": 0.003, "weight_decay": 1e-3, "epochs": 200, "hidden_size": 128},

        # 精細調整（基於簡單測試的成功配置）
        {"learning_rate": 0.01, "weight_decay": 1e-4, "epochs": 50, "hidden_size": 64},  # 從簡單測試
        {"learning_rate": 0.01, "weight_decay": 2e-4, "epochs": 75, "hidden_size": 64},
    ]

    results = []

    print(f"⏱️  開始測試 {len(configs)} 個配置...")
    print()

    for i, config in enumerate(configs, 1):
        print(f"[{i:2d}/{len(configs)}] 測試配置: lr={config['learning_rate']}, wd={config['weight_decay']}, epochs={config['epochs']}, hidden={config['hidden_size']}")

        result = test_nnpu_config(config)
        results.append(result)

        if result["success"]:
            print(f"       ✅ 錯誤率: {result['error_rate']:.4f}, 估計先驗: {result['estimated_prior']:.4f}, 得分: {result['composite_score']:.4f}")
        else:
            print(f"       ❌ 失敗: {result['error']}")

        # 避免過於頻繁的請求
        time.sleep(2)

    print()
    print("=" * 60)
    print("🏆 搜索結果分析")
    print("=" * 60)

    # 過濾成功的結果
    successful_results = [r for r in results if r["success"]]

    if not successful_results:
        print("❌ 沒有成功的配置！")
        return

    # 按綜合得分排序
    successful_results.sort(key=lambda x: x["composite_score"], reverse=True)

    print(f"📊 成功率: {len(successful_results)}/{len(results)} ({len(successful_results)/len(results)*100:.1f}%)")
    print()

    print("🥇 前5名配置:")
    for i, result in enumerate(successful_results[:5], 1):
        config = result["config"]
        print(f"{i}. 得分: {result['composite_score']:.4f}")
        print(f"   錯誤率: {result['error_rate']:.4f}")
        print(f"   估計先驗: {result['estimated_prior']:.4f} (誤差: {result['prior_error']:.4f})")
        print(f"   配置: lr={config['learning_rate']}, wd={config['weight_decay']}, epochs={config['epochs']}, hidden={config['hidden_size']}")
        print()

    # 保存結果
    with open("nnpu_baseline_search_results.json", "w") as f:
        json.dump(successful_results, f, indent=2)

    print("💾 詳細結果已保存到 nnpu_baseline_search_results.json")

    # 選擇最佳配置
    best_config = successful_results[0]["config"]
    print()
    print("🎯 推薦的 nnPU 基準配置:")
    print(f"   learning_rate: {best_config['learning_rate']}")
    print(f"   weight_decay: {best_config['weight_decay']}")
    print(f"   epochs: {best_config['epochs']}")
    print(f"   hidden_size: {best_config['hidden_size']}")

if __name__ == "__main__":
    main()
