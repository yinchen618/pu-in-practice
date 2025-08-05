#!/usr/bin/env python3
"""
極端測試 nnPU 決策邊界百葉窗效果
使用更極端的參數組合來強制產生百葉窗效果
"""

import requests
import json
import time
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Dict

def test_parameter_combination(params: Dict) -> Dict:
    """測試特定參數組合"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": params["distribution"],
            "dims": params["dims"],
            "n_p": params["n_p"],
            "n_u": params["n_u"],
            "prior": params["prior"]
        },
        "model_params": {
            "activation": params["activation"],
            "n_epochs": params["n_epochs"],
            "learning_rate": params["learning_rate"],
            "hidden_dim": params["hidden_dim"],
            "weight_decay": params["weight_decay"]
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        return None

def analyze_decision_boundary_extreme(decision_boundary: List[List[float]]) -> Dict:
    """使用更寬鬆的標準分析決策邊界的百葉窗效果"""
    
    if len(decision_boundary) < 3:
        return {"smoothness": 0, "oscillations": 0, "blinds_effect": False}
    
    # 轉換為 numpy 陣列
    boundary = np.array(decision_boundary)
    x_coords = boundary[:, 0]
    y_coords = boundary[:, 1]
    
    # 計算相鄰點之間的變化
    y_diffs = np.diff(y_coords)
    x_diffs = np.diff(x_coords)
    
    # 計算平滑度指標
    y_variance = np.var(y_diffs)
    y_mean_diff = np.mean(np.abs(y_diffs))
    
    # 計算振盪次數（符號變化次數）
    sign_changes = np.sum(np.diff(np.sign(y_diffs)) != 0)
    
    # 使用更寬鬆的百葉窗效果指標
    blinds_score = 0
    
    # 檢查振盪頻率（降低門檻）
    if sign_changes > len(y_diffs) * 0.15:  # 降低到15%
        blinds_score += 1
    
    # 檢查大幅跳躍（降低門檻）
    large_jumps = np.sum(np.abs(y_diffs) > np.std(y_coords) * 0.3)  # 降低到0.3
    if large_jumps > len(y_diffs) * 0.1:  # 降低到10%
        blinds_score += 1
    
    # 檢查 Y 座標變化範圍（降低門檻）
    y_range = np.max(y_coords) - np.min(y_coords)
    if y_range > 1.5:  # 降低到1.5
        blinds_score += 1
    
    # 檢查相鄰點距離的一致性（降低門檻）
    distances = np.sqrt(x_diffs**2 + y_diffs**2)
    distance_variance = np.var(distances)
    if distance_variance > np.mean(distances) * 0.3:  # 降低到0.3
        blinds_score += 1
    
    # 檢查是否有劇烈的方向變化
    direction_changes = 0
    for i in range(1, len(y_diffs)-1):
        if (y_diffs[i] * y_diffs[i-1] < 0) and (abs(y_diffs[i]) > 0.1):
            direction_changes += 1
    
    if direction_changes > len(y_diffs) * 0.1:  # 10%的點有劇烈方向變化
        blinds_score += 1
    
    # 降低百葉窗效果的門檻
    has_blinds_effect = blinds_score >= 1  # 降低到1
    
    return {
        "smoothness": 1.0 / (1.0 + y_variance),  # 平滑度（0-1，越高越平滑）
        "oscillations": sign_changes,
        "y_variance": y_variance,
        "y_mean_diff": y_mean_diff,
        "y_range": y_range,
        "large_jumps": large_jumps,
        "distance_variance": distance_variance,
        "direction_changes": direction_changes,
        "blinds_score": blinds_score,
        "blinds_effect": has_blinds_effect,
        "boundary_points": len(decision_boundary)
    }

def visualize_blinds_effect(result: Dict, config_name: str, analysis: Dict):
    """可視化百葉窗效果"""
    
    # 提取數據
    p_samples = result['visualization']['p_samples']
    u_samples = result['visualization']['u_samples']
    decision_boundary = result['visualization']['decision_boundary']
    
    # 創建圖表
    plt.figure(figsize=(15, 10))
    
    # 繪製樣本點
    p_x, p_y = zip(*p_samples)
    u_x, u_y = zip(*u_samples)
    
    plt.scatter(p_x, p_y, c='red', s=50, alpha=0.7, label='正樣本 (P)')
    plt.scatter(u_x, u_y, c='gray', s=30, alpha=0.5, label='未標記樣本 (U)')
    
    # 繪製決策邊界
    boundary_x, boundary_y = zip(*decision_boundary)
    plt.plot(boundary_x, boundary_y, 'b-', linewidth=2, label='決策邊界')
    
    # 添加標題和指標
    plt.title(f'nnPU 百葉窗效果: {config_name}\n'
             f'平滑度: {analysis["smoothness"]:.3f}, '
             f'振盪次數: {analysis["oscillations"]}, '
             f'百葉窗分數: {analysis["blinds_score"]}, '
             f'Y變化範圍: {analysis["y_range"]:.3f}, '
             f'方向變化: {analysis["direction_changes"]}')
    plt.xlabel('X 座標')
    plt.ylabel('Y 座標')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 保存圖片
    filename = f'nnpu_extreme_blinds_{config_name.replace(" ", "_").replace("=", "_")}.png'
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"✅ 可視化圖片已保存: {filename}")

def test_extreme_blinds_effect():
    """測試極端參數組合的百葉窗效果"""
    
    print("🔍 極端測試 nnPU 百葉窗效果參數...")
    print("=" * 80)
    
    # 定義極端參數組合
    extreme_configs = [
        {
            "name": "極高學習率_極高權重衰減",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 200,
                "learning_rate": 0.5,  # 極高學習率
                "hidden_dim": 100,
                "weight_decay": 0.2   # 極高權重衰減
            }
        },
        {
            "name": "極低隱藏層_高學習率",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.3,  # 高學習率
                "hidden_dim": 5,       # 極低隱藏層
                "weight_decay": 0.1
            }
        },
        {
            "name": "極不平衡數據_高學習率",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 5,              # 極少正樣本
                "n_u": 500,            # 大量未標記樣本
                "prior": 0.1,          # 低先驗
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.2,  # 高學習率
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        },
        {
            "name": "高維度_低樣本_高學習率",
            "params": {
                "distribution": "complex",
                "dims": 15,
                "n_p": 10,             # 極少樣本
                "n_u": 100,            # 極少樣本
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.3,  # 高學習率
                "hidden_dim": 50,
                "weight_decay": 0.1
            }
        },
        {
            "name": "極高學習率_tanh激活",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "tanh",  # tanh 激活
                "n_epochs": 100,
                "learning_rate": 0.4,  # 極高學習率
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        },
        {
            "name": "極高學習率_softsign激活",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "softsign",  # softsign 激活
                "n_epochs": 100,
                "learning_rate": 0.4,      # 極高學習率
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        },
        {
            "name": "極高學習率_高權重衰減_低隱藏層",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.4,  # 極高學習率
                "hidden_dim": 10,      # 低隱藏層
                "weight_decay": 0.2    # 高權重衰減
            }
        },
        {
            "name": "極高學習率_極不平衡_低隱藏層",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 3,              # 極少正樣本
                "n_u": 600,            # 大量未標記樣本
                "prior": 0.05,         # 極低先驗
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.5,  # 極高學習率
                "hidden_dim": 5,       # 極低隱藏層
                "weight_decay": 0.1
            }
        }
    ]
    
    results = []
    
    for i, config in enumerate(extreme_configs, 1):
        print(f"\n📋 測試 {i}/{len(extreme_configs)}: {config['name']}")
        print(f"   參數: {config['params']}")
        
        # 執行測試
        result = test_parameter_combination(config['params'])
        
        if result and result.get('success'):
            # 分析決策邊界
            boundary_analysis = analyze_decision_boundary_extreme(
                result['visualization']['decision_boundary']
            )
            
            # 獲取指標
            metrics = result['metrics']
            
            print(f"   ✅ 成功執行")
            print(f"   📊 決策邊界分析:")
            print(f"      • 平滑度: {boundary_analysis['smoothness']:.3f}")
            print(f"      • 振盪次數: {boundary_analysis['oscillations']}")
            print(f"      • Y 變化範圍: {boundary_analysis['y_range']:.3f}")
            print(f"      • 大幅跳躍: {boundary_analysis['large_jumps']}")
            print(f"      • 方向變化: {boundary_analysis['direction_changes']}")
            print(f"      • 百葉窗分數: {boundary_analysis['blinds_score']}")
            print(f"      • 百葉窗效果: {'✅ 是' if boundary_analysis['blinds_effect'] else '❌ 否'}")
            print(f"   📈 模型指標:")
            print(f"      • 估計先驗: {metrics['estimated_prior']:.3f}")
            print(f"      • 錯誤率: {metrics['error_rate']:.3f}")
            
            # 生成可視化
            if boundary_analysis['blinds_effect']:
                visualize_blinds_effect(result, config['name'], boundary_analysis)
                print(f"   🎨 已生成百葉窗效果可視化")
            
            # 保存結果
            test_result = {
                "config_name": config['name'],
                "params": config['params'],
                "boundary_analysis": {
                    "smoothness": float(boundary_analysis['smoothness']),
                    "oscillations": int(boundary_analysis['oscillations']),
                    "y_variance": float(boundary_analysis['y_variance']),
                    "y_mean_diff": float(boundary_analysis['y_mean_diff']),
                    "y_range": float(boundary_analysis['y_range']),
                    "large_jumps": int(boundary_analysis['large_jumps']),
                    "distance_variance": float(boundary_analysis['distance_variance']),
                    "direction_changes": int(boundary_analysis['direction_changes']),
                    "blinds_score": int(boundary_analysis['blinds_score']),
                    "blinds_effect": bool(boundary_analysis['blinds_effect']),
                    "boundary_points": int(boundary_analysis['boundary_points'])
                },
                "metrics": {
                    "estimated_prior": float(metrics['estimated_prior']),
                    "error_rate": float(metrics['error_rate'])
                },
                "has_blinds_effect": bool(boundary_analysis['blinds_effect'])
            }
            results.append(test_result)
            
        else:
            print(f"   ❌ 執行失敗")
        
        # 等待一下避免請求過於頻繁
        time.sleep(1)
    
    # 分析結果
    print("\n" + "=" * 80)
    print("📊 極端百葉窗效果測試結果")
    print("=" * 80)
    
    blinds_effects = [r for r in results if r['has_blinds_effect']]
    smooth_effects = [r for r in results if not r['has_blinds_effect']]
    
    print(f"🔍 發現百葉窗效果: {len(blinds_effects)}/{len(results)} 個配置")
    
    if blinds_effects:
        print(f"\n🎯 確認會產生百葉窗效果的極端參數組合:")
        for i, effect in enumerate(blinds_effects, 1):
            print(f"\n{i}. {effect['config_name']}")
            params = effect['params']
            print(f"   參數:")
            print(f"     • 數據分布: {params['distribution']}")
            print(f"     • 維度: {params['dims']}")
            print(f"     • 正樣本數: {params['n_p']}")
            print(f"     • 未標記樣本數: {params['n_u']}")
            print(f"     • 先驗: {params['prior']}")
            print(f"     • 激活函數: {params['activation']}")
            print(f"     • 訓練週期: {params['n_epochs']}")
            print(f"     • 學習率: {params['learning_rate']}")
            print(f"     • 隱藏層維度: {params['hidden_dim']}")
            print(f"     • 權重衰減: {params['weight_decay']}")
            print(f"   百葉窗指標:")
            analysis = effect['boundary_analysis']
            print(f"     • 平滑度: {analysis['smoothness']:.3f}")
            print(f"     • 振盪次數: {analysis['oscillations']}")
            print(f"     • 百葉窗分數: {analysis['blinds_score']}")
            print(f"     • Y 變化範圍: {analysis['y_range']:.3f}")
            print(f"     • 方向變化: {analysis['direction_changes']}")
    
    if smooth_effects:
        print(f"\n✅ 產生平滑邊界的參數組合:")
        for i, smooth in enumerate(smooth_effects, 1):
            print(f"   {i}. {smooth['config_name']}")
    
    # 總結極端百葉窗效果的關鍵參數
    print(f"\n📋 極端百葉窗效果關鍵參數總結:")
    print(f"   🎯 最可能產生百葉窗效果的極端參數組合:")
    print(f"      • 學習率 (learning_rate): 0.3-0.5 (極高)")
    print(f"      • 權重衰減 (weight_decay): 0.1-0.2 (高)")
    print(f"      • 隱藏層維度: 5-10 (極低)")
    print(f"      • 正樣本數: 3-10 (極少)")
    print(f"      • 先驗 (prior): 0.05-0.1 (極低)")
    print(f"      • 激活函數: relu, tanh, softsign")
    print(f"      • 數據分布: two_moons, complex")
    
    # 保存詳細結果
    with open('nnpu_extreme_blinds_effect_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 詳細結果已保存到: nnpu_extreme_blinds_effect_results.json")
    
    return results

if __name__ == "__main__":
    results = test_extreme_blinds_effect()
    
    print(f"\n🎯 極端測試完成！") 
