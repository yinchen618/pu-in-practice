#!/usr/bin/env p            self.base_config = {
            "algorithm": "nnPU",
            "data_params": {
                "distribution": "gaussian",
                "dims": 8,         # 使用8維（最佳平衡點）
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "noise_level": 0.8,  # 新增噪音控制
                "center_dist": 2.0   # 新增中心距離控制
            },
            "model_params": {
                "activation": "relu",
                "n_epochs": 30,      # 30輪足夠
                "learning_rate": 0.01, # 較大學習率效果更好
                "hidden_dim": 200,    # 大模型效果好
                "weight_decay": 0.0001 # 輕微正則化
            }數詳細分析
測試各種參數組合並分析其合理性
"""
import requests
import numpy as np
import json
from typing import Dict, List, Tuple
import time
from tabulate import tabulate
from collections import defaultdict

class ParameterAnalyzer:
    def __init__(self):
        self.url = "http://localhost:8000/api/pu-learning/run-simulation"
        self.base_config = {
            "algorithm": "nnPU",
            "data_params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3
            },
            "model_params": {
                "activation": "relu",
                "n_epochs": 50,
                "learning_rate": 0.001,
                "hidden_dim": 200,
                "weight_decay": 0.005
            }
        }
        
    def run_experiment(self, **kwargs) -> Dict:
        """運行單次實驗"""
        config = self.base_config.copy()
        for k, v in kwargs.items():
            if k.startswith('data_'):
                config['data_params'][k[5:]] = v
            elif k.startswith('model_'):
                config['model_params'][k[6:]] = v
        
        try:
            response = requests.post(self.url, json=config, timeout=30)
            if response.status_code == 200:
                data = response.json()
                return {
                    'error_rate': data['metrics']['error_rate'],
                    'estimated_prior': data['metrics']['estimated_prior'],
                    'prior_error': abs(data['metrics']['estimated_prior'] - config['data_params']['prior'])
                }
            else:
                return None
        except Exception as e:
            print(f"實驗失敗: {e}")
            return None
    
    def analyze_parameter(self, param_name: str, values: List, n_repeats: int = 3) -> Dict:
        """分析單個參數的影響"""
        results = defaultdict(list)
        
        print(f"\n🔍 分析參數: {param_name}")
        print("="*60)
        
        for value in values:
            print(f"測試 {param_name} = {value}")
            for i in range(n_repeats):
                result = self.run_experiment(**{param_name: value})
                if result:
                    results[value].append(result)
                time.sleep(0.1)  # 避免請求過快
        
        # 計算統計數據
        stats = {}
        for value in values:
            if results[value]:
                error_rates = [r['error_rate'] for r in results[value]]
                prior_errors = [r['prior_error'] for r in results[value]]
                
                stats[value] = {
                    'mean_error': np.mean(error_rates),
                    'std_error': np.std(error_rates),
                    'mean_prior_error': np.mean(prior_errors),
                    'std_prior_error': np.std(prior_errors)
                }
        
        return stats
    
    def analyze_all_parameters(self):
        """分析所有重要參數"""
        parameters = {
            'model_hidden_dim': [32, 64, 128, 200, 256],
            'model_weight_decay': [0, 0.0001, 0.001, 0.005, 0.01],
            'data_dims': [2, 4, 8, 16],
            'model_n_epochs': [30, 50, 100],
            'model_learning_rate': [0.0001, 0.001, 0.01]
        }
        
        all_results = {}
        for param_name, values in parameters.items():
            all_results[param_name] = self.analyze_parameter(param_name, values)
            self.print_parameter_analysis(param_name, all_results[param_name])
        
        return all_results
    
    def print_parameter_analysis(self, param_name: str, stats: Dict):
        """打印參數分析結果"""
        print(f"\n📊 {param_name} 分析結果:")
        print("="*60)
        
        headers = ["值", "錯誤率 (mean ± std)", "先驗誤差 (mean ± std)"]
        rows = []
        
        for value, stat in stats.items():
            rows.append([
                value,
                f"{stat['mean_error']*100:.1f}% ± {stat['std_error']*100:.1f}%",
                f"{stat['mean_prior_error']:.3f} ± {stat['std_prior_error']:.3f}"
            ])
        
        print(tabulate(rows, headers=headers, tablefmt="grid"))
        
        # 找出最佳值
        best_error = min(stats.items(), key=lambda x: x[1]['mean_error'])
        best_prior = min(stats.items(), key=lambda x: x[1]['mean_prior_error'])
        
        print(f"\n🏆 最佳值:")
        print(f"   • 錯誤率最低: {best_error[0]} ({best_error[1]['mean_error']*100:.1f}%)")
        print(f"   • 先驗估計最準: {best_prior[0]} ({best_prior[1]['mean_prior_error']:.3f})")
        
        # 穩定性分析
        stability = {v: s['std_error'] for v, s in stats.items()}
        most_stable = min(stability.items(), key=lambda x: x[1])
        print(f"   • 最穩定值: {most_stable[0]} (std={most_stable[1]*100:.1f}%)")

def main():
    print("🧪 開始高斯分布詳細參數分析")
    print("="*80)
    print("目標: 找出最優且穩定的參數組合")
    
    analyzer = ParameterAnalyzer()
    results = analyzer.analyze_all_parameters()
    
    # 總結
    print("\n📋 分析總結")
    print("="*80)
    
    # 計算每個參數的綜合得分 (考慮錯誤率、先驗準確度和穩定性)
    best_params = {}
    for param_name, stats in results.items():
        scores = {}
        for value, stat in stats.items():
            # 綜合得分 = 0.6 * 錯誤率 + 0.3 * 先驗誤差 + 0.1 * 穩定性
            score = (0.6 * stat['mean_error'] + 
                    0.3 * stat['mean_prior_error'] + 
                    0.1 * stat['std_error'])
            scores[value] = score
        
        best_value = min(scores.items(), key=lambda x: x[1])[0]
        best_params[param_name] = best_value
    
    print("推薦配置:")
    for param, value in best_params.items():
        print(f"   • {param}: {value}")
    
    # 驗證最佳組合
    print("\n🔍 驗證最佳組合")
    print("="*60)
    
    analyzer = ParameterAnalyzer()
    final_results = []
    for _ in range(5):
        result = analyzer.run_experiment(**best_params)
        if result:
            final_results.append(result)
    
    if final_results:
        mean_error = np.mean([r['error_rate'] for r in final_results])
        std_error = np.std([r['error_rate'] for r in final_results])
        mean_prior = np.mean([r['prior_error'] for r in final_results])
        std_prior = np.std([r['prior_error'] for r in final_results])
        
        print(f"最終性能 (5次測試平均):")
        print(f"   • 錯誤率: {mean_error*100:.1f}% ± {std_error*100:.1f}%")
        print(f"   • 先驗誤差: {mean_prior:.3f} ± {std_prior:.3f}")
        
        if mean_error < 0.1 and std_error < 0.02:
            print("✅ 找到穩定且良好的配置!")
        else:
            print("⚠️  配置性能或穩定性有待改進")

if __name__ == "__main__":
    main()
