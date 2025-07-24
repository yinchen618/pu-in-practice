import { DataTable } from "@saas/shared/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@ui/components/card";
import type { ProfitSharingRecord } from "../../../profit-sharing/components/columns";
import { ProfitSharingFilters } from "../../../profit-sharing/components/profit-sharing-filters";

interface Props {
	allProfitData: ProfitSharingRecord[];
	filteredProfitData: ProfitSharingRecord[];
	isProfitLoading: boolean;
	columns: ColumnDef<ProfitSharingRecord, any>[];
	onFilterChange: (d: ProfitSharingRecord[]) => void;
}

export function CustomerProfitSharingTab({
	allProfitData,
	filteredProfitData,
	isProfitLoading,
	columns,
	onFilterChange,
}: Props) {
	return (
		<Card>
			<CardContent className="pt-6">
				<ProfitSharingFilters
					data={allProfitData}
					onFilterChange={onFilterChange}
				/>
				<DataTable
					columns={columns}
					data={filteredProfitData}
					isLoading={isProfitLoading}
				/>
			</CardContent>
		</Card>
	);
}
