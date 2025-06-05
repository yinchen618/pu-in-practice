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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createRMSchema = z.object({
	name: z.string().min(1, "姓名是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	category: z.enum(["FINDER", "RM", "BOTH"]),
});

type CreateRMFormData = z.infer<typeof createRMSchema>;

interface CreateRMDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateRMDialog({
	organizationId,
	onSuccess,
}: CreateRMDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<CreateRMFormData>({
		resolver: zodResolver(createRMSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			category: "RM",
		},
	});

	const onSubmit = async (data: CreateRMFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				"/api/organizations/relationship-managers",
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...data,
						organizationId,
					}),
				},
			);

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "新增失敗";
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

			// 重置表單並關閉對話框
			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增 RM 失敗:", error);
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
					新增 RM
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>新增客戶關係經理</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一位客戶關係經理。
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
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								取消
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "新增中..." : "新增"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
