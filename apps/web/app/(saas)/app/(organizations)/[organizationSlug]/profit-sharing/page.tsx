"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { DateRangePicker } from "@ui/components/date-range-picker";
import { Input } from "@ui/components/input";
import { format, startOfMonth, startOfToday } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import type { ProfitSharingRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateProfitSharingDialog } from "./components/create-profit-sharing-dialog";
import { EditProfitSharingDialog } from "./components/edit-profit-sharing-dialog";

export default function ProfitSharingPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [data, setData] = useState<ProfitSharingRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRecord, setEditingRecord] =
		useState<ProfitSharingRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [debouncedSearch] = useDebounce(search, 300);

	const createQueryString = useCallback(
		(params: Record<string, string | undefined>) => {
			const newSearchParams = new URLSearchParams(
				searchParams.toString(),
			);
			Object.entries(params).forEach(([key, value]) => {
				if (value === undefined) {
					newSearchParams.delete(key);
				} else {
					newSearchParams.set(key, value);
				}
			});
			return newSearchParams.toString();
		},
		[searchParams],
	);

	const fetchData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const queryString = createQueryString({
				organizationId: activeOrganization.id,
				search: debouncedSearch || undefined,
				from: searchParams.get("from") || undefined,
				to: searchParams.get("to") || undefined,
			});

			const response = await fetch(
				`/api/organizations/profit-sharing?${queryString}`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const result = await response.json();
				setData(result.data || []);
			} else {
				console.error("獲取分潤數據失敗", await response.text());
				setData([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setData([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (record: ProfitSharingRecord) => {
		setEditingRecord(record);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingRecord(null);
	};

	const handleSearch = (value: string) => {
		setSearch(value);
		const newQueryString = createQueryString({
			search: value || undefined,
		});
		router.push(`${pathname}?${newQueryString}`);
	};

	const handleDateRangeChange = (from?: Date, to?: Date) => {
		const newQueryString = createQueryString({
			from: from ? format(from, "yyyy-MM-dd") : undefined,
			to: to ? format(to, "yyyy-MM-dd") : undefined,
		});
		router.push(`${pathname}?${newQueryString}`);
	};

	const columns = createColumns(handleEdit);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded, debouncedSearch, searchParams]);

	if (!loaded) {
		return (
			<div className="container max-w-6xl space-y-8 py-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
					<div className="h-4 bg-gray-200 rounded w-1/2" />
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-6xl space-y-8 py-6">
			<PageHeader
				title="分潤表"
				subtitle="管理所有分潤記錄"
				actions={
					activeOrganization && (
						<CreateProfitSharingDialog
							organizationId={activeOrganization.id}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			<div className="flex items-center gap-4">
				<Input
					placeholder="搜尋分潤記錄..."
					value={search}
					onChange={(e) => handleSearch(e.target.value)}
					className="max-w-sm"
				/>
				<DateRangePicker
					from={
						searchParams.get("from")
							? new Date(searchParams.get("from")!)
							: startOfMonth(new Date())
					}
					to={
						searchParams.get("to")
							? new Date(searchParams.get("to")!)
							: startOfToday()
					}
					onFromChange={(from) =>
						handleDateRangeChange(
							from,
							searchParams.get("to")
								? new Date(searchParams.get("to")!)
								: undefined,
						)
					}
					onToChange={(to) =>
						handleDateRangeChange(
							searchParams.get("from")
								? new Date(searchParams.get("from")!)
								: undefined,
							to,
						)
					}
				/>
			</div>

			<DataTable columns={columns} data={data} isLoading={isLoading} />

			{editingRecord && (
				<EditProfitSharingDialog
					profitSharingRecord={editingRecord}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
