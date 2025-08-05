#!/usr/bin/env python3
"""
專門解決先驗估計偏差的超參數搜索
基於調試發現：先驗估計有上偏趨勢和飽和現象

策略：
1. 使用極強的正規化來防止過擬合
2. 使用更小的模型和更低的學習率
3. 增加訓練輪數來確保收斂
4. 測試不同的激活函數
"""

import numpy as np
import requests
import time
import json

def test_anti_overfitting_configs():
    """測試強力防過擬合配置"""
    print("🚀 專門針對先驗估計偏差的超參數搜索")
    print("="*80)
    
    # 定義針對性的測試配置
    configs = [
        # 1. 極強正規化 + 極小模型
        {
            'name': '極強正規化 + 極小模型',
            'params': {
                'learning_rate': 0.00005,
                'hidden_dim': 4,
                'weight_decay': 0.05,  # 非常強的正規化
                'n_epochs': 100,
                'activation': 'relu'
            }
        },
        
        # 2. 中等正規化 + 小模型 + Tanh激活
        {
            'name': '中等正規化 + 小模型 + Tanh',
            'params': {
                'learning_rate': 0.0001,
                'hidden_dim': 8,
                'weight_decay': 0.02,
                'n_epochs': 80,
                'activation': 'tanh'
            }
        },
        
        # 3. 適中正規化 + 更多訓練輪數
        {
            'name': '適中正規化 + 長訓練',
            'params': {
                'learning_rate': 0.0002,
                'hidden_dim': 12,
                'weight_decay': 0.01,
                'n_epochs': 150,
                'activation': 'relu'
            }
        },
        
        # 4. Softsign激活 + 強正規化
        {
            'name': 'Softsign + 強正規化',
            'params': {
                'learning_rate': 0.0001,
                'hidden_dim': 8,
                'weight_decay': 0.03,
                'n_epochs': 60,
                'activation': 'softsign'
            }
        },
        
        # 5. 極低學習率 + 中等模型
        {
            'name': '極低學習率策略',
            'params': {
                'learning_rate': 0.00002,
                'hidden_dim': 16,
                'weight_decay': 0.005,
                'n_epochs': 200,
                'activation': 'relu'
            }
        }
    ]
    
    results = []
    best_config = None
    best_prior_error = float('inf')
    
    for i, config in enumerate(configs, 1):
        print(f"\n📋 測試 {i}/{len(configs)}: {config['name']}")
        print(f"   參數: {config['params']}")
        
        # 構建請求
        request_data = {
            "algorithm": "nnPU",
            "data_params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3
            },
            "model_params": config['params']
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                "http://localhost:8000/api/pu-learning/run-simulation",
                json=request_data,
                timeout=120  # 增加超時時間，因為訓練輪數多
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                estimated_prior = result['metrics']['estimated_prior']
                error_rate = result['metrics']['error_rate']
                risk_curve = result['metrics']['risk_curve']
                
                # 計算先驗誤差
                prior_error = abs(estimated_prior - 0.3)
                
                # 分析風險收斂
                if len(risk_curve) >= 20:
                    final_risks = [p['risk'] for p in risk_curve[-10:]]
                    risk_std = np.std(final_risks)
                    risk_trend = np.mean([p['risk'] for p in risk_curve[-5:]]) - np.mean([p['risk'] for p in risk_curve[:5]])
                else:
                    risk_std = float('inf')
                    risk_trend = 0
                
                # 評分
                score = 0
                
                # 先驗準確性 (60%)
                if prior_error < 0.05:
                    prior_score = 60
                elif prior_error < 0.1:
                    prior_score = 45
                elif prior_error < 0.2:
                    prior_score = 30
                elif prior_error < 0.3:
                    prior_score = 15
                else:
                    prior_score = 0
                
                # 錯誤率合理性 (25%)
                if 0.1 <= error_rate <= 0.3:
                    error_score = 25
                elif 0.05 <= error_rate <= 0.4:
                    error_score = 15
                else:
                    error_score = 0
                
                # 收斂穩定性 (15%)
                if risk_std < 0.001 and risk_trend < -0.01:
                    stability_score = 15
                elif risk_std < 0.005 and risk_trend < 0:
                    stability_score = 10
                else:
                    stability_score = 0
                
                total_score = prior_score + error_score + stability_score
                
                print(f"   📊 結果:")
                print(f"      • Estimated Prior: {estimated_prior:.4f} (目標: 0.3000)")
                print(f"      • Prior 誤差: {prior_error:.4f}")
                print(f"      • Classification Error: {error_rate:.4f}")
                print(f"      • 風險穩定性: {risk_std:.6f}")
                print(f"      • 收斂趨勢: {risk_trend:.6f}")
                print(f"      • 總分: {total_score}/100")
                print(f"      • 訓練時間: {elapsed:.1f}s")
                
                # 記錄結果
                result_record = {
                    'config_name': config['name'],
                    'params': config['params'],
                    'estimated_prior': estimated_prior,
                    'prior_error': prior_error,
                    'error_rate': error_rate,
                    'risk_std': risk_std,
                    'risk_trend': risk_trend,
                    'score': total_score,
                    'elapsed_time': elapsed
                }
                results.append(result_record)
                
                # 更新最佳配置
                if prior_error < best_prior_error:
                    best_prior_error = prior_error
                    best_config = result_record
                
                # 成功標準
                if total_score >= 70:
                    print(f"      ✅ 配置優秀！")
                elif total_score >= 50:
                    print(f"      🟡 配置可接受")
                else:
                    print(f"      ❌ 配置需改進")
                    
            else:
                print(f"   ❌ API 失敗: {response.status_code}")
                print(f"      回應: {response.text}")
                
        except Exception as e:
            print(f"   ❌ 錯誤: {e}")
        
        # 休息一下
        if i < len(configs):
            print(f"   ⏱️  等待 3 秒...")
            time.sleep(3)
    
    # 總結報告
    print("\n" + "="*80)
    print("📋 先驗估計偏差調試總結")
    print("="*80)
    
    if results:
        print(f"\n🧪 測試配置數: {len(configs)}")
        
        # 按先驗誤差排序
        results_sorted = sorted(results, key=lambda x: x['prior_error'])
        
        print(f"\n🏆 按先驗準確性排名:")
        print(f"{'排名':>2} {'配置名稱':>25} {'先驗誤差':>8} {'錯誤率':>8} {'總分':>6}")
        print(f"{'-'*55}")
        
        for i, r in enumerate(results_sorted, 1):
            print(f"{i:>2} {r['config_name']:>25} {r['prior_error']:>8.4f} {r['error_rate']:>8.4f} {r['score']:>6}")
        
        if best_config:
            print(f"\n🥇 最佳配置 (先驗誤差最小):")
            print(f"   • 名稱: {best_config['config_name']}")
            print(f"   • 先驗誤差: {best_config['prior_error']:.4f}")
            print(f"   • 估計先驗: {best_config['estimated_prior']:.4f}")
            print(f"   • 分類錯誤率: {best_config['error_rate']:.4f}")
            print(f"   • 總分: {best_config['score']}/100")
            
            print(f"\n🔧 最佳超參數:")
            for key, value in best_config['params'].items():
                print(f"   • {key}: {value}")
            
            if best_config['prior_error'] < 0.1:
                print(f"\n🎉 找到了優秀的基準配置！")
                print(f"✅ 這個配置可以作為 nnPU 黃金基準")
                return best_config
            else:
                print(f"\n🔍 雖然是最佳，但仍需進一步優化")
        
        # 分析趨勢
        print(f"\n📊 結果分析:")
        avg_prior_error = np.mean([r['prior_error'] for r in results])
        print(f"   • 平均先驗誤差: {avg_prior_error:.4f}")
        
        # 檢查是否有改善
        current_best = min([r['prior_error'] for r in results])
        baseline_error = 0.6  # 原始配置的誤差
        
        if current_best < baseline_error * 0.5:
            print(f"   ✅ 顯著改善！先驗誤差從 {baseline_error:.1f} 降到 {current_best:.4f}")
        elif current_best < baseline_error * 0.8:
            print(f"   🟡 有所改善，但仍有進步空間")
        else:
            print(f"   ❌ 改善有限，可能需要檢查模型實現")
    
    return best_config

if __name__ == "__main__":
    try:
        # 檢查服務
        response = requests.get("http://localhost:8000/api/pu-learning/health")
        if response.status_code == 200:
            print("✅ 後端服務正常")
            best = test_anti_overfitting_configs()
        else:
            print("❌ 後端服務異常")
    except Exception as e:
        print(f"❌ 無法連接後端: {e}")
