# i18n 國際化改造完成報告

## 已完成的改造

### 1. 翻譯文件更新
- ✅ 更新了 `packages/i18n/translations/zh.json` (繁體中文)
- ✅ 更新了 `packages/i18n/translations/en.json` (英文)
- ✅ 新增了完整的組織管理模組翻譯

### 2. 核心頁面改造
- ✅ **支出管理** (`[organizationSlug]/expenses/`)
  - 主頁面 (`page.tsx`)
  - 編輯支出對話框 (`components/edit-expense-dialog.tsx`)
  - 完整的表單驗證和UI文字國際化

- ✅ **客戶管理** (`[organizationSlug]/customers/`)
  - 主頁面 (`page.tsx`)
  - 基本的標題和錯誤訊息國際化

- ✅ **產品管理** (`[organizationSlug]/products/`)
  - 主頁面 (`page.tsx`)
  - 頁面標題國際化

### 3. 新增組件
- ✅ 語言切換器 (`components/language-switcher.tsx`)
- ✅ 測試頁面 (`test-i18n/page.tsx`)

### 4. i18n 架構
- ✅ 建立了完整的翻譯鍵結構
- ✅ 支援繁體中文(zh)和英文(en)
- ✅ 利用現有的 next-intl 架構

## 翻譯覆蓋範圍

### 支出模組 (expenses)
```
organization.expenses.{
  title, subtitle, create, edit, delete,
  category, amount, currency, exchangeRate, usdRate,
  sgdAmount, usdAmount, description, date, receipts, rmId,
  categories: { 餐飲, 機票, 酒店, 快遞, 交通 },
  form: { 驗證訊息, 按鈕文字, 錯誤處理 },
  filters: { 篩選相關 },
  summary: { 統計相關 }
}
```

### 客戶模組 (customers)
```
organization.customers.{
  title, subtitle, create, edit, delete,
  name, email, phone, nationality, dateOfBirth, rmId, finderId,
  form: { 驗證和操作相關 },
  filters: { 篩選相關 },
  details: { 詳情頁面相關 }
}
```

### 其他模組
- 銀行帳戶 (bankAccounts)
- 產品 (products)  
- 分潤 (profitSharing)
- 關係經理 (relationshipManagers)
- 設定 (settings)
- 聊天機器人 (chatbot)
- 通用功能 (common)

## 使用方法

### 在組件中使用翻譯
```tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("organization.expenses");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <button>{t("form.save")}</button>
    </div>
  );
}
```

### 語言切換
- 使用 `<LanguageSwitcher />` 組件
- 會自動設置 cookie 並刷新頁面
- 支援中英文切換

## 測試方法

1. 訪問測試頁面：`/app/[organizationSlug]/test-i18n`
2. 使用語言切換器切換語言
3. 檢查所有文字是否正確翻譯

## 還需要處理的項目

### 待處理頁面
- [ ] 客戶詳情頁面 (`customers/[customerId]/page.tsx`)
- [ ] 銀行帳戶頁面 (`bank-accounts/page.tsx`)
- [ ] 分潤頁面 (`profit-sharing/page.tsx`)
- [ ] 關係經理頁面 (`relationship-managers/page.tsx`)
- [ ] 設定子頁面 (`settings/*/page.tsx`)
- [ ] 聊天機器人頁面 (`chatbot/page.tsx`)
- [ ] 組織主頁面 (`page.tsx`)

### 組件級別
- [ ] 新增/編輯對話框組件
- [ ] 篩選器組件
- [ ] 資料表格欄位標題
- [ ] 驗證錯誤訊息

### 進階功能
- [ ] 日期/時間格式本地化
- [ ] 數字和貨幣格式本地化
- [ ] 複數形式處理
- [ ] RTL 語言支援（未來需要）

## 技術細節

### 架構說明
- 使用 `next-intl` 作為國際化解決方案
- 翻譯文件存放在 `packages/i18n/translations/`
- 使用嵌套的 JSON 結構組織翻譯鍵
- 支援動態語言切換

### 配置文件
- `config/index.ts` - i18n 基本配置
- `apps/web/modules/i18n/routing.ts` - 路由配置
- `apps/web/middleware.ts` - 中間件處理

### 最佳實踐
1. 使用語義化的翻譯鍵名稱
2. 按功能模組分組組織翻譯
3. 保持中英文翻譯的對應關係
4. 驗證錯誤訊息使用 zod schema
5. 統一的命名規範

## 部署注意事項

1. 確保翻譯文件包含在構建中
2. 檢查 middleware 配置正確
3. 驗證 cookie 設定正常工作
4. 測試所有語言切換功能

---

**改造完成度：約 40%**  
核心功能（支出管理）已完全國際化，其他模組需要逐步完成。
