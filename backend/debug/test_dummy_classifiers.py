#!/usr/bin/env python3
"""
虛擬分類器單元測試
用於測試錯誤率計算函式的正確性

測試一：使用「全負分類器」(Always Negative Classifier)
測試二：使用「全正分類器」(Always Positive Classifier)
"""

import numpy as np
import sys
import os

# 添加後端路徑
backend_dir = os.path.dirname(os.path.abspath(__file__))
pu_learning_dir = os.path.join(backend_dir, 'pu-learning')
if pu_learning_dir not in sys.path:
    sys.path.append(pu_learning_dir)

from data_generator import generate_synthetic_data
from typing import Tuple, Dict, Any

class DummyDataParams:
    """虛擬數據參數類"""
    def __init__(self, prior: float = 0.3):
        self.distribution = 'two_moons'
        self.dims = 2
        self.n_p = 100
        self.n_u = 300
        self.prior = prior

class AlwaysNegativeClassifier:
    """永遠預測為負的虛擬分類器"""
    
    def predict(self, X):
        """永遠返回 0 (負類)"""
        return np.zeros(len(X))
    
    def decision_function(self, X):
        """決策函數，永遠返回負值"""
        return np.full(len(X), -1.0)

class AlwaysPositiveClassifier:
    """永遠預測為正的虛擬分類器"""
    
    def predict(self, X):
        """永遠返回 1 (正類)"""
        return np.ones(len(X))
    
    def decision_function(self, X):
        """決策函數，永遠返回正值"""
        return np.full(len(X), 1.0)

def generate_balanced_test_set(n_positive: int = 200, n_negative: int = 200) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    生成一個真正平衡的測試集
    
    Args:
        n_positive: 正樣本數量
        n_negative: 負樣本數量
    
    Returns:
        X_test: 測試特徵
        y_test: 測試標籤 (1 為正，0 為負)
        labels: 樣本標籤描述
    """
    print(f"🔧 生成平衡測試集...")
    print(f"   • 正樣本數量: {n_positive}")
    print(f"   • 負樣本數量: {n_negative}")
    
    # 分別生成足夠的正樣本和負樣本
    # 先生成一個大的數據集，然後分離正負樣本
    
    # 生成多組數據來收集足夠的樣本
    all_pos_samples = []
    all_neg_samples = []
    
    # 多次生成直到有足夠的樣本
    for seed in range(0, 10):  # 最多嘗試10次
        np.random.seed(42 + seed)  # 不同的隨機種子
        
        xp, xu, xt_p, xt_n = generate_synthetic_data(
            distribution='two_moons',
            dims=2,
            n_p=100,  # 不重要
            n_u=200,  # 不重要
            prior=0.3,  # 不重要
            n_test=500  # 大量測試樣本
        )
        
        all_pos_samples.append(xt_p)
        all_neg_samples.append(xt_n)
        
        # 檢查是否已經有足夠的樣本
        total_pos = sum(len(samples) for samples in all_pos_samples)
        total_neg = sum(len(samples) for samples in all_neg_samples)
        
        if total_pos >= n_positive and total_neg >= n_negative:
            break
    
    # 合併所有樣本
    if all_pos_samples:
        combined_pos = np.vstack(all_pos_samples)
    else:
        combined_pos = np.array([]).reshape(0, 2)
        
    if all_neg_samples:
        combined_neg = np.vstack(all_neg_samples)
    else:
        combined_neg = np.array([]).reshape(0, 2)
    
    # 檢查樣本數量
    if len(combined_pos) < n_positive:
        print(f"   ⚠️  可用正樣本不足，實際: {len(combined_pos)}, 需要: {n_positive}")
        n_positive = len(combined_pos)
    
    if len(combined_neg) < n_negative:
        print(f"   ⚠️  可用負樣本不足，實際: {len(combined_neg)}, 需要: {n_negative}")
        n_negative = len(combined_neg)
    
    # 隨機選取指定數量的樣本
    np.random.seed(42)  # 固定種子確保可重現
    
    pos_indices = np.random.choice(len(combined_pos), n_positive, replace=False)
    neg_indices = np.random.choice(len(combined_neg), n_negative, replace=False)
    
    x_pos_selected = combined_pos[pos_indices]
    x_neg_selected = combined_neg[neg_indices]
    
    # 組合測試集
    X_test = np.vstack([x_pos_selected, x_neg_selected])
    y_test = np.hstack([np.ones(n_positive), np.zeros(n_negative)])
    
    # 創建標籤描述
    labels = ['P'] * n_positive + ['N'] * n_negative
    
    print(f"   ✅ 測試集生成完成:")
    print(f"      • 最終正樣本數: {n_positive}")
    print(f"      • 最終負樣本數: {n_negative}")
    print(f"      • 測試集大小: {len(X_test)}")
    print(f"      • 正樣本比例: {n_positive/(n_positive+n_negative)*100:.1f}%")
    
    return X_test, y_test, labels

def calculate_error_rate(y_true: np.ndarray, y_pred: np.ndarray, prior: float) -> Dict[str, float]:
    """
    計算錯誤率，使用與主系統相同的邏輯
    
    Args:
        y_true: 真實標籤 (1 為正，0 為負)
        y_pred: 預測標籤 (1 為正，0 為負)
        prior: 類別先驗機率
    
    Returns:
        包含各種錯誤率指標的字典
    """
    # 分離正負樣本
    positive_mask = y_true == 1
    negative_mask = y_true == 0
    
    true_positive = y_true[positive_mask]
    true_negative = y_true[negative_mask]
    pred_positive = y_pred[positive_mask]
    pred_negative = y_pred[negative_mask]
    
    # 計算正確和錯誤的預測數量
    correct_p = np.sum(pred_positive > 0)  # 正確預測為正 (True Positive)
    incorrect_p = np.sum(pred_positive <= 0)  # 錯誤預測為負 (False Negative)
    correct_n = np.sum(pred_negative <= 0)  # 正確預測為負 (True Negative)
    incorrect_n = np.sum(pred_negative > 0)  # 錯誤預測為正 (False Positive)
    
    # 計算錯誤率
    fn_rate = incorrect_p / len(true_positive) if len(true_positive) > 0 else 0
    fp_rate = incorrect_n / len(true_negative) if len(true_negative) > 0 else 0
    
    # 使用先驗加權的錯誤率
    weighted_error_rate = prior * fn_rate + (1 - prior) * fp_rate
    
    # 總體錯誤率
    total_correct = correct_p + correct_n
    total_samples = len(y_true)
    overall_error_rate = 1 - (total_correct / total_samples)
    
    return {
        'true_positive': correct_p,
        'false_negative': incorrect_p,
        'true_negative': correct_n,
        'false_positive': incorrect_n,
        'fn_rate': fn_rate,
        'fp_rate': fp_rate,
        'weighted_error_rate': weighted_error_rate,
        'overall_error_rate': overall_error_rate,
        'total_positive': len(true_positive),
        'total_negative': len(true_negative),
        'total_samples': total_samples
    }

def test_always_negative_classifier():
    """測試一：永遠預測為負的分類器"""
    print("="*80)
    print("🧪 測試一：Always Negative Classifier (永遠預測為負)")
    print("="*80)
    
    # 生成平衡測試集
    X_test, y_test, labels = generate_balanced_test_set(200, 200)
    
    # 創建永遠預測為負的分類器
    classifier = AlwaysNegativeClassifier()
    
    # 進行預測
    y_pred = classifier.predict(X_test)
    
    print(f"\n📊 預測結果分析:")
    print(f"   • 預測標籤唯一值: {np.unique(y_pred)}")
    print(f"   • 所有預測都是: {y_pred[0]} (負類)")
    
    # 計算錯誤率 (使用平衡數據，所以 prior = 0.5)
    prior = 0.5  # 平衡數據集
    results = calculate_error_rate(y_test, y_pred, prior)
    
    print(f"\n📈 錯誤率計算結果:")
    print(f"   • 真實正樣本數: {results['total_positive']}")
    print(f"   • 真實負樣本數: {results['total_negative']}")
    print(f"   • True Positive (TP): {results['true_positive']}")
    print(f"   • False Negative (FN): {results['false_negative']}")
    print(f"   • True Negative (TN): {results['true_negative']}")
    print(f"   • False Positive (FP): {results['false_positive']}")
    
    print(f"\n📊 錯誤率指標:")
    print(f"   • False Negative Rate (FNR): {results['fn_rate']:.4f} ({results['fn_rate']*100:.1f}%)")
    print(f"   • False Positive Rate (FPR): {results['fp_rate']:.4f} ({results['fp_rate']*100:.1f}%)")
    print(f"   • 加權錯誤率 (π*FNR + (1-π)*FPR): {results['weighted_error_rate']:.4f} ({results['weighted_error_rate']*100:.1f}%)")
    print(f"   • 總體錯誤率: {results['overall_error_rate']:.4f} ({results['overall_error_rate']*100:.1f}%)")
    
    print(f"\n🎯 預期 vs 實際:")
    print(f"   • 理論預期錯誤率: 50% (分類器會答錯所有正樣本，答對所有負樣本)")
    print(f"   • 實際計算錯誤率: {results['overall_error_rate']*100:.1f}%")
    
    if abs(results['overall_error_rate'] - 0.5) < 0.05:
        print(f"   ✅ 錯誤率計算正確！")
    else:
        print(f"   ❌ 錯誤率計算異常！")
    
    return results

def test_always_positive_classifier():
    """測試二：永遠預測為正的分類器"""
    print("\n" + "="*80)
    print("🧪 測試二：Always Positive Classifier (永遠預測為正)")
    print("="*80)
    
    # 使用相同的測試集
    X_test, y_test, labels = generate_balanced_test_set(200, 200)
    
    # 創建永遠預測為正的分類器
    classifier = AlwaysPositiveClassifier()
    
    # 進行預測
    y_pred = classifier.predict(X_test)
    
    print(f"\n📊 預測結果分析:")
    print(f"   • 預測標籤唯一值: {np.unique(y_pred)}")
    print(f"   • 所有預測都是: {y_pred[0]} (正類)")
    
    # 計算錯誤率
    prior = 0.5  # 平衡數據集
    results = calculate_error_rate(y_test, y_pred, prior)
    
    print(f"\n📈 錯誤率計算結果:")
    print(f"   • 真實正樣本數: {results['total_positive']}")
    print(f"   • 真實負樣本數: {results['total_negative']}")
    print(f"   • True Positive (TP): {results['true_positive']}")
    print(f"   • False Negative (FN): {results['false_negative']}")
    print(f"   • True Negative (TN): {results['true_negative']}")
    print(f"   • False Positive (FP): {results['false_positive']}")
    
    print(f"\n📊 錯誤率指標:")
    print(f"   • False Negative Rate (FNR): {results['fn_rate']:.4f} ({results['fn_rate']*100:.1f}%)")
    print(f"   • False Positive Rate (FPR): {results['fp_rate']:.4f} ({results['fp_rate']*100:.1f}%)")
    print(f"   • 加權錯誤率 (π*FNR + (1-π)*FPR): {results['weighted_error_rate']:.4f} ({results['weighted_error_rate']*100:.1f}%)")
    print(f"   • 總體錯誤率: {results['overall_error_rate']:.4f} ({results['overall_error_rate']*100:.1f}%)")
    
    print(f"\n🎯 預期 vs 實際:")
    print(f"   • 理論預期錯誤率: 50% (分類器會答對所有正樣本，答錯所有負樣本)")
    print(f"   • 實際計算錯誤率: {results['overall_error_rate']*100:.1f}%")
    
    if abs(results['overall_error_rate'] - 0.5) < 0.05:
        print(f"   ✅ 錯誤率計算正確！")
    else:
        print(f"   ❌ 錯誤率計算異常！")
    
    return results

def run_comprehensive_tests():
    """運行全面的虛擬分類器測試"""
    print("🚀 開始虛擬分類器單元測試")
    print("目的：驗證錯誤率計算函式的正確性")
    print("="*80)
    
    try:
        # 測試一：Always Negative Classifier
        results_negative = test_always_negative_classifier()
        
        # 測試二：Always Positive Classifier  
        results_positive = test_always_positive_classifier()
        
        # 總結分析
        print("\n" + "="*80)
        print("📋 測試總結報告")
        print("="*80)
        
        print(f"\n🧪 測試一結果 (Always Negative):")
        print(f"   • 計算的錯誤率: {results_negative['overall_error_rate']*100:.1f}%")
        print(f"   • 預期錯誤率: 50.0%")
        print(f"   • 誤差: {abs(results_negative['overall_error_rate'] - 0.5)*100:.1f}%")
        
        print(f"\n🧪 測試二結果 (Always Positive):")
        print(f"   • 計算的錯誤率: {results_positive['overall_error_rate']*100:.1f}%")
        print(f"   • 預期錯誤率: 50.0%")
        print(f"   • 誤差: {abs(results_positive['overall_error_rate'] - 0.5)*100:.1f}%")
        
        # 驗證測試結果
        test1_passed = abs(results_negative['overall_error_rate'] - 0.5) < 0.05
        test2_passed = abs(results_positive['overall_error_rate'] - 0.5) < 0.05
        
        print(f"\n🎯 測試結果驗證:")
        print(f"   • 測試一 (Always Negative): {'✅ 通過' if test1_passed else '❌ 失敗'}")
        print(f"   • 測試二 (Always Positive): {'✅ 通過' if test2_passed else '❌ 失敗'}")
        
        if test1_passed and test2_passed:
            print(f"\n🎉 所有測試通過！錯誤率計算函式工作正常。")
            print(f"✅ 錯誤率計算邏輯已驗證無誤")
        else:
            print(f"\n❌ 測試失敗！錯誤率計算函式存在問題。")
            print(f"⚠️  需要檢查錯誤率計算的實現邏輯")
            
        # 額外分析
        print(f"\n📊 詳細分析:")
        print(f"   • FNR 應該為: Always Negative=1.0, Always Positive=0.0")
        print(f"   • FPR 應該為: Always Negative=0.0, Always Positive=1.0")
        print(f"   • 實際 FNR: Always Negative={results_negative['fn_rate']:.3f}, Always Positive={results_positive['fn_rate']:.3f}")
        print(f"   • 實際 FPR: Always Negative={results_negative['fp_rate']:.3f}, Always Positive={results_positive['fp_rate']:.3f}")
        
    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤:")
        print(f"   錯誤類型: {type(e).__name__}")
        print(f"   錯誤訊息: {str(e)}")
        import traceback
        print(f"   詳細堆疊:")
        traceback.print_exc()

if __name__ == "__main__":
    run_comprehensive_tests()
