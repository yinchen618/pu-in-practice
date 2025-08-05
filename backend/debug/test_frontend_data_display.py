#!/usr/bin/env python3
"""
測試前端是否正確顯示後端回傳的數據
"""

import requests
import json

def test_frontend_data_display():
    """測試前端數據顯示"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 測試配置
    test_config = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "gaussian",
            "dims": 8,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.01,
            "hidden_dim": 200,
            "weight_decay": 0.005
        }
    }
    
    print("🧪 測試前端數據顯示")
    print("="*60)
    
    try:
        # 發送請求到後端
        response = requests.post(url, json=test_config, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 後端返回成功")
            
            # 檢查數據結構
            print("\n📊 檢查數據結構:")
            
            # 檢查 visualization 數據
            if 'visualization' in result:
                viz = result['visualization']
                print(f"✅ visualization 存在")
                print(f"   • p_samples: {len(viz.get('p_samples', []))} 個點")
                print(f"   • u_samples: {len(viz.get('u_samples', []))} 個點")
                print(f"   • decision_boundary: {len(viz.get('decision_boundary', []))} 個點")
                
                # 檢查數據格式
                if viz.get('p_samples'):
                    sample_point = viz['p_samples'][0]
                    print(f"   • p_samples 格式: {type(sample_point)} - {sample_point}")
                
                if viz.get('u_samples'):
                    sample_point = viz['u_samples'][0]
                    print(f"   • u_samples 格式: {type(sample_point)} - {sample_point}")
                    
            else:
                print("❌ visualization 缺失")
            
            # 檢查 metrics 數據
            if 'metrics' in result:
                metrics = result['metrics']
                print(f"✅ metrics 存在")
                print(f"   • estimated_prior: {metrics.get('estimated_prior')}")
                print(f"   • error_rate: {metrics.get('error_rate')}")
                print(f"   • risk_curve: {len(metrics.get('risk_curve', []))} 個點")
                
                # 檢查 risk_curve 格式
                if metrics.get('risk_curve'):
                    sample_risk = metrics['risk_curve'][0]
                    print(f"   • risk_curve 格式: {type(sample_risk)} - {sample_risk}")
            else:
                print("❌ metrics 缺失")
            
            # 檢查前端期望的格式
            print("\n🔍 檢查前端期望格式:")
            
            # 模擬前端數據轉換
            frontend_result = {
                "visualization": {
                    "pSamples": [{"x": point[0], "y": point[1], "label": "P"} for point in result['visualization']['p_samples']],
                    "uSamples": [{"x": point[0], "y": point[1], "label": "U"} for point in result['visualization']['u_samples']],
                    "decisionBoundary": result['visualization']['decision_boundary']
                },
                "metrics": {
                    "estimatedPrior": result['metrics']['estimated_prior'],
                    "errorRate": result['metrics']['error_rate'],
                    "riskCurve": result['metrics']['risk_curve']
                }
            }
            
            print("✅ 前端數據轉換成功")
            print(f"   • pSamples 格式: {type(frontend_result['visualization']['pSamples'][0])}")
            print(f"   • uSamples 格式: {type(frontend_result['visualization']['uSamples'][0])}")
            
            # 檢查數據範圍
            print("\n📈 檢查數據範圍:")
            p_samples = result['visualization']['p_samples']
            u_samples = result['visualization']['u_samples']
            
            if p_samples:
                p_x = [p[0] for p in p_samples]
                p_y = [p[1] for p in p_samples]
                print(f"   • P samples X 範圍: {min(p_x):.2f} - {max(p_x):.2f}")
                print(f"   • P samples Y 範圍: {min(p_y):.2f} - {max(p_y):.2f}")
            
            if u_samples:
                u_x = [u[0] for u in u_samples]
                u_y = [u[1] for u in u_samples]
                print(f"   • U samples X 範圍: {min(u_x):.2f} - {max(u_x):.2f}")
                print(f"   • U samples Y 範圍: {min(u_y):.2f} - {max(u_y):.2f}")
            
            # 檢查決策邊界
            if result['visualization'].get('decision_boundary'):
                db = result['visualization']['decision_boundary']
                db_x = [d[0] for d in db]
                db_y = [d[1] for d in db]
                print(f"   • Decision Boundary X 範圍: {min(db_x):.2f} - {max(db_x):.2f}")
                print(f"   • Decision Boundary Y 範圍: {min(db_y):.2f} - {max(db_y):.2f}")
            
            print("\n✅ 數據顯示測試完成")
            print("前端應該能夠正確顯示這些數據")
            
        else:
            print(f"❌ 後端請求失敗: {response.status_code}")
            print(f"錯誤信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 測試異常: {e}")

if __name__ == "__main__":
    test_frontend_data_display() 
