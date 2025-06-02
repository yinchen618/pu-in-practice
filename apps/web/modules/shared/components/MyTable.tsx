"use client";

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
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
import {
	ArrowUpDownIcon,
	CheckCheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	GripVerticalIcon,
	PencilLineIcon,
	PlusIcon,
	RotateCcwIcon,
	Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";

// 首先定義必要的類型
interface TableColumn {
	id: string;
	header: string;
	width: string;
	type: "text" | "select";
	editable?: boolean;
	options?: string[]; // 用於select類型
}

interface TableRow {
	id: string;
	isNew?: boolean;
	[key: string]: string | boolean | undefined;
}

interface MyTableProps {
	title: string;
	columns: TableColumn[];
	data: TableRow[];
	onDataChange: (newData: TableRow[]) => void;
	onAdd: () => void;
}

// 添加 SortableRow 的類型定義
interface SortableRowProps {
	row: any;
	children: React.ReactNode;
	disabled: boolean;
}

// 在 MyTable 組件之前添加 SortableRow 組件
function SortableRow({ row, children, disabled }: SortableRowProps) {
	const {
		attributes,
		listeners,
		transform,
		transition,
		setNodeRef,
		isDragging,
	} = useSortable({
		id: row.original.id,
		disabled,
	});

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
			className="hover:bg-gray-50 dark:hover:bg-gray-800"
		>
			{children}
			<td className="w-[50px] px-4">
				<div
					{...listeners}
					className={`flex justify-center ${
						disabled
							? "cursor-not-allowed opacity-50"
							: "cursor-grab hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
					}`}
				>
					<GripVerticalIcon
						className={`h-5 w-5 ${
							disabled
								? "text-gray-300 dark:text-gray-600"
								: "text-gray-400 dark:text-gray-500"
						}`}
					/>
				</div>
			</td>
		</tr>
	);
}

// 添加一個輔助函數來找到第一個可編輯的欄位
const findFirstEditableColumn = (columns: TableColumn[]) => {
	return columns.find((col) => col.editable)?.id;
};

// 修改表格組件
export default function MyTable({
	title,
	columns,
	data: initialData,
	onDataChange,
	onAdd,
}: MyTableProps) {
	const [data, setData] = useState<TableRow[]>(initialData);
	const [originalData, setOriginalData] = useState<TableRow[]>(initialData);
	const [editingRow, setEditingRow] = useState<number | null>(null);
	const [editedData, setEditedData] = useState<TableRow | null>(null);
	const [showSortHandle, setShowSortHandle] = useState(false);
	const [sorting, setSorting] = useState<any[]>([]);
	const inputRef = useRef(null);
	const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

	// 當數據變化時通知父組件
	useEffect(() => {
		onDataChange(data);
	}, [data, onDataChange]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (active.id !== over.id) {
			setData((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleEditClick = (rowIndex, rowData) => {
		setEditingRow(rowIndex);
		setEditedData({ ...rowData });
		// 使用 setTimeout 確保在 DOM 更新後設置焦點
		setTimeout(() => {
			const firstEditableColumnId = findFirstEditableColumn(columns);
			if (firstEditableColumnId) {
				const firstInput = document.querySelector(
					`[data-column-id="${firstEditableColumnId}"]`,
				) as HTMLElement;
				firstInput?.focus();
			}
		}, 0);
	};

	const handleAdd = () => {
		const newId = `new-${Date.now()}`;
		const newRow = {
			id: newId,
			col1: "",
			col2: "",
			col3: "選項A",
			isNew: true,
		};
		setData([newRow, ...data]);
		setEditingRow(0);
		setEditedData(newRow);

		setTimeout(() => {
			const firstEditableColumnId = findFirstEditableColumn(columns);
			if (firstEditableColumnId) {
				const firstInput = document.querySelector(
					`[data-column-id="${firstEditableColumnId}"]`,
				) as HTMLElement;
				firstInput?.focus();
			}
		}, 0);
	};

	const handleSaveClick = (rowIndex: number) => {
		if (editedData) {
			setData((old) =>
				old.map((row, index) => (index === rowIndex ? editedData : row)),
			);
			setEditingRow(null);
			setEditedData(null);
		}
	};

	const handleCancelClick = () => {
		if (editingRow === 0 && data[0]?.isNew) {
			setData((prev) => prev.slice(1));
		}
		setEditingRow(null);
		setEditedData(null);
	};

	const handleStartSort = () => {
		if (editingRow !== null) {
			setEditingRow(null);
			setEditedData(null);
		}
		setShowSortHandle(true);
		setOriginalData([...data]);
	};

	const handleFinishSort = () => {
		setShowSortHandle(false);
		setOriginalData(null);
	};

	const handleCancelSort = () => {
		setData([...originalData]);
		setShowSortHandle(false);
		setOriginalData(null);
	};

	const handleSort = (column) => {
		if (!showSortHandle) {
			column.toggleSorting();
		}
	};

	const handleKeyDown = (e, column) => {
		if (!showSortHandle && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			column.toggleSorting();
		}
	};

	const handleDelete = (id) => {
		setData((prev) => prev.filter((item) => item.id !== id));
		setDeleteRowId(null);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent, columnId: string) => {
		if (e.key === "Tab") {
			e.preventDefault(); // 阻止默認的 tab 行為
			const currentIndex = columns.findIndex((c) => c.id === columnId);
			let nextIndex = currentIndex + (e.shiftKey ? -1 : 1);

			// 尋找下一個可編輯的欄位
			while (nextIndex >= 0 && nextIndex < columns.length) {
				if (columns[nextIndex].editable) {
					const nextInput = document.querySelector(
						`[data-column-id="${columns[nextIndex].id}"]`,
					) as HTMLElement;
					if (nextInput) {
						nextInput.focus();
						if (nextInput.tagName === "INPUT") {
							(nextInput as HTMLInputElement).select();
						}
						return; // 找到可編輯欄位後退出
					}
				}
				nextIndex += e.shiftKey ? -1 : 1; // 繼續尋找下一個欄位
			}

			// 如果沒有找到下一個可編輯欄位，讓焦點移出表格
			if (nextIndex < 0 || nextIndex >= columns.length) {
				e.preventDefault = () => {}; // 重置 preventDefault
				const event = new KeyboardEvent("keydown", {
					key: "Tab",
					shiftKey: e.shiftKey,
					bubbles: true,
				});
				e.target.dispatchEvent(event);
			}
		}
	};

	const columnHelper = createColumnHelper<TableRow>();

	const tableColumns = [
		columnHelper.display({
			id: "actions",
			size: 80,
			cell: ({ row }) => {
				const isEditing = editingRow === row.index;
				return (
					<div className="flex gap-2">
						{isEditing ? (
							<>
								<button
									type="button"
									onClick={() => handleSaveClick(row.index)}
									className="cursor-pointer text-green-600 hover:text-green-800"
								>
									<CheckCheckIcon className="h-5 w-5" />
								</button>
								<button
									type="button"
									onClick={handleCancelClick}
									className="cursor-pointer text-red-600 hover:text-red-800"
								>
									<LuX className="h-5 w-5" />
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => handleEditClick(row.index, row.original)}
									className={`${
										showSortHandle
											? "cursor-not-allowed text-gray-400"
											: "cursor-pointer text-blue-600 hover:text-blue-800"
									}`}
									disabled={showSortHandle}
								>
									<PencilLineIcon className="h-5 w-5" />
								</button>
								<button
									type="button"
									onClick={() => setDeleteRowId(row.original.id)}
									className={`${
										showSortHandle
											? "cursor-not-allowed text-gray-400"
											: "cursor-pointer text-red-600 hover:text-red-800"
									}`}
									disabled={showSortHandle}
								>
									<Trash2Icon className="h-5 w-5" />
								</button>
							</>
						)}
					</div>
				);
			},
		}),
		...columns.map((col) =>
			columnHelper.accessor(col.id as keyof TableRow, {
				header: ({ column }) => (
					<button
						type="button"
						disabled={showSortHandle}
						className={`flex w-full items-center gap-2 text-left ${
							!showSortHandle
								? "cursor-pointer hover:text-gray-700"
								: "cursor-default"
						}`}
						onClick={() => handleSort(column)}
						onKeyDown={(e) => handleKeyDown(e, col.id)}
					>
						<span>{col.header}</span>
						{!showSortHandle && (
							<span className="inline-flex">
								{column.getIsSorted() === "asc" ? (
									<ChevronUpIcon className="h-4 w-4" />
								) : column.getIsSorted() === "desc" ? (
									<ChevronDownIcon className="h-4 w-4" />
								) : (
									<ArrowUpDownIcon className="h-4 w-4 text-gray-400" />
								)}
							</span>
						)}
					</button>
				),
				size: Number.parseInt(col.width),
				cell: ({ row, getValue }) => {
					const isEditing = editingRow === row.index;
					const value = getValue();

					if (!col.editable || !isEditing) {
						return (
							<div
								style={{ width: col.width }}
								className="cursor-default truncate p-1 dark:text-gray-100"
							>
								{value}
							</div>
						);
					}

					return (
						<div style={{ width: col.width }}>
							{col.type === "select" ? (
								<select
									value={editedData?.[col.id] ?? value}
									onChange={(e) => {
										const updatedData = {
											...editedData!,
											[col.id]: e.target.value,
										};
										setEditedData(updatedData);
									}}
									onKeyDown={(e) => handleInputKeyDown(e, col.id)}
									data-column-id={col.id}
									className="w-full cursor-pointer rounded border p-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
								>
									{col.options?.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							) : (
								<input
									type="text"
									value={editedData?.[col.id] ?? value}
									onChange={(e) => {
										const updatedData = {
											...editedData!,
											[col.id]: e.target.value,
										};
										setEditedData(updatedData);
									}}
									onKeyDown={(e) => handleInputKeyDown(e, col.id)}
									data-column-id={col.id}
									className="w-full cursor-text rounded border p-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
								/>
							)}
						</div>
					);
				},
			}),
		),
	];

	const table = useReactTable({
		data,
		columns: tableColumns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<div className="font-bold text-xl dark:text-white">{title}</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleAdd}
						disabled={showSortHandle || editingRow !== null}
						className={`flex items-center gap-2 rounded px-4 py-2 transition-colors ${
							showSortHandle || editingRow !== null
								? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
								: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
						}`}
					>
						<PlusIcon className="h-5 w-5" />
						新增
					</button>
					{!showSortHandle ? (
						<button
							type="button"
							onClick={handleStartSort}
							disabled={editingRow !== null}
							className={`flex items-center gap-2 rounded px-4 py-2 transition-colors ${
								editingRow !== null
									? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
									: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
							}`}
						>
							<GripVerticalIcon className="h-5 w-5" />
							排序
						</button>
					) : (
						<>
							<button
								type="button"
								onClick={handleFinishSort}
								className="flex items-center gap-2 rounded bg-emerald-50 px-4 py-2 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
							>
								<CheckCheckIcon className="h-5 w-5" />
								完成
							</button>
							<button
								type="button"
								onClick={handleCancelSort}
								className="flex items-center gap-2 rounded bg-rose-50 px-4 py-2 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900"
							>
								<RotateCcwIcon className="h-5 w-5" />
								取消
							</button>
						</>
					)}
				</div>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<table className="min-w-full table-fixed divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
					<thead className="bg-gray-50 dark:bg-gray-800">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										style={{ width: header.column.columnDef.size }}
										className="cursor-default bg-gray-50 px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:bg-gray-800 dark:text-gray-400"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}

								<th className="w-[50px] bg-gray-50 dark:bg-gray-800" />
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						<SortableContext
							items={data.map((item) => item.id)}
							strategy={verticalListSortingStrategy}
						>
							{table.getRowModel().rows.map((row) => (
								<SortableRow
									key={row.original.id}
									row={row}
									disabled={!showSortHandle}
								>
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											style={{ width: cell.column.columnDef.size }}
											className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-gray-100"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</SortableRow>
							))}
						</SortableContext>
					</tbody>
				</table>
			</DndContext>

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
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => handleDelete(deleteRowId)}
							className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
						>
							刪除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
