import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2Icon } from "lucide-react";
import type { ExtendedColumnDef } from "../MyTanStackTable";

export interface AddDialogProps<T> {
	showAddDialog: boolean;
	setShowAddDialog: (show: boolean) => void;
	title: string;
	columns: ExtendedColumnDef<T>[];
	newRowData: Partial<T>;
	setNewRowData: (data: Partial<T>) => void;
	isUpdating: boolean;
	handleAddSubmit: (e: React.FormEvent) => void;
}

export function AddDialog<T>({
	showAddDialog,
	setShowAddDialog,
	title,
	columns,
	newRowData,
	setNewRowData,
	isUpdating,
	handleAddSubmit,
}: AddDialogProps<T>) {
	return (
		<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>新增{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleAddSubmit}>
					<div className="grid gap-4 py-4">
						{columns
							.filter((column) => column.editable !== false)
							.map((column) => (
								<div key={column.id} className="grid gap-2">
									<Label
										htmlFor={column.id}
										className="flex items-center gap-1"
									>
										{typeof column.header === "string"
											? column.header
											: column.id}
										{column.required && (
											<span className="text-destructive">*</span>
										)}
									</Label>
									{column.type === "select" && column.options ? (
										<Select
											value={String(newRowData[column.id as keyof T] ?? "")}
											onValueChange={(value) => {
												const updates = {
													...newRowData,
													[column.id]: value,
												} as Partial<T>;

												// 处理依赖字段的更新
												if (column.dependsInitial?.length) {
													column.dependsInitial.forEach((depend) => {
														updates[depend.id as keyof T] = depend.value;
													});
												}

												// 先更新数据
												setNewRowData(updates);

												// 然后触发onChange
												if (column.onChange) {
													column.onChange(value, updates as T);
												}
											}}
										>
											<SelectTrigger className="col-span-3">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Array.isArray(column.options)
													? column.options?.map((option) => (
															<SelectItem
																key={`option-${column.id}-${option}`}
																value={option}
															>
																{option}
															</SelectItem>
														))
													: Object.entries(column.options || {}).map(
															([value, label]) => (
																<SelectItem
																	key={`option-${column.id}-${value}`}
																	value={value}
																>
																	{label}
																</SelectItem>
															),
														)}
											</SelectContent>
										</Select>
									) : (
										<Input
											id={column.id}
											type={
												column.type === "number"
													? "number"
													: column.type === "date"
														? "date"
														: "text"
											}
											value={
												column.type === "number"
													? (newRowData[column.id as keyof T] ?? 0).toString()
													: (newRowData[column.id as keyof T] ?? "").toString()
											}
											onChange={(e) =>
												setNewRowData({
													...newRowData,
													[column.id]:
														column.type === "number"
															? Number(e.target.value) || 0
															: e.target.value,
												} as Partial<T>)
											}
										/>
									)}
								</div>
							))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => setShowAddDialog(false)}
							disabled={isUpdating}
						>
							取消
						</Button>
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									處理中...
								</>
							) : (
								"確認"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
