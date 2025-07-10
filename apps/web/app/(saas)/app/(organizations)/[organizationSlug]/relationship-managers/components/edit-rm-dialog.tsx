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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
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
	joinDate: z.string(),
	resignDate: z.string().optional(),
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

	const form = useForm<EditRMFormData>({
		resolver: zodResolver(editRMSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			status: "active",
			category: "RM",
			joinDate: "",
			resignDate: "",
		},
	});

	useEffect(() => {
		if (open && rmRecord) {
			form.reset({
				name: rmRecord.name,
				email: rmRecord.email,
				phone: rmRecord.phone || "",
				status: rmRecord.status,
				category: rmRecord.category,
				joinDate: new Date(rmRecord.joinDate)
					.toISOString()
					.split("T")[0],
				resignDate: rmRecord.resignDate
					? new Date(rmRecord.resignDate).toISOString().split("T")[0]
					: "",
			});
		}
	}, [open, rmRecord, form]);

	// 監聽離職日期變化，自動更新狀態
	const watchResignDate = form.watch("resignDate");
	const watchStatus = form.watch("status");

	useEffect(() => {
		if (watchResignDate && watchStatus === "active") {
			form.setValue("status", "inactive");
		}
	}, [watchResignDate, watchStatus, form]);

	const onSubmit = async (data: EditRMFormData) => {
		setIsLoading(true);
		try {
			// 直接提交字串格式的日期，讓 API 處理轉換
			const submitData = {
				...data,
				// 如果有離職日期，自動設定狀態為離職
				status: data.resignDate ? "inactive" : data.status,
			};

			const response = await fetch(
				`/api/organizations/relationship-managers/${rmRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(submitData),
				},
			);

			if (!response.ok) {
				let errorMessage = "更新失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "更新失敗";
				}

				// 根據錯誤類型設定對應欄位錯誤
				if (
					errorMessage.includes("電子郵件") ||
					errorMessage.includes("email")
				) {
					form.setError("email", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				throw new Error(errorMessage);
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
				let errorMessage = "刪除失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "刪除失敗";
				}

				throw new Error(errorMessage);
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
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											姓名 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入姓名"
													{...field}
													className={
														fieldState.error
															? "border-red-500 focus:border-red-500 focus:ring-red-500"
															: ""
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											電子郵件 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="email"
													placeholder="輸入電子郵件"
													{...field}
													className={
														fieldState.error
															? "border-red-500 focus:border-red-500 focus:ring-red-500"
															: ""
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											電話
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="tel"
													placeholder="輸入電話號碼"
													{...field}
													value={field.value || ""}
													className={
														fieldState.error
															? "border-red-500 focus:border-red-500 focus:ring-red-500"
															: ""
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											狀態 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={!!watchResignDate}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇狀態" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">
														在職
													</SelectItem>
													<SelectItem value="inactive">
														離職
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											RM 類別 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇 RM 類別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="RM">
														RM
													</SelectItem>
													<SelectItem value="FINDER">
														FINDER
													</SelectItem>
													<SelectItem value="BOTH">
														BOTH
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="joinDate"
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											入職日期 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="date"
													{...field}
													className={
														fieldState.error
															? "border-red-500 focus:border-red-500 focus:ring-red-500"
															: ""
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="resignDate"
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											離職日期
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="date"
													{...field}
													className={
														fieldState.error
															? "border-red-500 focus:border-red-500 focus:ring-red-500"
															: ""
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="!justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								<Trash2 className="mr-2 size-4" />
								{isDeleting ? "刪除中..." : "刪除"}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									取消
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? "更新中..." : "更新"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
