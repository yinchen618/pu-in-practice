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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { RMRecord } from "./columns";

const editRMSchema = z.object({
	name: z.string().min(1, "姓名是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	status: z.enum(["active", "inactive"]),
	category: z.enum(["FINDER", "RM", "BOTH"]),
});

type EditRMFormData = z.infer<typeof editRMSchema>;

interface EditRMDialogProps {
	rmRecord: RMRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditRMDialog({
	rmRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditRMDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<EditRMFormData>({
		resolver: zodResolver(editRMSchema),
		defaultValues: {
			name: rmRecord.name,
			email: rmRecord.email,
			phone: rmRecord.phone || "",
			status: rmRecord.status,
			category: rmRecord.category,
		},
	});

	const statusValue = watch("status");
	const categoryValue = watch("category");

	useEffect(() => {
		if (open) {
			setValue("name", rmRecord.name);
			setValue("email", rmRecord.email);
			setValue("phone", rmRecord.phone || "");
			setValue("status", rmRecord.status);
			setValue("category", rmRecord.category);
		}
	}, [open, rmRecord, setValue]);

	const onSubmit = async (data: EditRMFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/relationship-managers/${rmRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "更新失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新 RM 失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (
			!confirm(
				`您確定要刪除客戶關係經理「${rmRecord.name}」嗎？此操作無法復原。`,
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/relationship-managers/${rmRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "刪除失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除 RM 失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>編輯客戶關係經理</DialogTitle>
					<DialogDescription>
						修改客戶關係經理的資訊。
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								姓名 *
							</Label>
							<div className="col-span-3">
								<Input
									id="name"
									{...register("name")}
									placeholder="輸入姓名"
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-500">
										{errors.name.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="email" className="text-right">
								電子郵件 *
							</Label>
							<div className="col-span-3">
								<Input
									id="email"
									type="email"
									{...register("email")}
									placeholder="輸入電子郵件"
								/>
								{errors.email && (
									<p className="mt-1 text-sm text-red-500">
										{errors.email.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="phone" className="text-right">
								電話
							</Label>
							<div className="col-span-3">
								<Input
									id="phone"
									type="tel"
									{...register("phone")}
									placeholder="輸入電話號碼"
								/>
								{errors.phone && (
									<p className="mt-1 text-sm text-red-500">
										{errors.phone.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="status" className="text-right">
								狀態 *
							</Label>
							<div className="col-span-3">
								<Select
									value={statusValue}
									onValueChange={(value) =>
										setValue(
											"status",
											value as "active" | "inactive",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇狀態" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">
											在職
										</SelectItem>
										<SelectItem value="inactive">
											離職
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.status && (
									<p className="mt-1 text-sm text-red-500">
										{errors.status.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="category" className="text-right">
								類別 *
							</Label>
							<div className="col-span-3">
								<Select
									value={categoryValue}
									onValueChange={(value) =>
										setValue(
											"category",
											value as "FINDER" | "RM" | "BOTH",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇類別" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="FINDER">
											FINDER
										</SelectItem>
										<SelectItem value="RM">RM</SelectItem>
										<SelectItem value="BOTH">
											BOTH
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.category && (
									<p className="mt-1 text-sm text-red-500">
										{errors.category.message}
									</p>
								)}
							</div>
						</div>
					</div>
					<DialogFooter className="flex justify-between">
						<Button
							type="button"
							variant="error"
							onClick={handleDelete}
							disabled={isDeleting || isLoading}
						>
							<Trash2 className="mr-2 size-4" />
							{isDeleting ? "刪除中..." : "刪除"}
						</Button>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading || isDeleting}
							>
								取消
							</Button>
							<Button
								type="submit"
								disabled={isLoading || isDeleting}
							>
								{isLoading ? "更新中..." : "更新"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
