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
			rm1Id: undefined,
			rm1Name: undefined,
			rm1ProfitSharePercent: undefined,
			rm1RevenueOriginal: 0,
			rm1RevenueUSD: 0,
			rm2Id: undefined,
			rm2Name: undefined,
			rm2ProfitSharePercent: undefined,
			rm2RevenueOriginal: 0,
			rm2RevenueUSD: 0,
			finder1Id: undefined,
			finder1Name: undefined,
			finder1ProfitSharePercent: undefined,
			finder1RevenueOriginal: 0,
			finder1RevenueUSD: 0,
			finder2Id: undefined,
			finder2Name: undefined,
			finder2ProfitSharePercent: undefined,
			finder2RevenueOriginal: 0,
			finder2RevenueUSD: 0,
		},
	});

	// 監聽表單中的日期和幣別變化
	const watchedDate = form.watch("profitDate");
	const watchedCurrency = form.watch("currency");

	// 使用匯率hook
	const {
		data: exchangeRateData,
		loading: exchangeRateLoading,
		error: exchangeRateError,
	} = useExchangeRate({
		date: watchedDate || today,
		enabled: open, // 只有當對話框打開時才啟用
		useUsdRates: true, // 使用 USD 匯率
	});

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

	// 監聽分潤比例的變化，即時更新各方的分潤金額
	useEffect(() => {
		const shareable = form.watch("shareable");
		const companyProfitSharePercent =
			form.watch("companyProfitSharePercent") || 0;
		const rmProfitSharePercent = form.watch("rmProfitSharePercent") || 0;
		const finderProfitSharePercent =
			form.watch("finderProfitSharePercent") || 0;
		const fxRate = form.watch("fxRate") || 1;

		// 計算各方分潤金額
		const rmRevenue = (shareable * rmProfitSharePercent) / 100;
		const findersRevenue = (shareable * finderProfitSharePercent) / 100;
		const companyRevenue = (shareable * companyProfitSharePercent) / 100;

		// 更新原幣分潤金額
		form.setValue("rmRevenueOriginal", Math.round(rmRevenue * 100) / 100);
		form.setValue(
			"findersRevenueOriginal",
			Math.round(findersRevenue * 100) / 100,
		);
		form.setValue(
			"companyRevenueOriginal",
			Math.round(companyRevenue * 100) / 100,
		);

		// 更新美金分潤金額
		form.setValue(
			"rmRevenueUSD",
			Math.round(rmRevenue * fxRate * 100) / 100,
		);
		form.setValue(
			"findersRevenueUSD",
			Math.round(findersRevenue * fxRate * 100) / 100,
		);

		// 更新個別 RM 和 Finder 的分潤金額
		const rm1ProfitSharePercent = form.watch("rm1ProfitSharePercent") || 0;
		const rm2ProfitSharePercent = form.watch("rm2ProfitSharePercent") || 0;
		const finder1ProfitSharePercent =
			form.watch("finder1ProfitSharePercent") || 0;
		const finder2ProfitSharePercent =
			form.watch("finder2ProfitSharePercent") || 0;

		// 計算並更新 RM1 的分潤金額
		const rm1Revenue = (rmRevenue * rm1ProfitSharePercent) / 100;
		form.setValue("rm1RevenueOriginal", Math.round(rm1Revenue * 100) / 100);
		form.setValue(
			"rm1RevenueUSD",
			Math.round(rm1Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 RM2 的分潤金額
		const rm2Revenue = (rmRevenue * rm2ProfitSharePercent) / 100;
		form.setValue("rm2RevenueOriginal", Math.round(rm2Revenue * 100) / 100);
		form.setValue(
			"rm2RevenueUSD",
			Math.round(rm2Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 Finder1 的分潤金額
		const finder1Revenue =
			(findersRevenue * finder1ProfitSharePercent) / 100;
		form.setValue(
			"finder1RevenueOriginal",
			Math.round(finder1Revenue * 100) / 100,
		);
		form.setValue(
			"finder1RevenueUSD",
			Math.round(finder1Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 Finder2 的分潤金額
		const finder2Revenue =
			(findersRevenue * finder2ProfitSharePercent) / 100;
		form.setValue(
			"finder2RevenueOriginal",
			Math.round(finder2Revenue * 100) / 100,
		);
		form.setValue(
			"finder2RevenueUSD",
			Math.round(finder2Revenue * fxRate * 100) / 100,
		);
	}, [
		form.watch("shareable"),
		form.watch("companyProfitSharePercent"),
		form.watch("rmProfitSharePercent"),
		form.watch("finderProfitSharePercent"),
		form.watch("fxRate"),
		form.watch("rm1ProfitSharePercent"),
		form.watch("rm2ProfitSharePercent"),
		form.watch("finder1ProfitSharePercent"),
		form.watch("finder2ProfitSharePercent"),
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
		}
	}, [
		form.watch("customerId"),
		customers,
		fetchBankAccounts,
		fetchRMsAndFinders,
	]);

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
				let errorMessage = "新增失敗";
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
					errorMessage = "新增失敗";
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
			alert(error instanceof Error ? error.message : "新增失敗");
		} finally {
			setIsLoading(false);
		}
	};

	// 計算總分潤比例
	const totalProfitSharePercent = calculateTotalProfitSharePercent(
		form.watch("companyProfitSharePercent") || 0,
		form.watch("rm1ProfitSharePercent") || 0,
		form.watch("rm2ProfitSharePercent") || 0,
		form.watch("finder1ProfitSharePercent") || 0,
		form.watch("finder2ProfitSharePercent") || 0,
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8">
					<Plus className="h-4 w-4 mr-2" />
					新增分潤
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-[90vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>新增分潤記錄</DialogTitle>
					<DialogDescription>
						填寫分潤記錄的基本資訊和分潤比例分配。
					</DialogDescription>
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
							/>

							{/* 可分潤金額區塊 */}
							<ShareableAmountSection form={form} />

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
								取消
							</Button>
							<Button
								type="submit"
								disabled={
									isLoading ||
									!isValidProfitSharePercent(
										totalProfitSharePercent,
									)
								}
							>
								{isLoading ? "新增中..." : "新增"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
