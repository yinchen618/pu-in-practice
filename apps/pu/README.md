# AI 學習平台 - 前端

這是一個基於 Next.js 的 AI 學習平台前端專案，使用 TypeScript、Tailwind CSS 和 Biome 進行開發。

## 開始使用

### 安裝依賴

```bash
pnpm install
```

### 啟動開發伺服器

```bash
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000) 在瀏覽器中查看結果。

## 程式碼規範與格式化

本專案使用 [Biome](https://biomejs.dev/) 進行程式碼格式化和 linting。

### 可用指令

```bash
# 格式化程式碼
pnpm format

# 檢查程式碼規範
pnpm biome:check

# 自動修復可修復的問題
pnpm biome:fix

# 格式化檢查（不修改檔案）
pnpm format:check

# CI 檢查
pnpm biome:ci
```

### VS Code 設定

1. 安裝 Biome 擴充功能：`biomejs.biome`
2. 配置已自動包含在 `.vscode/settings.json` 中
3. 存檔時會自動格式化程式碼

### 編輯器設定

- 存檔時自動格式化
- 自動整理 import 語句
- 自動修復程式碼問題

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
