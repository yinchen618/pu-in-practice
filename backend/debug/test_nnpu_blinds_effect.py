#!/usr/bin/env python3
"""
測試 nnPU 決策邊界百葉窗效果
尋找會導致決策邊界出現鋸齒狀或百葉窗效果的參數組合
"""

import requests
import json
import time
import numpy as np
from typing import List, Dict, Tuple
import matplotlib.pyplot as plt

def test_parameter_combination(
    distribution: str,
    dims: int,
    n_p: int,
    n_u: int,
    prior: float,
    activation: str,
    n_epochs: int,
    learning_rate: float,
    hidden_dim: int,
    weight_decay: float
) -> Dict:
    """測試特定參數組合"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": distribution,
            "dims": dims,
            "n_p": n_p,
            "n_u": n_u,
            "prior": prior
        },
        "model_params": {
            "activation": activation,
            "n_epochs": n_epochs,
            "learning_rate": learning_rate,
            "hidden_dim": hidden_dim,
            "weight_decay": weight_decay
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 請求失敗: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 請求異常: {e}")
        return None

def analyze_decision_boundary(decision_boundary: List[List[float]]) -> Dict:
    """分析決策邊界的平滑度"""
    
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
    
    # 計算百葉窗效果指標
    # 百葉窗效果通常表現為：
    # 1. 高振盪頻率
    # 2. 相鄰點之間的大幅跳躍
    # 3. Y 座標的劇烈變化
    
    blinds_score = 0
    
    # 檢查振盪頻率
    if sign_changes > len(y_diffs) * 0.3:  # 超過30%的點有符號變化
        blinds_score += 1
    
    # 檢查大幅跳躍
    large_jumps = np.sum(np.abs(y_diffs) > np.std(y_coords) * 0.5)
    if large_jumps > len(y_diffs) * 0.2:  # 超過20%的點有大跳躍
        blinds_score += 1
    
    # 檢查 Y 座標變化範圍
    y_range = np.max(y_coords) - np.min(y_coords)
    if y_range > 2.0:  # Y 座標變化過大
        blinds_score += 1
    
    # 檢查相鄰點距離的一致性
    distances = np.sqrt(x_diffs**2 + y_diffs**2)
    distance_variance = np.var(distances)
    if distance_variance > np.mean(distances) * 0.5:  # 距離變化過大
        blinds_score += 1
    
    has_blinds_effect = blinds_score >= 2
    
    return {
        "smoothness": 1.0 / (1.0 + y_variance),  # 平滑度（0-1，越高越平滑）
        "oscillations": sign_changes,
        "y_variance": y_variance,
        "y_mean_diff": y_mean_diff,
        "y_range": y_range,
        "large_jumps": large_jumps,
        "distance_variance": distance_variance,
        "blinds_score": blinds_score,
        "blinds_effect": has_blinds_effect,
        "boundary_points": len(decision_boundary)
    }

def test_blinds_effect_parameters():
    """測試會導致百葉窗效果的參數組合"""
    
    print("🔍 開始尋找 nnPU 百葉窗效果參數...")
    print("=" * 80)
    
    # 定義要測試的參數範圍
    test_configs = [
        # 高學習率 + 低隱藏層維度（容易過度擬合）
        {
            "name": "高學習率 + 低隱藏層",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.1,  # 高學習率
                "hidden_dim": 10,      # 低隱藏層維度
                "weight_decay": 0.0
            }
        },
        # 高學習率 + 高權重衰減（不穩定訓練）
        {
            "name": "高學習率 + 高權重衰減",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,  # 高學習率
                "hidden_dim": 100,
                "weight_decay": 0.1     # 高權重衰減
            }
        },
        # 複雜數據 + 低隱藏層（模型容量不足）
        {
            "name": "複雜數據 + 低隱藏層",
            "params": {
                "distribution": "complex",
                "dims": 8,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.01,
                "hidden_dim": 5,        # 極低隱藏層維度
                "weight_decay": 0.0
            }
        },
        # 高維度 + 低樣本數（過度擬合）
        {
            "name": "高維度 + 低樣本數",
            "params": {
                "distribution": "complex",
                "dims": 20,
                "n_p": 20,              # 低樣本數
                "n_u": 100,             # 低樣本數
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 200,        # 高訓練週期
                "learning_rate": 0.01,
                "hidden_dim": 50,
                "weight_decay": 0.0
            }
        },
        # 極高學習率（不穩定）
        {
            "name": "極高學習率",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 50,
                "learning_rate": 0.5,   # 極高學習率
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        },
        # 高學習率 + tanh 激活（梯度爆炸）
        {
            "name": "高學習率 + tanh激活",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "tanh",   # tanh 激活
                "n_epochs": 100,
                "learning_rate": 0.1,   # 高學習率
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        },
        # 極不平衡數據
        {
            "name": "極不平衡數據",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 10,              # 極少正樣本
                "n_u": 500,             # 大量未標記樣本
                "prior": 0.1,           # 低先驗
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.01,
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        },
        # 高學習率 + 高維度
        {
            "name": "高學習率 + 高維度",
            "params": {
                "distribution": "complex",
                "dims": 15,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.1,   # 高學習率
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        }
    ]
    
    results = []
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n📋 測試 {i}/{len(test_configs)}: {config['name']}")
        print(f"   參數: {config['params']}")
        
        # 執行測試
        result = test_parameter_combination(**config['params'])
        
        if result and result.get('success'):
            # 分析決策邊界
            boundary_analysis = analyze_decision_boundary(
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
            print(f"      • 百葉窗分數: {boundary_analysis['blinds_score']}")
            print(f"      • 百葉窗效果: {'✅ 是' if boundary_analysis['blinds_effect'] else '❌ 否'}")
            print(f"   📈 模型指標:")
            print(f"      • 估計先驗: {metrics['estimated_prior']:.3f}")
            print(f"      • 錯誤率: {metrics['error_rate']:.3f}")
            
            # 保存結果（轉換 numpy 類型為 Python 原生類型）
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
    print("📊 百葉窗效果分析結果")
    print("=" * 80)
    
    blinds_effects = [r for r in results if r['has_blinds_effect']]
    smooth_effects = [r for r in results if not r['has_blinds_effect']]
    
    print(f"🔍 發現百葉窗效果: {len(blinds_effects)}/{len(results)} 個配置")
    
    if blinds_effects:
        print("\n🎯 會產生百葉窗效果的參數組合:")
        for i, effect in enumerate(blinds_effects, 1):
            print(f"\n{i}. {effect['config_name']}")
            print(f"   參數:")
            params = effect['params']
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
    
    if smooth_effects:
        print(f"\n✅ 產生平滑邊界的參數組合:")
        for i, smooth in enumerate(smooth_effects, 1):
            print(f"   {i}. {smooth['config_name']}")
    
    # 保存詳細結果到文件
    with open('nnpu_blinds_effect_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 詳細結果已保存到: nnpu_blinds_effect_results.json")
    
    return results

def visualize_blinds_effect():
    """可視化百葉窗效果"""
    
    print("\n🎨 生成百葉窗效果可視化...")
    
    # 選擇一個會產生百葉窗效果的配置
    blinds_config = {
        "distribution": "two_moons",
        "dims": 2,
        "n_p": 50,
        "n_u": 300,
        "prior": 0.3,
        "activation": "relu",
        "n_epochs": 100,
        "learning_rate": 0.1,  # 高學習率
        "hidden_dim": 10,      # 低隱藏層維度
        "weight_decay": 0.0
    }
    
    result = test_parameter_combination(**blinds_config)
    
    if result and result.get('success'):
        # 提取數據
        p_samples = result['visualization']['p_samples']
        u_samples = result['visualization']['u_samples']
        decision_boundary = result['visualization']['decision_boundary']
        
        # 創建圖表
        plt.figure(figsize=(12, 8))
        
        # 繪製樣本點
        p_x, p_y = zip(*p_samples)
        u_x, u_y = zip(*u_samples)
        
        plt.scatter(p_x, p_y, c='red', s=50, alpha=0.7, label='正樣本 (P)')
        plt.scatter(u_x, u_y, c='gray', s=30, alpha=0.5, label='未標記樣本 (U)')
        
        # 繪製決策邊界
        boundary_x, boundary_y = zip(*decision_boundary)
        plt.plot(boundary_x, boundary_y, 'b-', linewidth=2, label='決策邊界')
        
        # 分析決策邊界
        analysis = analyze_decision_boundary(decision_boundary)
        
        plt.title(f'nnPU 百葉窗效果示例\n'
                 f'平滑度: {analysis["smoothness"]:.3f}, '
                 f'振盪次數: {analysis["oscillations"]}, '
                 f'百葉窗分數: {analysis["blinds_score"]}')
        plt.xlabel('X 座標')
        plt.ylabel('Y 座標')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # 保存圖片
        plt.savefig('nnpu_blinds_effect_visualization.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ 可視化圖片已保存: nnpu_blinds_effect_visualization.png")

if __name__ == "__main__":
    # 執行測試
    results = test_blinds_effect_parameters()
    
    # 生成可視化
    visualize_blinds_effect()
    
    print("\n🎯 測試完成！") 
