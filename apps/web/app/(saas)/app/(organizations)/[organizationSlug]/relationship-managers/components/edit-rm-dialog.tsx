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
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { RMRecord } from "./columns";

const editRMSchema = (t: (k: string) => string) =>
	z.object({
		name: z.string().min(1, t("form.nameRequired")),
		email: z.string().email(t("form.emailInvalid")),
		phone: z.string().optional(),
		status: z.enum(["active", "inactive"]),
		category: z.enum(["FINDER", "RM", "BOTH"]),
		joinDate: z.string(),
		resignDate: z.string().optional(),
	});

type EditRMFormData = z.infer<ReturnType<typeof editRMSchema>>;

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
	const t = useTranslations("organization.relationshipManagers");

	const schema = editRMSchema(t);
	const form = useForm<EditRMFormData>({
		resolver: zodResolver(schema),
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
			const submitData = {
				...data,
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
				let errorMessage = t("error.updateFailed");
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = t("error.updateFailed");
				}
				if (
					errorMessage.includes(t("form.email")) ||
					errorMessage.includes("email")
				) {
					form.setError("email", {
						type: "server",
						message: errorMessage,
					});
					return;
				}
				toast.error(errorMessage);
				throw new Error(errorMessage);
			}
			onOpenChange(false);
			onSuccess?.();
			toast.success(t("success.update"));
		} catch (error) {
			console.error(t("error.updateFailed"), error);
			toast.error(t("error.updateFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm(t("dialog.deleteConfirm", { name: rmRecord.name }))) {
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
				let errorMessage = t("error.deleteFailed");
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = t("error.deleteFailed");
				}
				toast.error(errorMessage);
				throw new Error(errorMessage);
			}
			onOpenChange(false);
			onSuccess?.();
			toast.success(t("success.delete"));
		} catch (error) {
			console.error(t("error.deleteFailed"), error);
			toast.error(t("error.deleteFailed"));
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("dialog.edit.title")}</DialogTitle>
					<DialogDescription>
						{t("dialog.edit.description")}
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
											{t("form.name")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder={t(
														"form.namePlaceholder",
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
											{t("form.email")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="email"
													placeholder={t(
														"form.emailPlaceholder",
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
											{t("form.phone")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="tel"
													placeholder={t(
														"form.phonePlaceholder",
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
								name="status"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("form.status")} *
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
																"form.statusPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">
														{t("form.statusActive")}
													</SelectItem>
													<SelectItem value="inactive">
														{t(
															"form.statusInactive",
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
								name="category"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("form.category")} *
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
																"form.categoryPlaceholder",
															)}
														/>
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
											{t("form.joinDate")} *
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
											{t("form.resignDate")}
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
								{isDeleting
									? t("dialog.delete.deleting")
									: t("dialog.delete.delete")}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									{t("dialog.cancel")}
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading
										? t("dialog.edit.submitting")
										: t("dialog.edit.submit")}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
