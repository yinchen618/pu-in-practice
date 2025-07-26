import { useTranslations } from "next-intl";

export function useOrganizationTranslations() {
	const t = useTranslations("organization");

	return {
		// 通用
		common: {
			loading: t("common.loading"),
			save: t("common.save"),
			cancel: t("common.cancel"),
			edit: t("common.edit"),
			delete: t("common.delete"),
			create: t("common.create"),
			update: t("common.update"),
			confirm: t("common.confirm"),
			search: t("common.search"),
			filter: t("common.filter"),
			none: t("common.none"),
		},

		// 支出
		expenses: {
			title: t("expenses.title"),
			subtitle: t("expenses.subtitle"),
			create: t("expenses.create"),
			edit: t("expenses.edit"),
			category: t("expenses.category"),
			amount: t("expenses.amount"),
			currency: t("expenses.currency"),
			exchangeRate: t("expenses.exchangeRate"),
			usdRate: t("expenses.usdRate"),
			sgdAmount: t("expenses.sgdAmount"),
			usdAmount: t("expenses.usdAmount"),
			description: t("expenses.description"),
			date: t("expenses.date"),
			receipts: t("expenses.receipts"),
			rmId: t("expenses.rmId"),
			categories: {
				餐飲: t("expenses.categories.餐飲"),
				機票: t("expenses.categories.機票"),
				酒店: t("expenses.categories.酒店"),
				快遞: t("expenses.categories.快遞"),
				交通: t("expenses.categories.交通"),
			},
			form: {
				categoryRequired: t("expenses.form.categoryRequired"),
				amountNegative: t("expenses.form.amountNegative"),
				currencyRequired: t("expenses.form.currencyRequired"),
				exchangeRateNegative: t("expenses.form.exchangeRateNegative"),
				usdRateNegative: t("expenses.form.usdRateNegative"),
				selectCategory: t("expenses.form.selectCategory"),
				selectCurrency: t("expenses.form.selectCurrency"),
				selectRm: t("expenses.form.selectRm"),
				none: t("expenses.form.none"),
				enterAmount: t("expenses.form.enterAmount"),
				enterDescription: t("expenses.form.enterDescription"),
				sgdRateFixed: t("expenses.form.sgdRateFixed"),
				usdRateFixed: t("expenses.form.usdRateFixed"),
				exchangeRateError: t("expenses.form.exchangeRateError"),
				exchangeRateUpdated: t("expenses.form.exchangeRateUpdated"),
				usdRateError: t("expenses.form.usdRateError"),
				usdRateUpdated: t("expenses.form.usdRateUpdated"),
				creating: t("expenses.form.creating"),
				updating: t("expenses.form.updating"),
				deleting: t("expenses.form.deleting"),
				cancel: t("expenses.form.cancel"),
				save: t("expenses.form.save"),
				update: t("expenses.form.update"),
				confirmDelete: t("expenses.form.confirmDelete"),
				updateFailed: t("expenses.form.updateFailed"),
				fetchDataFailed: t("expenses.form.fetchDataFailed"),
				deleteFailed: t("expenses.form.deleteFailed"),
			},
		},

		// 客戶
		customers: {
			title: t("customers.title"),
			subtitle: t("customers.subtitle"),
			create: t("customers.create"),
			edit: t("customers.edit"),
			name: t("customers.name"),
			email: t("customers.email"),
			phone: t("customers.phone"),
			nationality: t("customers.nationality"),
			dateOfBirth: t("customers.dateOfBirth"),
			rmId: t("customers.rmId"),
			finderId: t("customers.finderId"),
			form: {
				nameRequired: t("customers.form.nameRequired"),
				emailInvalid: t("customers.form.emailInvalid"),
				phoneRequired: t("customers.form.phoneRequired"),
				nationalityRequired: t("customers.form.nationalityRequired"),
				dateOfBirthRequired: t("customers.form.dateOfBirthRequired"),
				enterName: t("customers.form.enterName"),
				enterEmail: t("customers.form.enterEmail"),
				enterPhone: t("customers.form.enterPhone"),
				selectNationality: t("customers.form.selectNationality"),
				selectRm: t("customers.form.selectRm"),
				selectFinder: t("customers.form.selectFinder"),
				none: t("customers.form.none"),
				creating: t("customers.form.creating"),
				updating: t("customers.form.updating"),
				deleting: t("customers.form.deleting"),
				cancel: t("customers.form.cancel"),
				save: t("customers.form.save"),
				update: t("customers.form.update"),
				confirmDelete: t("customers.form.confirmDelete"),
			},
		},

		// 銀行帳戶
		bankAccounts: {
			title: t("bankAccounts.title"),
			subtitle: t("bankAccounts.subtitle"),
			create: t("bankAccounts.create"),
			edit: t("bankAccounts.edit"),
			bankName: t("bankAccounts.bankName"),
			accountNumber: t("bankAccounts.accountNumber"),
			accountType: t("bankAccounts.accountType"),
			currency: t("bankAccounts.currency"),
			balance: t("bankAccounts.balance"),
		},

		// 產品
		products: {
			title: t("products.title"),
			subtitle: t("products.subtitle"),
			create: t("products.create"),
			edit: t("products.edit"),
			name: t("products.name"),
			category: t("products.category"),
			description: t("products.description"),
		},

		// 分潤
		profitSharing: {
			title: t("profitSharing.title"),
			subtitle: t("profitSharing.subtitle"),
			create: t("profitSharing.create"),
			edit: t("profitSharing.edit"),
		},

		// 關係經理
		relationshipManagers: {
			title: t("relationshipManagers.title"),
			subtitle: t("relationshipManagers.subtitle"),
			create: t("relationshipManagers.create"),
			edit: t("relationshipManagers.edit"),
			name: t("relationshipManagers.name"),
			email: t("relationshipManagers.email"),
			category: t("relationshipManagers.category"),
			categories: {
				RM: t("relationshipManagers.categories.RM"),
				FINDER: t("relationshipManagers.categories.FINDER"),
				BOTH: t("relationshipManagers.categories.BOTH"),
			},
		},

		// 設定
		settings: {
			title: t("settings.title"),
			general: {
				title: t("settings.general.title"),
				organizationName: t("settings.general.organizationName"),
				description: t("settings.general.description"),
				save: t("settings.general.save"),
			},
			dangerZone: {
				title: t("settings.dangerZone.title"),
				deleteOrganization: t("settings.dangerZone.deleteOrganization"),
				deleteDescription: t("settings.dangerZone.deleteDescription"),
				confirmDelete: t("settings.dangerZone.confirmDelete"),
			},
		},

		// 聊天機器人
		chatbot: {
			title: t("chatbot.title"),
			subtitle: t("chatbot.subtitle"),
			placeholder: t("chatbot.placeholder"),
		},
	};
}
