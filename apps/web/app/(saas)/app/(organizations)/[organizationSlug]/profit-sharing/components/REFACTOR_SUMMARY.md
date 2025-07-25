# 分潤對話框組件重構總結

## 重構概覽
成功將分潤新增與編輯對話框重構為可重用的組件架構，大幅減少重複程式碼並提升維護性。

## 共用組件架構

### 1. 共用類型定義 (`shared/types.ts`)
- `ProfitSharingFormData`: 統一的表單資料介面
- `Customer`, `Product`, `BankAccount`, `RelationshipManager`: 基礎資料類型
- `profitSharingFormSchema`: Zod 驗證 schema

### 2. 共用工具函數 (`shared/utils.ts`)
- `formatCurrency()`: 貨幣格式化
- `calculateProfitShare()`: 分潤金額計算
- `calculateTotalProfitSharePercent()`: 總分潤比例計算
- `isValidProfitSharePercent()`: 分潤比例驗證

### 3. 共用 Hook (`shared/hooks.ts`)
- `useBaseData()`: 統一的資料載入邏輯
  - 客戶、產品、銀行帳戶資料載入
  - RM 和 Finder 資料載入
  - 銀行帳戶過濾功能

### 4. 表單欄位組件

#### `BasicFormFields.tsx`
- 基本資訊欄位：日期、客戶、產品、銀行帳戶
- 貨幣、金額、收入相關欄位
- Bank Retro 比例設定

#### `ShareableAmountSection.tsx`
- 可分潤金額顯示
- FX Rate 設定和顯示
- USD 轉換金額計算

#### `ProfitShareAllocation.tsx`
- Company、RM1、RM2、Finder1、Finder2 分潤設定
- 即時計算原幣和美金金額
- 分潤比例總和驗證

## 主要對話框組件

### `CreateProfitSharingDialog.tsx`
- 使用所有共用組件
- 新增分潤記錄功能
- 表單驗證和提交邏輯

### `EditProfitSharingDialog.tsx`
- 使用所有共用組件
- 編輯和刪除分潤記錄功能
- 表單預填和更新邏輯

## 重構效益

### 1. 程式碼重用
- 原本 2100+ 行重複程式碼縮減為共用組件
- 表單欄位組件可在其他功能中重用
- 減少約 70% 的重複程式碼

### 2. 維護性提升
- 統一的資料類型和驗證邏輯
- 集中的工具函數和計算邏輯
- 模組化的組件架構

### 3. 一致性保證
- 統一的 UI/UX 體驗
- 一致的驗證規則和錯誤處理
- 標準化的資料流

### 4. 開發效率
- 新增類似功能時可直接重用組件
- 統一的 Hook 和工具函數
- 清晰的組件職責分離

## 檔案結構
```
components/
├── shared/
│   ├── types.ts           # 共用類型定義
│   ├── utils.ts           # 工具函數
│   └── hooks.ts           # 共用 Hook
├── form-fields/
│   ├── BasicFormFields.tsx        # 基本表單欄位
│   ├── ShareableAmountSection.tsx # 可分潤金額區塊
│   └── ProfitShareAllocation.tsx  # 分潤比例分配
├── create-profit-sharing-dialog.tsx # 新增對話框
└── edit-profit-sharing-dialog.tsx   # 編輯對話框
```

## 技術特色
- TypeScript 完整類型支援
- React Hook Form 表單管理
- Zod 資料驗證
- 響應式設計 (Grid Layout)
- 即時計算和驗證
- 錯誤處理和載入狀態

## 後續擴展建議
1. 可考慮將 `ProfitShareAllocation` 進一步細分為更小的組件
2. 可新增表單欄位的客製化配置選項
3. 可考慮將共用組件發布為獨立的組件庫
4. 可新增更多的資料驗證和業務邏輯
