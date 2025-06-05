# 銀行帳戶功能實現總結

## 已完成的功能

### 1. 資料庫層面
- ✅ 在 `packages/database/prisma/schema.prisma` 中添加了 `BankAccount` 模型
- ✅ 建立了與 `Organization` 的關聯關係
- ✅ 創建了資料庫遷移 (`20250605010722_add_bank_account`)
- ✅ 生成了 Prisma 客戶端

### 2. 查詢函數
- ✅ 創建了 `packages/database/prisma/queries/bank-accounts.ts`
- ✅ 實現了以下函數：
  - `getBankAccountsByOrganizationId()` - 獲取組織的所有銀行帳戶
  - `createBankAccount()` - 創建新銀行帳戶
  - `getBankAccountById()` - 根據 ID 獲取銀行帳戶
  - `updateBankAccount()` - 更新銀行帳戶
  - `deleteBankAccount()` - 刪除銀行帳戶
- ✅ 在 `packages/database/prisma/queries/index.ts` 中導出新函數

### 3. API 路由
- ✅ 創建了 `packages/api/src/routes/organizations/bank-accounts.ts`
- ✅ 實現了完整的 CRUD API：
  - `GET /api/organizations/bank-accounts` - 獲取銀行帳戶列表
  - `POST /api/organizations/bank-accounts` - 創建新銀行帳戶
  - `PUT /api/organizations/bank-accounts/:id` - 更新銀行帳戶
  - `DELETE /api/organizations/bank-accounts/:id` - 刪除銀行帳戶
- ✅ 添加了適當的驗證和錯誤處理
- ✅ 在 `packages/api/src/routes/organizations/router.ts` 中註冊路由

### 4. 前端組件
- ✅ 更新了 `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/bank-accounts/components/columns.tsx`
  - 添加了編輯功能
  - 更新了 `BankAccountRecord` 接口
  - 實現了 `createColumns` 函數
- ✅ 創建了 `create-bank-account-dialog.tsx` - 新增銀行帳戶對話框
- ✅ 創建了 `edit-bank-account-dialog.tsx` - 編輯銀行帳戶對話框
- ✅ 更新了主頁面 `page.tsx`，實現了完整的數據獲取和管理功能

### 5. 功能特性
- ✅ 支援多種幣別（TWD, USD, EUR, JPY, CNY）
- ✅ 餘額管理（支援小數點後兩位）
- ✅ 狀態管理（使用中/已停用）
- ✅ 完整的 CRUD 操作
- ✅ 搜尋功能（按帳戶名稱搜尋）
- ✅ 響應式設計
- ✅ 錯誤處理和驗證
- ✅ 權限控制（組織成員資格驗證）

## 資料庫結構

```sql
model BankAccount {
  id             String       @id @default(cuid())
  bankName       String       -- 銀行名稱
  accountName    String       -- 帳戶名稱
  accountNumber  String       -- 帳號
  currency       String       @default("TWD") -- 幣別
  balance        Decimal      @default(0) @db.Decimal(15, 2) -- 餘額
  status         String       @default("active") -- 狀態
  organizationId String       -- 組織 ID
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([organizationId, accountNumber]) -- 同一組織內帳號唯一
  @@map("bank_account")
}
```

## API 端點

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/organizations/bank-accounts?organizationId={id}` | 獲取組織的銀行帳戶列表 |
| POST | `/api/organizations/bank-accounts` | 創建新銀行帳戶 |
| PUT | `/api/organizations/bank-accounts/{id}` | 更新銀行帳戶 |
| DELETE | `/api/organizations/bank-accounts/{id}` | 刪除銀行帳戶 |

## 使用方式

1. 訪問 `/app/{organizationSlug}/bank-accounts` 頁面
2. 點擊「新增銀行帳戶」按鈕創建新帳戶
3. 點擊表格中的編輯按鈕修改現有帳戶
4. 使用搜尋框按帳戶名稱搜尋
5. 在編輯對話框中可以刪除帳戶

## 技術棧

- **後端**: Prisma ORM, Hono.js, PostgreSQL
- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **UI 組件**: Shadcn UI, Radix UI
- **表單處理**: React Hook Form, Zod 驗證
- **狀態管理**: React useState, useEffect

## 注意事項

- 所有操作都需要組織成員資格驗證
- 帳號在同一組織內必須唯一
- 餘額支援最多 15 位數字，小數點後 2 位
- 刪除操作不可復原，會顯示確認對話框 
