"use client";

import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Calculator, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExpenseRecord } from "./columns";

interface ExpenseSummaryTableProps {
	data: ExpenseRecord[];
}

interface CategorySummary {
	category: string;
	sgdTotal: number;
	usdTotal: number;
	count: number;
}

export function ExpenseSummaryTable({ data }: ExpenseSummaryTableProps) {
	const t = useTranslations("organization.expenses.summary");

	// 計算各類別統計
	const categorySummaries = data.reduce(
		(acc, expense) => {
			const category = expense.category || t("uncategorized");
			const sgdAmount = Number(expense.sgdAmount) || 0;
			const usdAmount = Number(expense.usdAmount) || 0;

			if (!acc[category]) {
				acc[category] = {
					category,
					sgdTotal: 0,
					usdTotal: 0,
					count: 0,
				};
			}

			acc[category].sgdTotal += sgdAmount;
			acc[category].usdTotal += usdAmount;
			acc[category].count += 1;

			return acc;
		},
		{} as Record<string, CategorySummary>,
	);

	// 轉換為陣列並排序
	const sortedSummaries = Object.values(categorySummaries).sort(
		(a, b) => b.sgdTotal - a.sgdTotal,
	);

	// 計算總計
	const totalSgd = sortedSummaries.reduce(
		(sum, item) => sum + item.sgdTotal,
		0,
	);
	const totalUsd = sortedSummaries.reduce(
		(sum, item) => sum + item.usdTotal,
		0,
	);
	const totalCount = sortedSummaries.reduce(
		(sum, item) => sum + item.count,
		0,
	);

	if (data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calculator className="size-5" />
						{t("title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-center py-8">
						{t("noData")}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calculator className="size-5" />
					{t("title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("category")}</TableHead>
							<TableHead className="text-center">
								{t("count")}
							</TableHead>
							<TableHead className="text-right">
								{t("sgdAmount")}
							</TableHead>
							<TableHead className="text-right">
								{t("usdAmount")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedSummaries.map((summary) => (
							<TableRow key={summary.category}>
								<TableCell className="font-medium">
									{summary.category}
								</TableCell>
								<TableCell className="text-center">
									<Badge status="info">{summary.count}</Badge>
								</TableCell>
								<TableCell className="text-right font-mono">
									S${" "}
									{summary.sgdTotal.toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</TableCell>
								<TableCell className="text-right font-mono">
									US${" "}
									{summary.usdTotal.toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</TableCell>
							</TableRow>
						))}
						{/* 總計行 */}
						<TableRow className="border-t-2 border-primary/20 bg-muted/30">
							<TableCell className="font-bold flex items-center gap-2">
								<TrendingUp className="size-4" />
								{t("total")}
							</TableCell>
							<TableCell className="text-center">
								<Badge status="info" className="font-bold">
									{totalCount}
								</Badge>
							</TableCell>
							<TableCell className="text-right font-mono font-bold text-primary">
								S${" "}
								{totalSgd.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</TableCell>
							<TableCell className="text-right font-mono font-bold text-primary">
								US${" "}
								{totalUsd.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
