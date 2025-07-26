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
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	CURRENCY_OPTIONS,
	DISTRIBUTION_TYPE_OPTIONS,
	PRODUCT_CATEGORIES,
	PRODUCT_STATUSES,
} from "../../constants";
import type { ProductRecord } from "./columns";

const editSchema = (t: (key: string) => string) =>
	z.object({
		category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
		name: z.string().min(1, t("form.nameRequired")),
		code: z.string().min(1, t("form.codeRequired")),
		currency: z.string().min(1, t("form.currencyRequired")),
		distributionType: z.string().min(1, t("form.distributionTypeRequired")),
		description: z.string().optional(),
		status: z.enum(["active", "inactive"]),
	});

type EditFormData = {
	category: "AQ" | "Bond" | "DCI" | "EQ" | "FCN" | "Fund" | "FX";
	name: string;
	code: string;
	currency: string;
	distributionType: string;
	description?: string;
	status: "active" | "inactive";
};

interface EditDialogProps {
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
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const t = useTranslations("organization.products");

	const schema = editSchema(t);

	const form = useForm<EditFormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			category: productRecord.category,
			name: productRecord.name,
			code: productRecord.code,
			currency: productRecord.currency,
			distributionType: productRecord.distributionType,
			description: productRecord.description || "",
			status: productRecord.status,
		},
	});

	useEffect(() => {
		if (productRecord) {
			form.reset({
				category: productRecord.category,
				name: productRecord.name,
				code: productRecord.code,
				currency: productRecord.currency,
				distributionType: productRecord.distributionType,
				description: productRecord.description || "",
				status: productRecord.status,
			});
		}
	}, [form, productRecord]);

	const onSubmit = async (data: EditFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/products/${productRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
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

				if (errorMessage.includes(t("error.codeExists"))) {
					form.setError("code", {
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
			console.error(t("error.updateFailed"), error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/products/${productRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(t("error.deleteFailed"));
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error(t("error.deleteFailed"), error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
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
													{PRODUCT_CATEGORIES.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
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
											{t("form.code")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder={t(
														"form.codePlaceholder",
													)}
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
								name="currency"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("form.currency")} *
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
																"form.currencyPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CURRENCY_OPTIONS.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="distributionType"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("form.distributionType")} *
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
																"form.distributionTypePlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{DISTRIBUTION_TYPE_OPTIONS.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
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
											{t("form.description")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder={t(
														"form.descriptionPlaceholder",
													)}
													className="min-h-[80px]"
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
													{PRODUCT_STATUSES.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
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
									? t("dialog.edit.deleting")
									: t("dialog.edit.delete")}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									{t("dialog.edit.cancel")}
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
