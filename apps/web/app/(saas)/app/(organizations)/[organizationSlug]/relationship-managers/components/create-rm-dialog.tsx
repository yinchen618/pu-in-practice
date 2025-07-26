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
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CreateRMDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateRMDialog({
	organizationId,
	onSuccess,
}: CreateRMDialogProps) {
	const t = useTranslations("organization.relationshipManagers");
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const createRMSchema = z.object({
		name: z.string().min(1, t("createDialog.validation.nameRequired")),
		email: z.string().email(t("createDialog.validation.emailInvalid")),
		phone: z.string().optional(),
		category: z.enum(["FINDER", "RM", "BOTH"]),
		joinDate: z.string(),
		resignDate: z.string().optional(),
		status: z.enum(["active", "inactive"]),
	});

	type CreateRMFormData = z.infer<typeof createRMSchema>;

	const form = useForm<CreateRMFormData>({
		resolver: zodResolver(createRMSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			category: "RM",
			joinDate: new Date().toISOString().split("T")[0], // 預設為今天
			resignDate: "",
			status: "active",
		},
	});

	// 監聽離職日期變化，自動更新狀態
	const watchResignDate = form.watch("resignDate");

	useEffect(() => {
		if (watchResignDate) {
			form.setValue("status", "inactive");
		}
	}, [watchResignDate, form]);

	const onSubmit = async (data: CreateRMFormData) => {
		setIsLoading(true);
		try {
			// 直接提交字串格式的日期，讓 API 處理轉換
			const submitData = {
				...data,
			};

			const response = await fetch(
				"/api/organizations/relationship-managers",
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...submitData,
						organizationId,
					}),
				},
			);

			if (!response.ok) {
				let errorMessage = t("createDialog.errors.createFailed");
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = t("createDialog.errors.createFailed");
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
					{t("createDialog.trigger")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("createDialog.title")}</DialogTitle>
					<DialogDescription>
						{t("createDialog.description")}
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
											{t("createDialog.fields.name")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder={t(
														"createDialog.fields.namePlaceholder",
													)}
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
											{t("createDialog.fields.email")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="email"
													placeholder={t(
														"createDialog.fields.emailPlaceholder",
													)}
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
											{t("createDialog.fields.phone")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="tel"
													placeholder={t(
														"createDialog.fields.phonePlaceholder",
													)}
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
											{t("createDialog.fields.category")}{" "}
											*
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"createDialog.fields.categoryPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="RM">
														{t("category.rm")}
													</SelectItem>
													<SelectItem value="FINDER">
														{t("category.finder")}
													</SelectItem>
													<SelectItem value="BOTH">
														{t("category.both")}
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
											{t("createDialog.fields.status")} *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={!!watchResignDate}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"createDialog.fields.statusPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">
														{t(
															"statusLabels.active",
														)}
													</SelectItem>
													<SelectItem value="inactive">
														{t(
															"statusLabels.inactive",
														)}
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
											{t("createDialog.fields.joinDate")}{" "}
											*
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
											{t(
												"createDialog.fields.resignDate",
											)}
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
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								{t("createDialog.actions.cancel")}
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading
									? t("createDialog.actions.submitting")
									: t("createDialog.actions.submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
