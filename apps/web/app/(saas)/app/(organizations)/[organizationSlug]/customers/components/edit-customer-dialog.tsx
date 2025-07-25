"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PercentageInput } from "@shared/components/PercentageInput";
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
import type { CustomerRecord } from "./columns";

const editCustomerSchema = z.object({
	name: z.string().min(1, "客戶名稱是必填的"),
	code: z.string().min(1, "客戶編號是必填的"),
	email: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine((val) => !val || z.string().email().safeParse(val).success, {
			message: "請輸入有效的電子郵件",
		}),
	phone: z.string().optional(),
	rm1Id: z.string().optional(),
	rm1ProfitShare: z
		.number()
		.min(0, "預設分潤比例不能小於0")
		.max(100, "預設分潤比例不能大於100")
		.optional(),
	rm2Id: z.string().optional(),
	rm2ProfitShare: z
		.number()
		.min(0, "預設分潤比例不能小於0")
		.max(100, "預設分潤比例不能大於100")
		.optional(),
	finder1Id: z.string().optional(),
	finder1ProfitShare: z
		.number()
		.min(0, "預設分潤比例不能小於0")
		.max(100, "預設分潤比例不能大於100")
		.optional(),
	finder2Id: z.string().optional(),
	finder2ProfitShare: z
		.number()
		.min(0, "預設分潤比例不能小於0")
		.max(100, "預設分潤比例不能大於100")
		.optional(),
});

type EditCustomerForm = z.infer<typeof editCustomerSchema>;

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface EditCustomerDialogProps {
	customerRecord: CustomerRecord;
	relationshipManagers: RelationshipManager[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EditCustomerDialog({
	customerRecord,
	relationshipManagers,
	open,
	onOpenChange,
	onSuccess,
}: EditCustomerDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// 根據角色類型過濾 RM 和 Finder 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);
	const finderOptions = relationshipManagers.filter(
		(rm) => rm.category === "FINDER" || rm.category === "BOTH",
	);

	const form = useForm<EditCustomerForm>({
		resolver: zodResolver(editCustomerSchema),
	});

	// 重置表單當客戶記錄改變
	useEffect(() => {
		form.reset({
			name: customerRecord.name,
			code: customerRecord.code,
			email: customerRecord.email ?? "",
			phone: customerRecord.phone || "",
			rm1Id: customerRecord.rm1Id || "none",
			rm1ProfitShare: customerRecord.rm1ProfitShare || undefined,
			rm2Id: customerRecord.rm2Id || "none",
			rm2ProfitShare: customerRecord.rm2ProfitShare || undefined,
			finder1Id: customerRecord.finder1Id || "none",
			finder1ProfitShare: customerRecord.finder1ProfitShare || undefined,
			finder2Id: customerRecord.finder2Id || "none",
			finder2ProfitShare: customerRecord.finder2ProfitShare || undefined,
		});
	}, [customerRecord, form]);

	const onSubmit = async (data: EditCustomerForm) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/customers/${customerRecord.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						...data,
						// 處理空字符串電子郵件
						email: data.email?.trim() || null,
						// 過濾"none"值，將其轉換為 null
						rm1Id: data.rm1Id === "none" ? null : data.rm1Id,
						rm2Id: data.rm2Id === "none" ? null : data.rm2Id,
						finder1Id:
							data.finder1Id === "none" ? null : data.finder1Id,
						finder2Id:
							data.finder2Id === "none" ? null : data.finder2Id,
						// 處理ProfitShare，將空值轉換為null
						rm1ProfitShare: data.rm1ProfitShare || null,
						rm2ProfitShare: data.rm2ProfitShare || null,
						finder1ProfitShare: data.finder1ProfitShare || null,
						finder2ProfitShare: data.finder2ProfitShare || null,
					}),
				},
			);

			if (response.ok) {
				onOpenChange(false);
				onSuccess();
			} else {
				let errorMessage = "更新客戶失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "更新客戶失敗";
				}

				// 根據錯誤類型設定對應欄位錯誤
				if (errorMessage.includes("客戶編號已被使用")) {
					form.setError("code", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				console.error("更新客戶失敗:", errorMessage);
			}
		} catch (error) {
			console.error("更新客戶失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("確定要刪除這個客戶嗎？此操作無法撤銷。")) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/customers/${customerRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (response.ok) {
				onOpenChange(false);
				onSuccess();
			} else {
				const errorData = await response.json();
				console.error("刪除客戶失敗:", errorData);
			}
		} catch (error) {
			console.error("刪除客戶失敗:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>編輯客戶</DialogTitle>
					<DialogDescription>
						更新客戶基本資料，並調整負責的 RM 和 Finder
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											客戶名稱
											<span className="text-red-500 ml-1">
												*
											</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入客戶名稱"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>
											客戶編號
											<span className="text-red-500 ml-1">
												*
											</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入客戶編號"
												{...field}
												className={
													fieldState.error
														? "border-red-500 focus:border-red-500 focus:ring-red-500"
														: ""
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>電子郵件</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="輸入電子郵件"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>電話</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入電話號碼"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="rm1Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 RM1</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"rm1ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 RM1" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{rmOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="rm1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											RM1 預設分潤比例 (%)
										</FormLabel>
										<FormControl>
											<PercentageInput
												placeholder="0.00"
												{...field}
												onChange={(value) =>
													field.onChange(value)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="rm2Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 RM2</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"rm2ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 RM2" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{rmOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="rm2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											RM2 預設分潤比例 (%)
										</FormLabel>
										<FormControl>
											<PercentageInput
												placeholder="0.00"
												{...field}
												onChange={(value) =>
													field.onChange(value)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="finder1Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 Finder1</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"finder1ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 Finder1" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{finderOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="finder1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Finder1 預設分潤比例 (%)
										</FormLabel>
										<FormControl>
											<PercentageInput
												placeholder="0.00"
												{...field}
												onChange={(value) =>
													field.onChange(value)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="finder2Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 Finder2</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"finder2ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 Finder2" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{finderOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="finder2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Finder2 預設分潤比例 (%)
										</FormLabel>
										<FormControl>
											<PercentageInput
												placeholder="0.00"
												{...field}
												onChange={(value) =>
													field.onChange(value)
												}
											/>
										</FormControl>
										<FormMessage />
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
								{isDeleting ? "刪除中..." : "刪除客戶"}
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
									{isLoading ? "更新中..." : "更新客戶"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
