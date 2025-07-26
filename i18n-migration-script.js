#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// 需要處理的文件列表
const filesToProcess = [
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/customers/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/customers/components/create-customer-dialog.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/customers/components/edit-customer-dialog.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/bank-accounts/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/products/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/profit-sharing/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/relationship-managers/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/general/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/danger-zone/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/chatbot/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx",
	"apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx",
];

// 繁體中文到英文的翻譯映射
const commonTranslations = {
	// 常用按鈕和操作
	新增: "Add",
	編輯: "Edit",
	刪除: "Delete",
	儲存: "Save",
	取消: "Cancel",
	確認: "Confirm",
	更新: "Update",
	搜尋: "Search",
	篩選: "Filter",
	排序: "Sort",
	匯出: "Export",
	匯入: "Import",

	// 表單相關
	姓名: "Name",
	電子郵件: "Email",
	電話: "Phone",
	地址: "Address",
	描述: "Description",
	日期: "Date",
	時間: "Time",
	狀態: "Status",
	類別: "Category",
	類型: "Type",
	金額: "Amount",
	幣別: "Currency",
	餘額: "Balance",

	// 客戶相關
	客戶: "Customer",
	客戶列表: "Customer List",
	新增客戶: "Add Customer",
	編輯客戶: "Edit Customer",
	客戶資料: "Customer Data",
	國籍: "Nationality",
	出生日期: "Date of Birth",

	// 支出相關
	支出: "Expense",
	支出列表: "Expense List",
	新增支出: "Add Expense",
	編輯支出: "Edit Expense",
	收據: "Receipt",
	匯率: "Exchange Rate",

	// 銀行相關
	銀行帳戶: "Bank Account",
	銀行名稱: "Bank Name",
	帳戶號碼: "Account Number",
	帳戶類型: "Account Type",

	// 產品相關
	產品: "Product",
	產品列表: "Product List",
	產品名稱: "Product Name",
	產品類別: "Product Category",

	// 關係經理
	關係經理: "Relationship Manager",
	RM: "RM",
	Finder: "Finder",

	// 設定
	設定: "Settings",
	一般設定: "General Settings",
	危險區域: "Danger Zone",
	組織名稱: "Organization Name",

	// 狀態訊息
	"載入中...": "Loading...",
	"儲存中...": "Saving...",
	"更新中...": "Updating...",
	"刪除中...": "Deleting...",
	"新增中...": "Creating...",

	// 錯誤訊息
	獲取資料失敗: "Failed to fetch data",
	儲存失敗: "Failed to save",
	更新失敗: "Failed to update",
	刪除失敗: "Failed to delete",

	// 確認對話框
	"確定要刪除嗎？": "Are you sure you want to delete?",
	此操作無法復原: "This action cannot be undone",

	// 表單驗證
	必填欄位: "Required field",
	格式不正確: "Invalid format",
	請選擇: "Please select",
	請輸入: "Please enter",
};

function processFile(filePath) {
	const fullPath = path.join(__dirname, filePath);

	if (!fs.existsSync(fullPath)) {
		console.log(`File not found: ${filePath}`);
		return;
	}

	let content = fs.readFileSync(fullPath, "utf8");
	let modified = false;

	// 檢查是否已經導入了 useTranslations
	if (!content.includes("import { useTranslations }")) {
		// 添加 useTranslations 導入
		if (
			content.includes("import {") &&
			content.includes('} from "react"')
		) {
			content = content.replace(
				/import { ([^}]+) } from "react";/,
				'import { $1 } from "react";\nimport { useTranslations } from "next-intl";',
			);
			modified = true;
		} else if (content.includes("import")) {
			// 在第一個導入後添加
			const firstImportMatch = content.match(/^import[^;]+;/m);
			if (firstImportMatch) {
				content = content.replace(
					firstImportMatch[0],
					`${firstImportMatch[0]}\nimport { useTranslations } from "next-intl";`,
				);
				modified = true;
			}
		}
	}

	// 檢查是否已經有 useTranslations hook
	if (!content.includes("useTranslations(")) {
		// 尋找函數組件的開始
		const componentMatch = content.match(
			/export default function (\w+)\([^)]*\) \{/,
		);
		if (componentMatch) {
			const [fullMatch, componentName] = componentMatch;
			// 在函數開始後添加 useTranslations hook
			content = content.replace(
				fullMatch,
				`${fullMatch}\n\tconst t = useTranslations();`,
			);
			modified = true;
		}
	}

	// 替換常見的中文字串
	Object.entries(commonTranslations).forEach(([chinese, english]) => {
		const regex = new RegExp(
			`"${chinese.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
			"g",
		);
		if (content.match(regex)) {
			// 這裡我們暫時不直接替換，而是標記出來
			console.log(`Found translatable text in ${filePath}: "${chinese}"`);
		}
	});

	if (modified) {
		fs.writeFileSync(fullPath, content, "utf8");
		console.log(`Updated: ${filePath}`);
	}
}

// 處理所有文件
console.log("Starting i18n migration...\n");

filesToProcess.forEach((filePath) => {
	console.log(`Processing: ${filePath}`);
	processFile(filePath);
});

console.log("\ni18n migration completed!");
