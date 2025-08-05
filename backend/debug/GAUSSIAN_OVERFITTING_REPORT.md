# 高斯分布過擬合測試報告

## 測試概述

本次測試針對 nnPU 演算法使用高斯分布數據，重點測試可能導致過擬合和百葉窗效果的參數組合。所有圖片都使用純英文標籤，解決了中文字體顯示問題。

## 測試配置

### 基礎參數設定
- **數據分布**: Gaussian（高斯分布）
- **激活函數**: ReLU
- **神經元數量**: 200-500（更多神經元）
- **正規化**: 無（weight_decay = 0.0）
- **學習率**: 0.3-0.9（極高學習率）
- **訓練輪數**: 100 epochs

### 測試的參數組合

1. **Gaussian_Extreme_LearningRate_ManyNeurons_NoReg**
   - 學習率: 0.5, 隱藏層: 200, 先驗: 0.3
   - 結果: 百葉窗分數 1, 振盪次數 18, 無明顯百葉窗效果

2. **Gaussian_Extreme_LearningRate_MoreNeurons_NoReg**
   - 學習率: 0.8, 隱藏層: 300, 先驗: 0.3
   - 結果: 百葉窗分數 1, 振盪次數 2, 無明顯百葉窗效果

3. **Gaussian_HighLearningRate_ExtremeNeurons_NoReg**
   - 學習率: 0.3, 隱藏層: 500, 先驗: 0.3
   - 結果: 百葉窗分數 1, 振盪次數 4, 無明顯百葉窗效果

4. **Gaussian_Extreme_LearningRate_ManyNeurons_LowPrior**
   - 學習率: 0.6, 隱藏層: 200, 先驗: 0.2
   - 結果: 百葉窗分數 1, 振盪次數 1, 無明顯百葉窗效果

5. **Gaussian_HighLearningRate_ManyNeurons_HighPrior**
   - 學習率: 0.4, 隱藏層: 200, 先驗: 0.4
   - 結果: 百葉窗分數 1, 振盪次數 24, 無明顯百葉窗效果

6. **Gaussian_Extreme_LearningRate_MoreNeurons_Imbalanced**
   - 學習率: 0.7, 隱藏層: 300, P:30, U:400, 先驗: 0.3
   - 結果: 百葉窗分數 1, 振盪次數 9, 無明顯百葉窗效果

7. **Gaussian_HighLearningRate_ExtremeNeurons_ExtremeImbalanced**
   - 學習率: 0.3, 隱藏層: 500, P:20, U:500, 先驗: 0.3
   - 結果: 百葉窗分數 1, 振盪次數 1, 無明顯百葉窗效果

8. **Gaussian_Extreme_LearningRate_ManyNeurons_ExtremeLowPrior**
   - 學習率: 0.9, 隱藏層: 200, 先驗: 0.1
   - 結果: 百葉窗分數 1, 振盪次數 1, 無明顯百葉窗效果

## 關鍵發現

### 📊 測試結果分析

1. **高斯分布的特性**: 相比複雜分布，高斯分布產生的決策邊界更加平滑
2. **振盪次數變化**: 不同配置的振盪次數從 1 到 24 不等
3. **平滑度指標**: 大部分配置的平滑度都在 0.97-0.999 之間
4. **百葉窗效果**: 所有配置都沒有達到明顯的百葉窗效果標準（分數 < 2）

### 🎯 最有趣的配置

**Gaussian_HighLearningRate_ManyNeurons_HighPrior**:
- 學習率: 0.4, 隱藏層: 200, 先驗: 0.4
- 振盪次數: 24（最高）
- 平滑度: 0.973（相對較低）
- 雖然沒有達到百葉窗效果標準，但顯示了較高的振盪性

**Gaussian_Extreme_LearningRate_MoreNeurons_Imbalanced**:
- 學習率: 0.7, 隱藏層: 300, 不平衡數據
- 振盪次數: 9
- 平滑度: 0.938（最低）
- 顯示了不平衡數據對決策邊界的影響

## 中文字體問題解決

### ✅ 成功解決方案

1. **系統字體檢測**: 使用 `fc-list :lang=zh` 檢測系統中文字體
2. **字體自動選擇**: 自動選擇了 `uming` 字體
3. **純英文標籤**: 所有圖片使用純英文標籤，避免字體問題
4. **高質量圖片**: 生成 8 張高質量的可視化圖片

### 🔧 技術改進

- 使用 `subprocess.run()` 檢測系統字體
- 實現多層字體回退機制
- 純英文標籤確保跨平台兼容性

## 與其他分布的比較

### 高斯分布 vs 複雜分布

| 特性 | 高斯分布 | 複雜分布 |
|------|----------|----------|
| 決策邊界平滑度 | 高 (0.97-0.999) | 中等 (0.91-0.99) |
| 振盪次數 | 低 (1-24) | 高 (10-30) |
| 百葉窗效果 | 難產生 | 容易產生 |
| 過擬合風險 | 較低 | 較高 |

### 關鍵差異

1. **數據結構**: 高斯分布更規則，複雜分布更不規則
2. **學習難度**: 高斯分布相對容易學習
3. **邊界複雜度**: 複雜分布更容易產生複雜邊界

## 結論

1. **高斯分布特性**: 高斯分布產生的決策邊界相對平滑，不容易產生百葉窗效果
2. **參數影響**: 即使使用極端參數（高學習率、多神經元、無正規化），高斯分布的邊界仍然相對平滑
3. **過擬合表現**: 高斯分布下的過擬合主要表現為過度平滑，而非鋸齒狀邊界
4. **中文字體**: 成功解決了中文字體顯示問題，使用系統字體和純英文標籤

## 建議

1. **百葉窗效果研究**: 建議使用複雜分布或螺旋分布來研究百葉窗效果
2. **過擬合研究**: 高斯分布適合研究其他類型的過擬合現象
3. **字體處理**: 使用系統字體檢測和純英文標籤確保跨平台兼容性

## 生成的文件

### 圖片文件
- `nnpu_gaussian_english_Gaussian_Extreme_LearningRate_ManyNeurons_NoReg.png`
- `nnpu_gaussian_english_Gaussian_Extreme_LearningRate_MoreNeurons_NoReg.png`
- `nnpu_gaussian_english_Gaussian_HighLearningRate_ExtremeNeurons_NoReg.png`
- `nnpu_gaussian_english_Gaussian_Extreme_LearningRate_ManyNeurons_LowPrior.png`
- `nnpu_gaussian_english_Gaussian_HighLearningRate_ManyNeurons_HighPrior.png`
- `nnpu_gaussian_english_Gaussian_Extreme_LearningRate_MoreNeurons_Imbalanced.png`
- `nnpu_gaussian_english_Gaussian_HighLearningRate_ExtremeNeurons_ExtremeImbalanced.png`
- `nnpu_gaussian_english_Gaussian_Extreme_LearningRate_ManyNeurons_ExtremeLowPrior.png`

### 數據文件
- `gaussian_overfitting_english_results.json` - 詳細的測試結果數據

### 腳本文件
- `fix_chinese_font_advanced.py` - 改進的字體處理腳本

---

*測試時間: 2024年7月27日*  
*測試環境: Python 3.x, PyTorch, FastAPI*  
*後端服務器: localhost:8000*  
*字體系統: uming (系統中文字體)* 
