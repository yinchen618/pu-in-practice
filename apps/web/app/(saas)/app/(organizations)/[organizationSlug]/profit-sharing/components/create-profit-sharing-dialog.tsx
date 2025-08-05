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
	DialogTrigger,
} from "@ui/components/dialog";
import { Form } from "@ui/components/form";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
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

interface CreateDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateProfitSharingDialog({
	organizationId,
	onSuccess,
}: CreateDialogProps) {
	const t = useTranslations("organization.profitSharing.dialog.create");
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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

	// 獲取今天的日期字符串（YYYY-MM-DD格式）
	const today = new Date().toISOString().split("T")[0];

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
			profitDate: today,

			// 新的分潤比例欄位
			companyRevenuePercent: 100, // 公司預設獲得 100% 的 Revenue
			companyFeePercent: 100, // 公司預設獲得 100% 的 Fee

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
		: today;

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
	}, [exchangeRateData, form, open, watchedCurrency]);

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

				// 設定客戶的預設 RM 和 Finder 資訊
				console.log("🔄 設定客戶預設資訊:", selectedCustomer);

				// 設定 RM1 資訊
				if (selectedCustomer.rm1Id && selectedCustomer.rm1Name) {
					form.setValue("rm1Id", selectedCustomer.rm1Id);
					form.setValue("rm1Name", selectedCustomer.rm1Name);
					// 如果分潤比例是 null，設為 0
					const rm1Percent = selectedCustomer.rm1ProfitShare ?? 0;
					form.setValue("rm1RevenuePercent", rm1Percent);
					form.setValue("rm1FeePercent", rm1Percent);
				} else {
					// 如果沒有設定 RM1，清空並設為 0
					form.setValue("rm1Id", undefined);
					form.setValue("rm1Name", undefined);
					form.setValue("rm1RevenuePercent", 0);
					form.setValue("rm1FeePercent", 0);
				}

				// 設定 RM2 資訊
				if (selectedCustomer.rm2Id && selectedCustomer.rm2Name) {
					form.setValue("rm2Id", selectedCustomer.rm2Id);
					form.setValue("rm2Name", selectedCustomer.rm2Name);
					// 如果分潤比例是 null，設為 0
					const rm2Percent = selectedCustomer.rm2ProfitShare ?? 0;
					form.setValue("rm2RevenuePercent", rm2Percent);
					form.setValue("rm2FeePercent", rm2Percent);
				} else {
					// 如果沒有設定 RM2，清空並設為 0
					form.setValue("rm2Id", undefined);
					form.setValue("rm2Name", undefined);
					form.setValue("rm2RevenuePercent", 0);
					form.setValue("rm2FeePercent", 0);
				}

				// 設定 Finder1 資訊
				if (
					selectedCustomer.finder1Id &&
					selectedCustomer.finder1Name
				) {
					form.setValue("finder1Id", selectedCustomer.finder1Id);
					form.setValue("finder1Name", selectedCustomer.finder1Name);
					// 如果分潤比例是 null，設為 0
					const finder1Percent =
						selectedCustomer.finder1ProfitShare ?? 0;
					form.setValue("finder1RevenuePercent", finder1Percent);
					form.setValue("finder1FeePercent", finder1Percent);
				} else {
					// 如果沒有設定 Finder1，清空並設為 0
					form.setValue("finder1Id", undefined);
					form.setValue("finder1Name", undefined);
					form.setValue("finder1RevenuePercent", 0);
					form.setValue("finder1FeePercent", 0);
				}

				// 設定 Finder2 資訊
				if (
					selectedCustomer.finder2Id &&
					selectedCustomer.finder2Name
				) {
					form.setValue("finder2Id", selectedCustomer.finder2Id);
					form.setValue("finder2Name", selectedCustomer.finder2Name);
					// 如果分潤比例是 null，設為 0
					const finder2Percent =
						selectedCustomer.finder2ProfitShare ?? 0;
					form.setValue("finder2RevenuePercent", finder2Percent);
					form.setValue("finder2FeePercent", finder2Percent);
				} else {
					// 如果沒有設定 Finder2，清空並設為 0
					form.setValue("finder2Id", undefined);
					form.setValue("finder2Name", undefined);
					form.setValue("finder2RevenuePercent", 0);
					form.setValue("finder2FeePercent", 0);
				}

				// 計算 Company 的分潤百分比 (100% - 所有 RM 和 Finder 的總和)
				const totalRMAndFinderPercent =
					(selectedCustomer.rm1ProfitShare ?? 0) +
					(selectedCustomer.rm2ProfitShare ?? 0) +
					(selectedCustomer.finder1ProfitShare ?? 0) +
					(selectedCustomer.finder2ProfitShare ?? 0);

				const companyPercent = Math.max(
					0,
					100 - totalRMAndFinderPercent,
				);

				form.setValue("companyRevenuePercent", companyPercent);
				form.setValue("companyFeePercent", companyPercent);

				console.log(
					"分潤百分比:",
					selectedCustomer.rm1ProfitShare,
					selectedCustomer.rm2ProfitShare,
					selectedCustomer.finder1ProfitShare,
					selectedCustomer.finder2ProfitShare,
					companyPercent,
				);
			}
		} else {
			// 如果沒有選擇客戶，清空銀行帳戶和 RM/Finder 資訊
			fetchBankAccounts();

			// 清空 RM 和 Finder 資訊
			form.setValue("rm1Id", undefined);
			form.setValue("rm1Name", undefined);
			form.setValue("rm1RevenuePercent", 0);
			form.setValue("rm1FeePercent", 0);

			form.setValue("rm2Id", undefined);
			form.setValue("rm2Name", undefined);
			form.setValue("rm2RevenuePercent", 0);
			form.setValue("rm2FeePercent", 0);

			form.setValue("finder1Id", undefined);
			form.setValue("finder1Name", undefined);
			form.setValue("finder1RevenuePercent", 0);
			form.setValue("finder1FeePercent", 0);

			form.setValue("finder2Id", undefined);
			form.setValue("finder2Name", undefined);
			form.setValue("finder2RevenuePercent", 0);
			form.setValue("finder2FeePercent", 0);

			// 重置 Company 分潤為預設值
			form.setValue("companyRevenuePercent", 100);
			form.setValue("companyFeePercent", 100);
		}
	}, [form.watch("customerId"), customers]);

	const onSubmit = async (data: ProfitSharingFormData) => {
		console.log("=== 新增分潤記錄 - 提交數據 ===");
		console.log("完整表單數據:", data);

		setIsLoading(true);
		try {
			const requestData = { ...data, organizationId };
			console.log("發送到 API 的數據:", requestData);

			const response = await fetch("/api/organizations/profit-sharing", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				let errorMessage = t("addFailed");
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
					errorMessage = t("addFailedDefault");
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log("API 成功回應:", result);

			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增分潤記錄失敗:", error);
			alert(
				error instanceof Error ? error.message : t("addFailedDefault"),
			);
		} finally {
			setIsLoading(false);
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
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8">
					<Plus className="h-4 w-4 mr-2" />
					{t("triggerButton")}
				</Button>
			</DialogTrigger>
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

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								{t("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={isLoading || !isValid}
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
