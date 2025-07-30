"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Form } from "@ui/components/form";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
import type { ProfitSharingRecord } from "./columns";
import { BasicFormFields } from "./form-fields/BasicFormFields";
import { ProfitShareAllocation } from "./form-fields/ProfitShareAllocation";
import { ShareableAmountSection } from "./form-fields/ShareableAmountSection";
import { useBaseData } from "./shared/hooks";
import {
	type ProfitSharingFormData,
	profitSharingFormSchema,
} from "./shared/types";
import {
	calculateTotalProfitSharePercent,
	isValidProfitSharePercent,
} from "./shared/utils";

interface EditDialogProps {
	data: ProfitSharingRecord | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	onSuccess?: () => void;
}

export function EditProfitSharingDialog({
	data: record,
	open,
	onOpenChange,
	organizationId,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const t = useTranslations("organization.profitSharing.dialog.edit");

	// 使用共用的 Hook 來取得資料
	const {
		customers,
		products,
		bankAccounts,
		allRMs,
		allFinders,
		isLoadingRMsAndFinders,
		isLoadingCustomers,
		isLoadingProducts,
		isLoadingBankAccounts,
		fetchBankAccounts,
		fetchRMsAndFinders,
	} = useBaseData({ organizationId, open });

	const form = useForm<ProfitSharingFormData>({
		resolver: zodResolver(profitSharingFormSchema),
		defaultValues: {
			currency: "USD",
			companyRevenue: 0,
			directTradeBookingFee: 0,
			bankRetroPercent: 50,
			shareable: 0,
			rmProfitSharePercent: 50,
			finderProfitSharePercent: 0,
			companyProfitSharePercent: 50,
			fxRate: 1,
			amount: 0,
			rmRevenueOriginal: 0,
			findersRevenueOriginal: 0,
			companyRevenueOriginal: 0,
			rmRevenueUSD: 0,
			findersRevenueUSD: 0,
			profitDate: new Date().toISOString().split("T")[0],

			// 新的分潤比例欄位
			companyRevenuePercent: 50,
			companyFeePercent: 50,

			rm1Id: undefined,
			rm1Name: undefined,
			rm1RevenuePercent: 0,
			rm1FeePercent: 0,
			rm1RevenueOriginal: 0,
			rm1RevenueUSD: 0,

			rm2Id: undefined,
			rm2Name: undefined,
			rm2RevenuePercent: 0,
			rm2FeePercent: 0,
			rm2RevenueOriginal: 0,
			rm2RevenueUSD: 0,

			finder1Id: undefined,
			finder1Name: undefined,
			finder1RevenuePercent: 0,
			finder1FeePercent: 0,
			finder1RevenueOriginal: 0,
			finder1RevenueUSD: 0,

			finder2Id: undefined,
			finder2Name: undefined,
			finder2RevenuePercent: 0,
			finder2FeePercent: 0,
			finder2RevenueOriginal: 0,
			finder2RevenueUSD: 0,
		},
	});

	// 監聽表單中的日期和幣別變化
	const watchedDate = form.watch("profitDate");
	const watchedCurrency = form.watch("currency");

	// 確保日期格式正確 (YYYY-MM-DD)
	const normalizedDate = watchedDate
		? typeof watchedDate === "string" && watchedDate.includes("T")
			? watchedDate.split("T")[0]
			: watchedDate
		: new Date().toISOString().split("T")[0];

	// 使用匯率hook
	const {
		data: exchangeRateData,
		loading: exchangeRateLoading,
		error: exchangeRateError,
		refetch: refetchExchangeRate,
	} = useExchangeRate({
		date: normalizedDate,
		enabled: false, // 預設不啟用，只在需要時手動載入
		useUsdRates: true, // 使用 USD 匯率
	});

	// 監聽幣別和日期變更，手動載入匯率
	useEffect(() => {
		if (!open || !watchedCurrency || !normalizedDate) {
			return;
		}

		// 如果幣別不是 USD，載入 USD 匯率
		if (watchedCurrency !== "USD") {
			refetchExchangeRate();
		}
	}, [watchedCurrency, normalizedDate, open, refetchExchangeRate]);

	// 當有記錄時，填充表單數據
	useEffect(() => {
		if (record && open) {
			console.log("=== 編輯分潤記錄 - 設定表單數據 ===");
			console.log("原始記錄:", record);

			// 處理分潤日期格式
			let formattedDate = "";
			if (record.profitDate) {
				console.log(
					"原始分潤日期:",
					record.profitDate,
					typeof record.profitDate,
				);

				if (record.profitDate instanceof Date) {
					// 如果是 Date 物件
					formattedDate = record.profitDate
						.toISOString()
						.split("T")[0];
				} else if (typeof record.profitDate === "string") {
					// 如果是字串，嘗試解析
					const date = new Date(record.profitDate);
					if (!Number.isNaN(date.getTime())) {
						formattedDate = date.toISOString().split("T")[0];
					} else {
						// 如果已經是 YYYY-MM-DD 格式
						formattedDate = record.profitDate;
					}
				}

				console.log("格式化後的分潤日期:", formattedDate);
			}

			// 先重置表單到預設值
			form.reset({
				currency: record.currency,
				companyRevenue: record.companyRevenue || 0,
				directTradeBookingFee: record.directTradeBookingFee || 0,
				bankRetroPercent: record.bankRetroPercent || 50,
				shareable: record.shareable || 0,
				rmProfitSharePercent: record.rmProfitSharePercent || 0,
				finderProfitSharePercent: record.finderProfitSharePercent || 0,
				companyProfitSharePercent:
					record.companyProfitSharePercent || 0,
				fxRate: record.fxRate || 1,
				amount: record.amount,
				rmRevenueOriginal: record.rmRevenueOriginal || 0,
				findersRevenueOriginal: record.findersRevenueOriginal || 0,
				companyRevenueOriginal: record.companyRevenueOriginal || 0,
				rmRevenueUSD: record.rmRevenueUSD || 0,
				findersRevenueUSD: record.findersRevenueUSD || 0,
				profitDate: formattedDate,
				customerId: record.customerId,
				productId: record.productId,
				bankAccountId: record.bankAccountId || "",

				// 新的分潤比例欄位 - 使用資料庫中的實際值
				companyRevenuePercent: record.companyRevenuePercent ?? 100,
				companyFeePercent: record.companyFeePercent ?? 100,

				// RM1 資訊
				rm1Id: record.rm1Id || undefined,
				rm1Name: record.rm1Name || undefined,
				rm1RevenuePercent: record.rm1RevenuePercent ?? 0,
				rm1FeePercent: record.rm1FeePercent ?? 0,
				rm1RevenueOriginal: record.rm1RevenueOriginal || 0,
				rm1RevenueUSD: record.rm1RevenueUSD || 0,

				// RM2 資訊
				rm2Id: record.rm2Id || undefined,
				rm2Name: record.rm2Name || undefined,
				rm2RevenuePercent: record.rm2RevenuePercent ?? 0,
				rm2FeePercent: record.rm2FeePercent ?? 0,
				rm2RevenueOriginal: record.rm2RevenueOriginal || 0,
				rm2RevenueUSD: record.rm2RevenueUSD || 0,

				// Finder1 資訊
				finder1Id: record.finder1Id || undefined,
				finder1Name: record.finder1Name || undefined,
				finder1RevenuePercent: record.finder1RevenuePercent ?? 0,
				finder1FeePercent: record.finder1FeePercent ?? 0,
				finder1RevenueOriginal: record.finder1RevenueOriginal || 0,
				finder1RevenueUSD: record.finder1RevenueUSD || 0,

				// Finder2 資訊
				finder2Id: record.finder2Id || undefined,
				finder2Name: record.finder2Name || undefined,
				finder2RevenuePercent: record.finder2RevenuePercent ?? 0,
				finder2FeePercent: record.finder2FeePercent ?? 0,
				finder2RevenueOriginal: record.finder2RevenueOriginal || 0,
				finder2RevenueUSD: record.finder2RevenueUSD || 0,
			});

			// 添加調試信息
			console.log("表單重置完成，當前表單值:");
			console.log("- profitDate:", form.getValues("profitDate"));
			console.log("- customerId:", form.getValues("customerId"));
			console.log("- productId:", form.getValues("productId"));
			console.log("- bankAccountId:", form.getValues("bankAccountId"));

			// 載入對應的銀行帳戶
			if (record.customerId) {
				fetchBankAccounts(record.customerId);
			}
		} else if (!open) {
			// 當對話框關閉時，重置表單為預設值
			form.reset();
		}
	}, [record, open]);

	// 當匯率數據變化時，自動更新表單中的匯率欄位
	useEffect(() => {
		if (watchedCurrency === "USD") {
			// 如果是USD，直接設定匯率為1
			form.setValue("fxRate", 1);
		} else if (exchangeRateData?.rates && open) {
			// 其他幣別則直接使用API獲取的匯率
			const rate = exchangeRateData.rates[watchedCurrency];
			if (rate) {
				form.setValue("fxRate", Number(rate.toFixed(5)));
			}
		}
	}, [exchangeRateData, open, watchedCurrency]);

	// 監聽收入和費用的變化，計算分潤金額
	useEffect(() => {
		const companyRevenue = form.watch("companyRevenue");
		const directTradeBookingFee = form.watch("directTradeBookingFee");
		const bankRetroPercent = form.watch("bankRetroPercent") || 50;

		// 新的計算邏輯
		// 分潤金額 = Company Revenue + Direct Trade Booking Fee × Bank Retro(%)
		const totalShareable =
			companyRevenue + (directTradeBookingFee * bankRetroPercent) / 100;

		form.setValue("shareable", totalShareable >= 0 ? totalShareable : 0);
	}, [
		form.watch("companyRevenue"),
		form.watch("directTradeBookingFee"),
		form.watch("bankRetroPercent"),
	]);

	// 當選擇客戶時，設定對應的RM信息並載入銀行帳戶
	useEffect(() => {
		const customerId = form.watch("customerId");
		if (customerId) {
			const selectedCustomer = customers.find((c) => c.id === customerId);
			if (selectedCustomer) {
				fetchBankAccounts(customerId);
				fetchRMsAndFinders(selectedCustomer);
			}
		} else {
			// 如果沒有選擇客戶，清空銀行帳戶
			fetchBankAccounts();
		}
	}, [form.watch("customerId"), customers]);

	const onSubmit = async (data: ProfitSharingFormData) => {
		if (!record) {
			return;
		}

		console.log("=== 更新分潤記錄 - 提交數據 ===");
		console.log("完整表單數據:", data);

		setIsLoading(true);
		try {
			const requestData = { ...data, organizationId };
			console.log("發送到 API 的數據:", requestData);

			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(requestData),
				},
			);

			if (!response.ok) {
				let errorMessage = t("updateFailed");
				try {
					const responseText = await response.text();
					console.log("API 錯誤回應:", responseText);
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = t("updateFailed");
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log("API 成功回應:", result);

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新分潤記錄失敗:", error);
			alert(error instanceof Error ? error.message : t("updateFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!record) {
			return;
		}

		if (!confirm(t("deleteConfirm"))) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(t("deleteFailed"));
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除分潤記錄失敗:", error);
			alert(error instanceof Error ? error.message : t("deleteFailed"));
		} finally {
			setIsDeleting(false);
		}
	};

	// 計算總分潤比例
	const totalPercentages = calculateTotalProfitSharePercent(
		form.watch("companyRevenuePercent") || 0,
		form.watch("companyFeePercent") || 0,
		form.watch("rm1RevenuePercent") || 0,
		form.watch("rm1FeePercent") || 0,
		form.watch("rm2RevenuePercent") || 0,
		form.watch("rm2FeePercent") || 0,
		form.watch("finder1RevenuePercent") || 0,
		form.watch("finder1FeePercent") || 0,
		form.watch("finder2RevenuePercent") || 0,
		form.watch("finder2FeePercent") || 0,
	);

	const isValid = isValidProfitSharePercent(
		totalPercentages.revenuePercent,
		totalPercentages.feePercent,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-[90vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="space-y-4">
							{/* 基本表單欄位 */}
							<BasicFormFields
								form={form}
								customers={customers}
								products={products}
								bankAccounts={bankAccounts}
								isLoadingCustomers={isLoadingCustomers}
								isLoadingProducts={isLoadingProducts}
								isLoadingBankAccounts={isLoadingBankAccounts}
							/>

							{/* 可分潤金額區塊 */}
							<ShareableAmountSection
								form={form}
								exchangeRateLoading={exchangeRateLoading}
								exchangeRateError={exchangeRateError}
								exchangeRateData={exchangeRateData}
								onRefreshExchangeRate={refetchExchangeRate}
								watchedCurrency={watchedCurrency}
							/>

							{/* 分潤比例分配 */}
							<ProfitShareAllocation
								form={form}
								allRMs={allRMs}
								allFinders={allFinders}
								isLoadingRMsAndFinders={isLoadingRMsAndFinders}
							/>
						</div>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting || isLoading}
								className="mr-auto"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{isDeleting ? t("deleting") : t("delete")}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={isLoading || isDeleting || !isValid}
							>
								{isLoading ? t("submitting") : t("submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
