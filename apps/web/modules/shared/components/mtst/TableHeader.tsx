import type { Table } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import {} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { CheckCheckIcon, GripVerticalIcon, RotateCcwIcon } from "lucide-react";

// apps/web/modules/shared/components/MyTanStackTable/TableHeader.tsx
export interface TableHeaderProps<T> {
	searchColumn: string;
	table: Table<T>;
	onAdd?: (data: Partial<T>) => void;
	onBatchAdd?: (
		dataList: Partial<T>[],
	) => Promise<{ success: boolean; errors?: string[] }>;
	onReorder?: (startIndex: number, endIndex: number) => void;
	showSortHandle: boolean;
	editingRow: string | null;
	handleAdd: () => void;
	setShowBatchAddDialog: (show: boolean) => void;
	handleFinishSort: () => void;
	handleCancelSort: () => void;
	handleStartSort: () => void;
}

export function TableHeader<T>({
	searchColumn,
	table,
	onAdd,
	onBatchAdd,
	onReorder,
	showSortHandle,
	editingRow,
	handleAdd,
	setShowBatchAddDialog,
	handleFinishSort,
	handleCancelSort,
	handleStartSort,
}: TableHeaderProps<T>) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<Input
					placeholder="搜尋..."
					value={
						(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
					}
					onChange={(event) =>
						table.getColumn(searchColumn)?.setFilterValue(event.target.value)
					}
					className="max-w-sm cursor-text"
				/>
			</div>
			<div className="flex items-center gap-2">
				{onAdd && (
					<Button
						onClick={handleAdd}
						size="sm"
						disabled={showSortHandle || !!editingRow}
						className="cursor-pointer"
					>
						新增
					</Button>
				)}
				{onBatchAdd && (
					<Button
						onClick={() => setShowBatchAddDialog(true)}
						size="sm"
						variant="outline"
						disabled={showSortHandle || !!editingRow}
						className="cursor-pointer"
					>
						批量新增
					</Button>
				)}
				{/* 排序按钮组 */}
				{onReorder &&
					(showSortHandle ? (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={handleFinishSort}
								className="cursor-pointer"
							>
								<CheckCheckIcon className="mr-2 h-4 w-4" />
								完成
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCancelSort}
								className="cursor-pointer"
							>
								<RotateCcwIcon className="mr-2 h-4 w-4" />
								取消
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={handleStartSort}
							disabled={!!editingRow}
							className="cursor-pointer"
						>
							<GripVerticalIcon className="mr-2 h-4 w-4" />
							排序
						</Button>
					))}
			</div>
		</div>
	);
}
