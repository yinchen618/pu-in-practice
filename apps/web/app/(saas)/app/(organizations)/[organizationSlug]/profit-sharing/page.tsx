import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useTranslations } from "next-intl";
import { columns } from "./components/columns";

export default function ProfitSharingPage() {
	const t = useTranslations();

	return (
		<div className="container max-w-6xl space-y-8 py-6">
			<PageHeader title="分潤表" subtitle="查看和管理所有分潤記錄" />

			<DataTable
				columns={columns}
				data={[]} // 这里之后会接入真实数据
			/>
		</div>
	);
}
