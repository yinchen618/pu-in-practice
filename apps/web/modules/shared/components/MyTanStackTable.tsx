"use client";

import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@ui/lib";
import { Loader2Icon } from "lucide-react";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Button } from "@ui/components/button";
import {} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	CheckCheckIcon,
	GripVerticalIcon,
	PencilIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddDialog } from "./mtst/AddDialog";
import { BatchAddDialog } from "./mtst/BatchAddDialog";
import { TableHeader } from "./mtst/TableHeader";

interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
	id: string;
	children: React.ReactNode;
	showDragHandle?: boolean;
	onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
	selectedRowId?: string | null;
}

function SortableRow({
	id,
	children,
	showDragHandle,
	selectedRowId,
	...props
}: SortableRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<tr
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...props}
			className={cn(
				"group hover:bg-muted/50",
				props.onClick && "cursor-pointer",
				selectedRowId === id && "bg-primary/15 hover:bg-primary/20",
			)}
		>
			{children}
			{showDragHandle && (
				<td className="w-[50px] p-2">
					<div
						{...listeners}
						className="flex cursor-grab justify-center hover:text-accent-foreground active:cursor-grabbing"
					>
						<GripVerticalIcon className="h-4 w-4" />
					</div>
				</td>
			)}
		</tr>
	);
}

export interface ExtendedColumnDef<T> extends Omit<ColumnDef<T>, "cell"> {
	id: string;
	type?: "text" | "select" | "display" | "number" | "date";
	options?: string[] | Record<string, string>;
	editable?: boolean;
	width?: number | string;
	required?: boolean;
	cell?: (props: { getValue: () => any; row: any }) => React.ReactNode;
	accessorFn?: (row: T) => any;
	accessorKey?: string;
	header?: string | ((props: any) => React.ReactNode);
	showBatchAdd?: boolean;
	onChange?: (value: any, row: T) => void;
	dependsOn?: string;
	dependsInitial?: Array<Record<string, any>>;
}

export interface ITableProps<T> {
	title?: string;
	data: T[];
	columns: ExtendedColumnDef<T>[];
	pageSize?: number;
	onAdd?: (data: Partial<T>) => void;
	onBatchAdd?: (
		dataList: Partial<T>[],
	) => Promise<{ success: boolean; errors?: string[] }>;
	onDelete?: (id: string) => void;
	onUpdate?: (id: string, data: Partial<T>) => void;
	onReorder?: (startIndex: number, endIndex: number) => void;
	onRowClick?: (row: T) => void;
	isLoading?: boolean;
	searchColumn?: string;
	defaultValues?: Partial<T>;
	selectedRowId?: string | null;
	defaultBatchValues?: string;
}

export function MyTanStackTable<T extends { id: string }>({
	title,
	data,
	columns,
	pageSize = 10,
	onAdd,
	onBatchAdd,
	onDelete,
	onUpdate,
	onReorder,
	onRowClick,
	isLoading,
	searchColumn = "name",
	defaultValues = {},
	selectedRowId,
	defaultBatchValues = "",
}: ITableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		{},
	);
	const [rowSelection, setRowSelection] = useState({});
	const [editingRow, setEditingRow] = useState<string | null>(null);
	const [editedData, setEditedData] = useState<Partial<T> | null>(null);
	const [showSortHandle, setShowSortHandle] = useState(false);
	const [originalData, setOriginalData] = useState<T[]>([]);
	const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newRowData, setNewRowData] = useState<Partial<T>>(defaultValues);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showBatchAddDialog, setShowBatchAddDialog] = useState(false);
	const [batchAddContent, setBatchAddContent] = useState(defaultBatchValues);
	const [batchAddErrors, setBatchAddErrors] = useState<string[]>([]);
	const [isBatchAdding, setIsBatchAdding] = useState(false);

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor),
	);

	const table = useReactTable({
		data,
		columns: columns as ColumnDef<T>[],
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	useEffect(() => {
		table.setPageSize(pageSize);
	}, [pageSize, table]);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id || !onReorder) {
				return;
			}

			const oldIndex = data.findIndex((item) => item.id === active.id);
			const newIndex = data.findIndex((item) => item.id === over.id);

			setIsUpdating(true);
			try {
				await onReorder(oldIndex, newIndex);
			} finally {
				setIsUpdating(false);
			}
		},
		[data, onReorder],
	);

	const handleAdd = () => {
		const initialData = { ...defaultValues } as Partial<T>;
		columns.forEach((column) => {
			if (column.id && !(column.id in initialData)) {
				if (column.type === "number") {
					initialData[column.id as keyof T] = 0 as any;
				} else if (column.type === "select" && column.options) {
					// 如果是下拉菜单，选择第一个选项作为默认值
					if (Array.isArray(column.options)) {
						initialData[column.id as keyof T] = column
							.options[0] as any;
					} else {
						initialData[column.id as keyof T] = Object.keys(
							column.options,
						)[0] as any;
					}
				}
			}
		});
		setNewRowData(initialData);
		setShowAddDialog(true);
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUpdating(true);
		try {
			await onAdd?.(newRowData);
			setShowAddDialog(false);
			setNewRowData({});
		} catch (error) {
			console.error("Add error:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleStartSort = () => {
		setShowSortHandle(true);
		setOriginalData([...data]);
	};

	const handleFinishSort = () => {
		setShowSortHandle(false);
		setOriginalData([]);
	};

	const handleCancelSort = () => {
		setShowSortHandle(false);
		setOriginalData([]);
	};

	const handleDelete = async (id: string) => {
		if (onDelete) {
			setIsUpdating(true);
			try {
				await onDelete(id);
			} finally {
				setIsUpdating(false);
			}
		}
		setDeleteRowId(null);
	};

	const handleStartEdit = (row: T) => {
		setEditingRow(row.id);
		setEditedData({} as Partial<T>);
	};

	const handleSaveEdit = async () => {
		if (editingRow && editedData && onUpdate) {
			setIsUpdating(true);
			try {
				await onUpdate(editingRow, editedData);
			} finally {
				setIsUpdating(false);
			}
		}
		setEditingRow(null);
		setEditedData(null);
	};

	const handleCancelEdit = () => {
		setEditingRow(null);
		setEditedData(null);
	};

	const handleFieldChange = (
		id: string,
		field: keyof T,
		value: any,
		column?: ExtendedColumnDef<T>,
	) => {
		setEditedData(
			(prev) =>
				({
					...(prev || {}),
					[field]: value,
				}) as Partial<T>,
		);

		// 如果有onChange处理函数，调用它
		if (column?.onChange) {
			const currentRow = data.find((item) => item.id === id);
			if (currentRow) {
				column.onChange(value, currentRow);
			}
		}
	};

	const renderCell = useCallback(
		(cell: any, row: any) => {
			const value = cell.getValue();
			const column = cell.column.columnDef as ExtendedColumnDef<T>;
			const isEditing = editingRow === row.original.id;

			if (column.id === "actions") {
				return flexRender(column.cell, { getValue: () => value, row });
			}

			if (!isEditing || !column.editable) {
				if (column.cell) {
					return (
						<div className="cursor-default">
							{column.cell({ getValue: () => value, row })}
						</div>
					);
				}
				return <div className="cursor-default">{value}</div>;
			}

			const editedValue = editedData?.[column.id as keyof T] ?? value;

			if (column.type === "select" && column.options) {
				return (
					<div className="relative cursor-pointer">
						{isUpdating && editingRow === row.original.id && (
							<div className="absolute inset-0 z-50 flex items-center justify-center rounded-md bg-background/50 backdrop-blur-sm">
								<Loader2Icon className="h-4 w-4 animate-spin" />
							</div>
						)}
						<Select
							value={String(editedValue ?? "")}
							onValueChange={(newValue) => {
								handleFieldChange(
									row.original.id,
									column.id as keyof T,
									newValue,
									column,
								);
							}}
							disabled={isUpdating}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Array.isArray(column.options)
									? column.options.map((option: string) => (
											<SelectItem
												key={option}
												value={option}
											>
												{option}
											</SelectItem>
										))
									: Object.entries(column.options).map(
											([value, label]) => (
												<SelectItem
													key={value}
													value={value}
												>
													{label}
												</SelectItem>
											),
										)}
							</SelectContent>
						</Select>
					</div>
				);
			}

			return (
				<div className="relative cursor-text">
					{isUpdating && editingRow === row.original.id && (
						<div className="absolute inset-0 z-50 flex items-center justify-center rounded-md bg-background/50 backdrop-blur-sm">
							<Loader2Icon className="h-4 w-4 animate-spin" />
						</div>
					)}
					<Input
						value={editedValue ?? ""}
						onChange={(e) =>
							handleFieldChange(
								row.original.id,
								column.id as keyof T,
								column.type === "number"
									? Number(e.target.value)
									: e.target.value,
								column,
							)
						}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSaveEdit();
							}
						}}
						type={
							column.type === "number"
								? "number"
								: column.type === "date"
									? "date"
									: "text"
						}
						className="w-full"
						disabled={isUpdating}
						autoFocus
					/>
				</div>
			);
		},
		[editingRow, editedData, handleSaveEdit],
	);

	const actionColumn: ExtendedColumnDef<T> = {
		id: "actions",
		header: "操作",
		width: 120,
		cell: ({ row }) => {
			const isEditing = editingRow === row.original.id;
			return (
				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleSaveEdit}
								disabled={showSortHandle}
								className="h-8 w-8 cursor-default hover:cursor-pointer"
							>
								<span className="text-green-600 group-hover:text-green-800">
									<CheckCheckIcon className="h-4 w-4" />
								</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleCancelEdit}
								disabled={showSortHandle}
								className="h-8 w-8 cursor-default hover:cursor-pointer"
							>
								<span className="text-red-600 group-hover:text-red-800">
									<XIcon className="h-4 w-4" />
								</span>
							</Button>
						</>
					) : (
						<>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleStartEdit(row.original)}
								disabled={showSortHandle}
								className="group h-8 w-8 cursor-default hover:cursor-pointer"
							>
								<span className="text-blue-600 group-hover:text-blue-800">
									<PencilIcon className="h-4 w-4" />
								</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setDeleteRowId(row.original.id)}
								disabled={showSortHandle}
								className="group h-8 w-8 cursor-default hover:cursor-pointer"
							>
								<span className="text-red-600 group-hover:text-red-800">
									<TrashIcon className="h-4 w-4" />
								</span>
							</Button>
						</>
					)}
				</div>
			);
		},
	};

	const allColumns = [actionColumn, ...columns];

	// 生成列名映射說明
	const columnMappings = useMemo(() => {
		return columns
			.filter(
				(col) => col.editable !== false && col.showBatchAdd !== false,
			)
			.map((col) => ({
				id: col.id,
				header: typeof col.header === "string" ? col.header : col.id,
			}));
	}, [columns]);

	// 處理批量添加
	const handleBatchAdd = async () => {
		if (!onBatchAdd) {
			return;
		}

		setIsBatchAdding(true);
		setBatchAddErrors([]);

		try {
			const lines = batchAddContent
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

			const dataList = lines.map((line) => {
				const values = line.split(",").map((v) => v.trim());
				const data: Partial<T> = {};

				columnMappings.forEach((col, index) => {
					if (values[index] !== undefined) {
						const column = columns.find((c) => c.id === col.id);
						if (column) {
							let value: any = values[index];
							if (column.type === "number") {
								value = Number(value) || 0;
							}
							(data as any)[col.id] = value;
						}
					}
				});

				return data;
			});

			const result = await onBatchAdd(dataList);
			if (!result.success) {
				setBatchAddErrors(result.errors || ["批量新增失敗"]);
			} else {
				setShowBatchAddDialog(false);
				setBatchAddContent("");
			}
		} catch (error) {
			setBatchAddErrors(["處理數據時發生錯誤"]);
		} finally {
			setIsBatchAdding(false);
		}
	};

	return (
		<div className="space-y-4">
			{title && <h2 className="text-2xl font-bold">{title}</h2>}
			<TableHeader
				searchColumn={searchColumn}
				table={table}
				onAdd={onAdd}
				onBatchAdd={onBatchAdd}
				onReorder={onReorder}
				showSortHandle={showSortHandle}
				editingRow={editingRow}
				handleAdd={handleAdd}
				setShowBatchAddDialog={setShowBatchAddDialog}
				handleFinishSort={handleFinishSort}
				handleCancelSort={handleCancelSort}
				handleStartSort={handleStartSort}
			/>

			{onReorder ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					modifiers={[restrictToVerticalAxis]}
				>
					<div className="relative rounded-md border">
						{(isLoading || isUpdating) && (
							<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
								<div className="flex items-center gap-2">
									<Loader2Icon className="h-6 w-6 animate-spin" />
									<span>載入中...</span>
								</div>
							</div>
						)}
						<div className="w-full overflow-auto">
							<table className="w-full caption-bottom text-sm">
								<thead className="[&_tr]:border-b">
									<tr>
										{allColumns.map((column, index) => (
											<th
												key={column.id || index}
												className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
												style={{ width: column.width }}
											>
												{typeof column.header ===
												"string"
													? column.header
													: column.id}
											</th>
										))}
										{showSortHandle && (
											<th className="w-[50px]" />
										)}
									</tr>
								</thead>
								<SortableContext
									items={data.map((item) => item.id)}
									strategy={verticalListSortingStrategy}
								>
									<tbody
										className={cn(
											"border-0",
											isLoading && "opacity-50",
										)}
									>
										{table.getRowModel().rows.length ===
										0 ? (
											<tr>
												<td
													colSpan={
														allColumns.length +
														(showSortHandle ? 1 : 0)
													}
													className="h-24 text-center align-middle text-muted-foreground"
												>
													無資料
												</td>
											</tr>
										) : (
											table
												.getRowModel()
												.rows.map((row) => (
													<SortableRow
														key={row.original.id}
														id={row.original.id}
														showDragHandle={
															showSortHandle
														}
														selectedRowId={
															selectedRowId
														}
														onClick={
															onRowClick &&
															!editingRow &&
															!showSortHandle
																? (e) => {
																		// 防止點擊按鈕時觸發行點擊
																		if (
																			(
																				e.target as HTMLElement
																			).closest(
																				"button",
																			)
																		) {
																			return;
																		}
																		onRowClick(
																			row.original,
																		);
																	}
																: undefined
														}
													>
														{allColumns.map(
															(column, index) => (
																<td
																	key={
																		column.id ||
																		index
																	}
																	className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
																>
																	{renderCell(
																		{
																			getValue:
																				() =>
																					row
																						.original[
																						column.id as keyof T
																					],
																			column: {
																				columnDef:
																					column,
																			},
																		},
																		row,
																	)}
																</td>
															),
														)}
													</SortableRow>
												))
										)}
									</tbody>
								</SortableContext>
							</table>
						</div>
					</div>
				</DndContext>
			) : (
				<div className="relative rounded-md border">
					{(isLoading || isUpdating) && (
						<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
							<div className="flex items-center gap-2">
								<Loader2Icon className="h-6 w-6 animate-spin" />
								<span>載入中...</span>
							</div>
						</div>
					)}
					<div className="w-full overflow-auto">
						<table className="w-full caption-bottom text-sm">
							<thead className="[&_tr]:border-b">
								<tr>
									{allColumns.map((column, index) => (
										<th
											key={column.id || index}
											className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
											style={{ width: column.width }}
										>
											{typeof column.header === "string"
												? column.header
												: column.id}
										</th>
									))}
								</tr>
							</thead>
							<tbody
								className={cn(
									"border-0",
									isLoading && "opacity-50",
								)}
							>
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={allColumns.length}
											className="h-24 text-center align-middle text-muted-foreground"
										>
											無資料
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr
											key={row.original.id}
											className={cn(
												"border-b transition-colors hover:bg-muted/50",
												onRowClick && "cursor-pointer",
												selectedRowId ===
													row.original.id &&
													"bg-accent/10 hover:bg-accent/15",
											)}
											onClick={
												onRowClick && !editingRow
													? (e) => {
															// 防止點擊按鈕時觸發行點擊
															if (
																(
																	e.target as HTMLElement
																).closest(
																	"button",
																)
															) {
																return;
															}
															onRowClick(
																row.original,
															);
														}
													: undefined
											}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" &&
													onRowClick &&
													!editingRow
												) {
													onRowClick(row.original);
												}
											}}
											tabIndex={
												onRowClick ? 0 : undefined
											}
											role={
												onRowClick
													? "button"
													: undefined
											}
										>
											{allColumns.map((column, index) => (
												<td
													key={column.id || index}
													className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
													style={{
														width: column.width,
													}}
												>
													{renderCell(
														{
															getValue: () =>
																row.original[
																	column.id as keyof T
																],
															column: {
																columnDef:
																	column,
															},
														},
														row,
													)}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						上一頁
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						下一頁
					</Button>
					<Select
						value={String(table.getState().pagination.pageSize)}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 20, 50, 100].map((pageSize) => (
								<SelectItem
									key={pageSize}
									value={String(pageSize)}
								>
									顯示 {pageSize} 列
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm">
						第 {table.getState().pagination.pageIndex + 1} 頁，共{" "}
						{table.getPageCount()} 頁
					</span>
					<span className="text-sm text-muted-foreground">
						（共 {table.getFilteredRowModel().rows.length} 列）
					</span>
				</div>
			</div>

			<AddDialog
				showAddDialog={showAddDialog}
				setShowAddDialog={setShowAddDialog}
				title={title || ""}
				columns={columns}
				newRowData={newRowData}
				setNewRowData={setNewRowData}
				isUpdating={isUpdating}
				handleAddSubmit={handleAddSubmit}
			/>

			<BatchAddDialog
				showBatchAddDialog={showBatchAddDialog}
				setShowBatchAddDialog={setShowBatchAddDialog}
				title={title || ""}
				columnMappings={columnMappings}
				batchAddContent={batchAddContent}
				setBatchAddContent={setBatchAddContent}
				batchAddErrors={batchAddErrors}
				isBatchAdding={isBatchAdding}
				handleBatchAdd={handleBatchAdd}
			/>

			<AlertDialog
				open={deleteRowId !== null}
				onOpenChange={() => setDeleteRowId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>確認刪除</AlertDialogTitle>
						<AlertDialogDescription>
							您確定要刪除這筆資料嗎？此操作無法復原。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isUpdating}>
							取消
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteRowId && handleDelete(deleteRowId)
							}
							disabled={isUpdating}
						>
							{isUpdating ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									處理中...
								</>
							) : (
								"刪除"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
