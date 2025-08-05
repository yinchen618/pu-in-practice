# Testbed 頁面組件化重構

這個文件夾包含了 testbed 頁面的所有組件，將原本單一的大型頁面文件拆分成多個可重用的組件。

## 組件結構

### 核心組件

1. **OverviewMetrics** (`overview-metrics.tsx`)
   - 展示概覽頁面的關鍵指標卡片
   - 包含住宅數量、活躍感測器、數據點等統計資訊

2. **OverviewDetails** (`overview-details.tsx`)
   - 展示住宅單位分佈和參與者人口統計資訊
   - 包含建築物資訊和系統狀態

3. **ResearchValue** (`research-value.tsx`)
   - 展示研究價值和應用說明
   - 包含數據集特性和研究應用場景

4. **ExplorerControls** (`explorer-controls.tsx`)
   - 數據探索器的控制面板
   - 包含建築物、單位、電表選擇和日期範圍設定

5. **TimeSeriesChart** (`time-series-chart.tsx`)
   - 時間序列圖表展示組件
   - 處理載入狀態、錯誤狀態和數據展示

6. **DataStatistics** (`data-statistics.tsx`)
   - 數據統計資訊展示
   - 展示總數據點、平均功率等統計指標

### 組合組件

7. **OverviewTab** (`overview-tab.tsx`)
   - 概覽標籤頁的主要組件
   - 組合了 OverviewMetrics、OverviewDetails 和 ResearchValue

8. **ExplorerTab** (`explorer-tab.tsx`)
   - 探索器標籤頁的主要組件
   - 組合了 ExplorerControls、TimeSeriesChart 和 DataStatistics

9. **TestbedNavigation** (`testbed-navigation.tsx`)
   - 頁面底部的導航組件
   - 包含返回首頁和前往其他頁面的連結

## 自定義 Hook

**useTestbedData** (`/src/hooks/use-testbed-data.ts`)
- 管理所有 testbed 相關的數據邏輯
- 包含數據載入、狀態管理和副作用處理
- 提供統一的數據接口給組件使用

## 使用方式

```tsx
import {
  OverviewTab,
  ExplorerTab,
  TestbedNavigation,
} from "@/components/testbed";
import { useTestbedData } from "@/hooks/use-testbed-data";

export default function TestbedPage() {
  const testbedData = useTestbedData();
  
  return (
    <div>
      <OverviewTab 
        overviewLoading={testbedData.overviewLoading}
        overview={testbedData.overview}
      />
      <ExplorerTab {...testbedData} />
      <TestbedNavigation />
    </div>
  );
}
```

## 組件化的優點

1. **可重用性**: 每個組件都有明確的職責，可以在其他地方重用
2. **可維護性**: 程式碼更易於理解和修改
3. **可測試性**: 每個組件都可以獨立測試
4. **關注點分離**: 數據邏輯和 UI 邏輯分離
5. **TypeScript 友好**: 明確的 props 類型定義

## 文件組織

```
src/
├── components/
│   └── testbed/
│       ├── index.ts              # 組件導出
│       ├── overview-metrics.tsx
│       ├── overview-details.tsx
│       ├── research-value.tsx
│       ├── explorer-controls.tsx
│       ├── time-series-chart.tsx
│       ├── data-statistics.tsx
│       ├── overview-tab.tsx
│       ├── explorer-tab.tsx
│       └── testbed-navigation.tsx
├── hooks/
│   └── use-testbed-data.ts       # 數據管理 hook
└── app/
    └── testbed/
        └── page.tsx              # 主頁面文件
```

這樣的組織方式讓程式碼更加模組化，每個組件都有清晰的界限和職責。
