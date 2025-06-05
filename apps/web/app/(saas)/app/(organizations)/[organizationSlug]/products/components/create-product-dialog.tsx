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
	DialogTrigger,
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	price: z.number().positive().optional(),
	currency: z.string().optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

interface CreateProductDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateProductDialog({
	organizationId,
	onSuccess,
}: CreateProductDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<CreateProductFormData>({
		resolver: zodResolver(createProductSchema),
		defaultValues: {
			name: "",
			code: "",
			category: "EQ",
			description: "",
			price: undefined,
			currency: "TWD",
		},
	});

	const onSubmit = async (data: CreateProductFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/products", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					organizationId,
				}),
			});

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const responseText = await response.text();
					// 嘗試解析為 JSON
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						// 如果不是 JSON 格式，使用純文字作為錯誤訊息
						errorMessage = responseText || errorMessage;
					}
				} catch {
					// 如果連讀取文字都失敗了，使用預設錯誤訊息
					errorMessage = "新增失敗";
				}

				// 如果是產品代碼重複的錯誤，顯示在 code 欄位下方
				if (
					errorMessage.includes("產品代碼已被使用") ||
					errorMessage.includes("代碼已被使用")
				) {
					form.setError("code", {
						type: "server",
						message: errorMessage,
					});
					return; // 不要拋出錯誤，讓表單繼續顯示
				}

				throw new Error(errorMessage);
			}

			// 重置表單並關閉對話框
			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增產品失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					新增產品
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>新增產品</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一個產品。
					</DialogDescription>
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
								render={({ field, fieldState }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											產品代碼 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入產品代碼"
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
								name="category"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											類別 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
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
												defaultValue={field.value}
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
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									form.reset();
									setOpen(false);
								}}
							>
								取消
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "新增中..." : "新增產品"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
