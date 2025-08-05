#!/usr/bin/env python3
"""
深度診斷PU Learning錯誤率過高問題
檢查數據生成、模型訓練、錯誤率計算的每個環節
"""
import sys
import os
sys.path.append('pu-learning')

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, classification_report
from data_generator import generate_synthetic_data
from pulearning_engine import run_pu_simulation, MLPClassifier

def diagnose_data_generation():
    """診斷數據生成是否正確"""
    print("🔍 Step 1: 診斷數據生成")
    print("="*50)
    
    # 生成數據
    xp, xu, xt_p, xt_n = generate_synthetic_data(
        distribution='two_moons',
        dims=2,
        n_p=50,
        n_u=300,
        prior=0.3,
        n_test=1000
    )
    
    print(f"📊 數據統計:")
    print(f"   • 正樣本 (xp): {xp.shape}")
    print(f"   • 未標記樣本 (xu): {xu.shape}")
    print(f"   • 測試正樣本 (xt_p): {xt_p.shape}")
    print(f"   • 測試負樣本 (xt_n): {xt_n.shape}")
    
    # 檢查測試集比例
    total_test = len(xt_p) + len(xt_n)
    actual_prior = len(xt_p) / total_test
    print(f"   • 期望測試集 prior: 0.3")
    print(f"   • 實際測試集 prior: {actual_prior:.3f}")
    
    # 檢查未標記樣本的真實組成
    # 這需要我們知道xu中哪些是正樣本，哪些是負樣本
    
    return xp, xu, xt_p, xt_n

def diagnose_model_performance(xp, xu, xt_p, xt_n):
    """診斷模型性能"""
    print("\n🔍 Step 2: 診斷模型性能")
    print("="*50)
    
    # 準備測試數據和標籤
    X_test = np.vstack([xt_p, xt_n])
    y_test = np.hstack([np.ones(len(xt_p)), np.zeros(len(xt_n))])
    
    print(f"📊 測試集統計:")
    print(f"   • 測試樣本總數: {len(X_test)}")
    print(f"   • 正樣本數: {np.sum(y_test == 1)}")
    print(f"   • 負樣本數: {np.sum(y_test == 0)}")
    print(f"   • 正樣本比例: {np.mean(y_test):.3f}")
    
    # 測試簡單基線模型
    print(f"\n🏗️  測試基線模型:")
    
    # 1. 隨機分類器
    random_pred = np.random.binomial(1, 0.5, len(y_test))
    random_acc = accuracy_score(y_test, random_pred)
    print(f"   • 隨機分類器準確率: {random_acc:.3f} (錯誤率: {1-random_acc:.3f})")
    
    # 2. 總是預測多數類
    majority_pred = np.zeros(len(y_test))  # 假設負樣本是多數
    majority_acc = accuracy_score(y_test, majority_pred)
    print(f"   • 多數類分類器準確率: {majority_acc:.3f} (錯誤率: {1-majority_acc:.3f})")
    
    return X_test, y_test

def diagnose_supervised_baseline(xp, xu, xt_p, xt_n):
    """用監督學習建立基線"""
    print("\n🔍 Step 3: 監督學習基線")
    print("="*50)
    
    # 假設我們知道xu中的真實標籤（這只是為了診斷）
    # 重新生成數據以獲得真實標籤
    np.random.seed(42)
    from sklearn.datasets import make_moons
    
    total_samples = 50 + 300 + 2000  # n_p + n_u + 2*n_test
    X_all, y_all = make_moons(n_samples=total_samples, noise=0.1, random_state=42)
    
    # 分離樣本
    pos_indices = np.where(y_all == 1)[0]
    neg_indices = np.where(y_all == 0)[0]
    
    # 訓練數據：正樣本 + 一部分未標記樣本（模擬完全監督）
    X_train = X_all[:350]  # 前350個樣本作為訓練
    y_train = y_all[:350]
    
    # 測試數據
    X_test = np.vstack([xt_p, xt_n])
    y_test = np.hstack([np.ones(len(xt_p)), np.zeros(len(xt_n))])
    
    print(f"📊 監督學習設置:")
    print(f"   • 訓練樣本: {len(X_train)}")
    print(f"   • 訓練正樣本: {np.sum(y_train == 1)}")
    print(f"   • 訓練負樣本: {np.sum(y_train == 0)}")
    
    # 訓練簡單的神經網路
    device = torch.device('cpu')
    model = MLPClassifier(input_dim=2, hidden_dim=64)
    model.to(device)
    
    # 轉換為張量
    X_train_tensor = torch.FloatTensor(X_train).to(device)
    y_train_tensor = torch.FloatTensor(y_train).to(device)
    X_test_tensor = torch.FloatTensor(X_test).to(device)
    
    # 訓練
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCEWithLogitsLoss()
    
    model.train()
    for epoch in range(100):
        optimizer.zero_grad()
        outputs = model(X_train_tensor)
        loss = criterion(outputs.squeeze(), y_train_tensor)
        loss.backward()
        optimizer.step()
        
        if epoch % 20 == 0:
            print(f"   Epoch {epoch}, Loss: {loss.item():.4f}")
    
    # 測試
    model.eval()
    with torch.no_grad():
        test_outputs = model(X_test_tensor)
        test_probs = torch.sigmoid(test_outputs).squeeze()
        test_pred = (test_probs > 0.5).cpu().numpy()
    
    sup_acc = accuracy_score(y_test, test_pred)
    print(f"\n✅ 監督學習結果:")
    print(f"   • 準確率: {sup_acc:.3f}")
    print(f"   • 錯誤率: {1-sup_acc:.3f}")
    
    if 1-sup_acc < 0.05:
        print("   ✅ 監督學習錯誤率正常 (<5%)")
        return True
    else:
        print("   ⚠️  監督學習錯誤率過高，可能是數據本身的問題")
        return False

def main():
    """主診斷流程"""
    print("🏥 PU Learning 深度診斷")
    print("="*80)
    
    # Step 1: 檢查數據生成
    xp, xu, xt_p, xt_n = diagnose_data_generation()
    
    # Step 2: 檢查模型性能
    X_test, y_test = diagnose_model_performance(xp, xu, xt_p, xt_n)
    
    # Step 3: 監督學習基線
    supervised_ok = diagnose_supervised_baseline(xp, xu, xt_p, xt_n)
    
    print("\n" + "="*80)
    print("📋 診斷總結:")
    
    if supervised_ok:
        print("✅ 數據和基本模型都正常")
        print("💡 問題可能在PU Learning算法實現或參數配置")
    else:
        print("⚠️  基礎監督學習就有問題")
        print("💡 需要檢查數據生成或模型架構")
    
    # 最後測試當前的PU Learning配置
    print("\n🔍 Step 4: 測試當前PU Learning配置")
    print("="*50)
    
    try:
        # 模擬API請求格式
        class MockRequest:
            def __init__(self):
                self.algorithm = "nnPU"
                self.data_params = MockDataParams()
                self.model_params = MockModelParams()
        
        class MockDataParams:
            def __init__(self):
                self.distribution = "two_moons"
                self.dims = 2
                self.n_p = 50
                self.n_u = 300
                self.prior = 0.3
        
        class MockModelParams:
            def __init__(self):
                self.activation = "relu"
                self.n_epochs = 50
                self.learning_rate = 0.001
                self.hidden_dim = 200  # 使用之前找到的最佳配置
                self.weight_decay = 0.005
        
        request = MockRequest()
        results = run_pu_simulation(request)
        
        pu_error = results['metrics']['error_rate']
        pu_prior = results['metrics']['estimated_prior']
        
        print(f"📊 PU Learning結果:")
        print(f"   • 錯誤率: {pu_error:.3f} ({pu_error*100:.1f}%)")
        print(f"   • 估計先驗: {pu_prior:.3f}")
        print(f"   • 真實先驗: 0.3")
        
        if pu_error < 0.05:
            print("✅ PU Learning性能正常")
        else:
            print("⚠️  PU Learning錯誤率仍然過高")
            
    except Exception as e:
        print(f"❌ PU Learning測試失敗: {e}")

if __name__ == "__main__":
    main()
