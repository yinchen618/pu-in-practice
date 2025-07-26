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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CURRENCY_OPTIONS, DISTRIBUTION_TYPE_OPTIONS } from "../../constants";

const ProductCategory = z.enum([
	"AQ",
	"Bond",
	"DCI",
	"EQ",
	"FCN",
	"Fund",
	"FX",
]);
const ProductStatus = z.enum(["active", "inactive"]);

const createSchema = (t: (key: string) => string) =>
	z.object({
		category: ProductCategory,
		name: z.string().min(1, t("form.nameRequired")),
		code: z.string().min(1, t("form.codeRequired")),
		currency: z.string().min(1, t("form.currencyRequired")),
		distributionType: z.string().min(1, t("form.distributionTypeRequired")),
		description: z.string().optional(),
		status: ProductStatus,
	});

type CreateFormData = {
	category: "AQ" | "Bond" | "DCI" | "EQ" | "FCN" | "Fund" | "FX";
	name: string;
	code: string;
	currency: string;
	distributionType: string;
	description?: string;
	status: "active" | "inactive";
};

interface CreateDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateProductDialog({
	organizationId,
	onSuccess,
}: CreateDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const t = useTranslations("organization.products");

	const schema = createSchema(t);

	const form = useForm<CreateFormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			category: "Fund",
			name: "",
			code: "",
			currency: "USD",
			distributionType: "MONTHLY",
			description: "",
			status: "active",
		},
	});

	const onSubmit = async (data: CreateFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/products", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, organizationId }),
			});

			if (!response.ok) {
				let errorMessage = t("error.createFailed");
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = t("error.createFailed");
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

			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error(t("error.createFailed"), error);
			toast.error(t("error.createFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					{t("dialog.create.trigger")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("dialog.create.title")}</DialogTitle>
					<DialogDescription>
						{t("dialog.create.description")}
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
													<SelectItem value="AQ">
														AQ
													</SelectItem>
													<SelectItem value="Bond">
														{t(
															"table.categoryBond",
														)}
													</SelectItem>
													<SelectItem value="DCI">
														DCI
													</SelectItem>
													<SelectItem value="EQ">
														{t("table.categoryEQ")}
													</SelectItem>
													<SelectItem value="FCN">
														FCN
													</SelectItem>
													<SelectItem value="Fund">
														{t(
															"table.categoryFund",
														)}
													</SelectItem>
													<SelectItem value="FX">
														{t("table.categoryFX")}
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
						</div>
						<DialogFooter>
							<Button type="submit" disabled={isLoading}>
								{isLoading
									? t("dialog.create.submitting")
									: t("dialog.create.submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
