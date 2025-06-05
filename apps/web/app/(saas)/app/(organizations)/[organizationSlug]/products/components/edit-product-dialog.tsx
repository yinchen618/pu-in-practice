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
import { Textarea } from "@ui/components/textarea";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ProductRecord } from "./columns";

const editProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]),
	price: z.number().positive().optional(),
	currency: z.string().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductDialogProps {
	productRecord: ProductRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditProductDialog({
	productRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditProductDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const form = useForm<EditProductFormData>({
		resolver: zodResolver(editProductSchema),
		defaultValues: {
			name: "",
			code: "",
			category: "EQ",
			description: "",
			status: "active",
			price: undefined,
			currency: "TWD",
		},
	});

	// 當產品記錄改變時重置表單
	useEffect(() => {
		if (productRecord) {
			form.reset({
				name: productRecord.name,
				code: productRecord.code,
				category: productRecord.category as
					| "AQ"
					| "Bond"
					| "DCI"
					| "EQ"
					| "FCN"
					| "Fund"
					| "FX",
				description: productRecord.description || "",
				status: productRecord.status,
				price: productRecord.price || undefined,
				currency: productRecord.currency || "TWD",
			});
		}
	}, [productRecord, form]);

	const onSubmit = async (data: EditProductFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/products/${productRecord.id}`,
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
			console.error("更新產品失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("確定要刪除這個產品嗎？此操作無法撤銷。")) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/products/${productRecord.id}`,
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
			console.error("刪除產品失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>編輯產品</DialogTitle>
					<DialogDescription>編輯產品資訊。</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											產品名稱 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入產品名稱"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											產品代碼 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入產品代碼"
													{...field}
												/>
											</FormControl>
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
											類別 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇產品類別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="AQ">
														AQ
													</SelectItem>
													<SelectItem value="Bond">
														債券
													</SelectItem>
													<SelectItem value="DCI">
														DCI
													</SelectItem>
													<SelectItem value="EQ">
														股票
													</SelectItem>
													<SelectItem value="FCN">
														FCN
													</SelectItem>
													<SelectItem value="Fund">
														基金
													</SelectItem>
													<SelectItem value="FX">
														外匯
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
								name="status"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											狀態 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇狀態" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">
														銷售中
													</SelectItem>
													<SelectItem value="inactive">
														已下架
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
								name="price"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											價格
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="輸入價格"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? undefined
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											幣別
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇幣別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="TWD">
														TWD
													</SelectItem>
													<SelectItem value="USD">
														USD
													</SelectItem>
													<SelectItem value="EUR">
														EUR
													</SelectItem>
													<SelectItem value="JPY">
														JPY
													</SelectItem>
													<SelectItem value="CNY">
														CNY
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
								name="description"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-start gap-4">
										<FormLabel className="text-right mt-2">
											描述
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder="輸入產品描述"
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="flex justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
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
