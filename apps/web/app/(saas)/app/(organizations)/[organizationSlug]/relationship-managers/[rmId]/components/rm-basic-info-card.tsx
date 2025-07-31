"use client";

import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useTranslations } from "next-intl";
import type { RMRecord } from "../../components/columns";

interface RMBasicInfoCardProps {
	rmRecord: RMRecord;
}

export function RMBasicInfoCard({ rmRecord }: RMBasicInfoCardProps) {
	const t = useTranslations("organization.relationshipManagers");

	const getCategoryLabel = (category: string) => {
		switch (category) {
			case "FINDER":
				return t("category.finder");
			case "RM":
				return t("category.rm");
			case "BOTH":
				return t("category.both");
			default:
				return category;
		}
	};

	const getCategoryStatus = (category: string) => {
		switch (category) {
			case "FINDER":
				return "warning";
			case "RM":
				return "info";
			case "BOTH":
				return "success";
			default:
				return "info";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{t("basicInfo")}
					<Badge
						status={
							rmRecord.status === "active" ? "success" : "info"
						}
					>
						{rmRecord.status === "active"
							? t("statusLabels.active")
							: t("statusLabels.inactive")}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.rmName")}
						</div>
						<p className="text-lg font-semibold">{rmRecord.name}</p>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.email")}
						</div>
						<p className="text-lg">{rmRecord.email}</p>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.phone")}
						</div>
						<p className="text-lg">{rmRecord.phone || "-"}</p>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.category")}
						</div>
						<Badge status={getCategoryStatus(rmRecord.category)}>
							{getCategoryLabel(rmRecord.category)}
						</Badge>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.joinDate")}
						</div>
						<p className="text-lg">
							{new Date(rmRecord.joinDate).toLocaleDateString(
								"zh-TW",
							)}
						</p>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("table.resignDate")}
						</div>
						<p className="text-lg">
							{rmRecord.resignDate
								? new Date(
										rmRecord.resignDate,
									).toLocaleDateString("zh-TW")
								: "-"}
						</p>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							{t("customerCount")}
						</div>
						<p className="text-lg">{rmRecord.customerCount || 0}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
