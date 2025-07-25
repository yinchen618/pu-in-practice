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
	record: ProfitSharingRecord | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	onSuccess?: () => void;
}

export function EditProfitSharingDialog({
	record,
	open,
	onOpenChange,
	organizationId,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

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
		date: watchedDate || new Date().toISOString().split("T")[0],
		enabled: open, // 只有當對話框打開時才啟用
		useUsdRates: true, // 使用 USD 匯率
	});

	// 當有記錄時，填充表單數據
	useEffect(() => {
		if (record && open) {
			console.log("=== 編輯分潤記錄 - 設定表單數據 ===");
			console.log("原始記錄:", record);

			// 設定表單值
			form.setValue("customerId", record.customerId);
			form.setValue("productId", record.productId);
			form.setValue("bankAccountId", record.bankAccountId);
			form.setValue("amount", record.amount);
			form.setValue("profitDate", record.profitDate);
			form.setValue("currency", record.currency);
			form.setValue("companyRevenue", record.companyRevenue || 0);
			form.setValue(
				"directTradeBookingFee",
				record.directTradeBookingFee || 0,
			);
			form.setValue("bankRetroPercent", record.bankRetroPercent || 50);
			form.setValue("shareable", record.shareable || 0);
			form.setValue("fxRate", record.fxRate || 1);

			// 設定分潤比例
			form.setValue(
				"companyProfitSharePercent",
				record.companyProfitSharePercent || 0,
			);
			form.setValue(
				"rmProfitSharePercent",
				record.rmProfitSharePercent || 0,
			);
			form.setValue(
				"finderProfitSharePercent",
				record.finderProfitSharePercent || 0,
			);

			// 設定 RM 資訊
			if (record.rm1Id) {
				form.setValue("rm1Id", record.rm1Id);
				form.setValue("rm1Name", record.rm1Name || "");
				form.setValue(
					"rm1ProfitSharePercent",
					record.rm1ProfitSharePercent || 0,
				);
			}
			if (record.rm2Id) {
				form.setValue("rm2Id", record.rm2Id);
				form.setValue("rm2Name", record.rm2Name || "");
				form.setValue(
					"rm2ProfitSharePercent",
					record.rm2ProfitSharePercent || 0,
				);
			}

			// 設定 Finder 資訊
			if (record.finder1Id) {
				form.setValue("finder1Id", record.finder1Id);
				form.setValue("finder1Name", record.finder1Name || "");
				form.setValue(
					"finder1ProfitSharePercent",
					record.finder1ProfitSharePercent || 0,
				);
			}
			if (record.finder2Id) {
				form.setValue("finder2Id", record.finder2Id);
				form.setValue("finder2Name", record.finder2Name || "");
				form.setValue(
					"finder2ProfitSharePercent",
					record.finder2ProfitSharePercent || 0,
				);
			}

			// 載入對應的銀行帳戶
			if (record.customerId) {
				fetchBankAccounts(record.customerId);
			}
		}
	}, [record, open, form, fetchBankAccounts]);

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
		if (!record) return;

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
				let errorMessage = "更新失敗";
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
					errorMessage = "更新失敗";
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log("API 成功回應:", result);

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新分潤記錄失敗:", error);
			alert(error instanceof Error ? error.message : "更新失敗");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!record) return;

		if (!confirm("確定要刪除此分潤記錄嗎？此操作無法復原。")) {
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
				throw new Error("刪除失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除分潤記錄失敗:", error);
			alert(error instanceof Error ? error.message : "刪除失敗");
		} finally {
			setIsDeleting(false);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>編輯分潤記錄</DialogTitle>
					<DialogDescription>
						修改分潤記錄的資訊和分潤比例分配。
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

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="destructive"
								onClick={handleDelete}
								disabled={isDeleting || isLoading}
								className="mr-auto"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{isDeleting ? "刪除中..." : "刪除"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								取消
							</Button>
							<Button
								type="submit"
								disabled={
									isLoading ||
									isDeleting ||
									!isValidProfitSharePercent(
										totalProfitSharePercent,
									)
								}
							>
								{isLoading ? "更新中..." : "更新"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
