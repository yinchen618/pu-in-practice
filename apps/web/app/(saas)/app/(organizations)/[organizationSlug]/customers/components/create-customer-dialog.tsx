"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PercentageInput } from "@shared/components/PercentageInput";
import { SearchableSelect } from "@shared/components/SearchableSelect";
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
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createCustomerSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, t("form.nameRequired")),
		code: z.string().min(1, t("form.codeRequired")),
		email: z
			.string()
			.optional()
			.or(z.literal(""))
			.refine(
				(val) => !val || z.string().email().safeParse(val).success,
				{
					message: t("form.emailInvalid"),
				},
			),
		phone: z.string().optional(),
		rm1Id: z.string().optional(),
		rm1ProfitShare: z
			.number()
			.min(0, t("form.profitShareMin"))
			.max(100, t("form.profitShareMax"))
			.optional(),
		rm2Id: z.string().optional(),
		rm2ProfitShare: z
			.number()
			.min(0, t("form.profitShareMin"))
			.max(100, t("form.profitShareMax"))
			.optional(),
		finder1Id: z.string().optional(),
		finder1ProfitShare: z
			.number()
			.min(0, t("form.profitShareMin"))
			.max(100, t("form.profitShareMax"))
			.optional(),
		finder2Id: z.string().optional(),
		finder2ProfitShare: z
			.number()
			.min(0, t("form.profitShareMin"))
			.max(100, t("form.profitShareMax"))
			.optional(),
	});

type CreateCustomerForm = {
	name: string;
	code: string;
	email?: string;
	phone?: string;
	rm1Id?: string;
	rm1ProfitShare?: number;
	rm2Id?: string;
	rm2ProfitShare?: number;
	finder1Id?: string;
	finder1ProfitShare?: number;
	finder2Id?: string;
	finder2ProfitShare?: number;
};

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface CreateCustomerDialogProps {
	organizationId: string;
	relationshipManagers: RelationshipManager[];
	onSuccess: () => void;
}

export function CreateCustomerDialog({
	organizationId,
	relationshipManagers,
	onSuccess,
}: CreateCustomerDialogProps) {
	const t = useTranslations("organization.customers");
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 根據角色類型過濾 RM 和 Finder 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);
	const finderOptions = relationshipManagers.filter(
		(rm) => rm.category === "FINDER" || rm.category === "BOTH",
	);

	const schema = createCustomerSchema(t);
	const form = useForm<CreateCustomerForm>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			code: "",
			email: "",
			phone: "",
			rm1Id: "none",
			rm1ProfitShare: undefined,
			rm2Id: "none",
			rm2ProfitShare: undefined,
			finder1Id: "none",
			finder1ProfitShare: undefined,
			finder2Id: "none",
			finder2ProfitShare: undefined,
		},
	});

	// 監聽 RM1 選擇變更
	useEffect(() => {
		const rm1Id = form.watch("rm1Id");
		if (rm1Id === "none") {
			form.setValue("rm1ProfitShare", undefined);
		}
	}, [form.watch("rm1Id")]);

	// 監聽 RM2 選擇變更
	useEffect(() => {
		const rm2Id = form.watch("rm2Id");
		if (rm2Id === "none") {
			form.setValue("rm2ProfitShare", undefined);
		}
	}, [form.watch("rm2Id")]);

	// 監聽 Finder1 選擇變更
	useEffect(() => {
		const finder1Id = form.watch("finder1Id");
		if (finder1Id === "none") {
			form.setValue("finder1ProfitShare", undefined);
		}
	}, [form.watch("finder1Id")]);

	// 監聽 Finder2 選擇變更
	useEffect(() => {
		const finder2Id = form.watch("finder2Id");
		if (finder2Id === "none") {
			form.setValue("finder2ProfitShare", undefined);
		}
	}, [form.watch("finder2Id")]);

	const onSubmit = async (data: CreateCustomerForm) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/customers", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					name: data.name,
					code: data.code,
					email: data.email?.trim() || undefined,
					phone: data.phone || undefined,
					organizationId,
					// 處理 RM 和 Finder ID
					rm1Id: data.rm1Id === "none" ? undefined : data.rm1Id,
					rm2Id: data.rm2Id === "none" ? undefined : data.rm2Id,
					finder1Id:
						data.finder1Id === "none" ? undefined : data.finder1Id,
					finder2Id:
						data.finder2Id === "none" ? undefined : data.finder2Id,
					// 處理 ProfitShare，確保數字類型或 null
					rm1ProfitShare:
						data.rm1ProfitShare !== undefined
							? Number(data.rm1ProfitShare)
							: null,
					rm2ProfitShare:
						data.rm2ProfitShare !== undefined
							? Number(data.rm2ProfitShare)
							: null,
					finder1ProfitShare:
						data.finder1ProfitShare !== undefined
							? Number(data.finder1ProfitShare)
							: null,
					finder2ProfitShare:
						data.finder2ProfitShare !== undefined
							? Number(data.finder2ProfitShare)
							: null,
				}),
			});

			if (response.ok) {
				form.reset();
				setOpen(false);
				onSuccess();
			} else {
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

				// 根據錯誤類型設定對應欄位錯誤
				if (errorMessage.includes(t("error.codeExists"))) {
					form.setError("code", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				console.error(t("error.createFailed"), errorMessage);
			}
		} catch (error) {
			console.error(t("error.createFailed"), error);
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
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>{t("dialog.create.title")}</DialogTitle>
					<DialogDescription>
						{t("dialog.create.description")}
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
											{t("form.name")}
											<span className="text-red-500 ml-1">
												*
											</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"form.namePlaceholder",
												)}
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
											{t("form.code")}
											<span className="text-red-500 ml-1">
												*
											</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"form.codePlaceholder",
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
										<FormLabel>{t("form.email")}</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder={t(
													"form.emailPlaceholder",
												)}
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
										<FormLabel>{t("form.phone")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"form.phonePlaceholder",
												)}
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
									<SearchableSelect<RelationshipManager>
										field={field}
										label={t("form.rm1")}
										placeholder={t("form.rm1Placeholder")}
										searchPlaceholder={t(
											"form.rmSearchPlaceholder",
										)}
										emptyText={t("form.rmEmptyText")}
										options={[
											{
												id: "none",
												name: t("form.unspecified"),
											} as RelationshipManager,
											...rmOptions,
										]}
										getDisplayValue={(option) =>
											option?.id === "none"
												? t("form.unspecified")
												: option?.name || ""
										}
										getSearchValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
										getOptionDisplayValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="rm1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("form.rm1ProfitShare")}
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
									<SearchableSelect<RelationshipManager>
										field={field}
										label={t("form.rm2")}
										placeholder={t("form.rm2Placeholder")}
										searchPlaceholder={t(
											"form.rmSearchPlaceholder",
										)}
										emptyText={t("form.rmEmptyText")}
										options={[
											{
												id: "none",
												name: t("form.unspecified"),
											} as RelationshipManager,
											...rmOptions,
										]}
										getDisplayValue={(option) =>
											option?.id === "none"
												? t("form.unspecified")
												: option?.name || ""
										}
										getSearchValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
										getOptionDisplayValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="rm2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("form.rm2ProfitShare")}
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
									<SearchableSelect<RelationshipManager>
										field={field}
										label={t("form.finder1")}
										placeholder={t(
											"form.finder1Placeholder",
										)}
										searchPlaceholder={t(
											"form.finderSearchPlaceholder",
										)}
										emptyText={t("form.finderEmptyText")}
										options={[
											{
												id: "none",
												name: t("form.unspecified"),
											} as RelationshipManager,
											...finderOptions,
										]}
										getDisplayValue={(option) =>
											option?.id === "none"
												? t("form.unspecified")
												: option?.name || ""
										}
										getSearchValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
										getOptionDisplayValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="finder1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("form.finder1ProfitShare")}
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
									<SearchableSelect<RelationshipManager>
										field={field}
										label={t("form.finder2")}
										placeholder={t(
											"form.finder2Placeholder",
										)}
										searchPlaceholder={t(
											"form.finderSearchPlaceholder",
										)}
										emptyText={t("form.finderEmptyText")}
										options={[
											{
												id: "none",
												name: t("form.unspecified"),
											} as RelationshipManager,
											...finderOptions,
										]}
										getDisplayValue={(option) =>
											option?.id === "none"
												? t("form.unspecified")
												: option?.name || ""
										}
										getSearchValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
										getOptionDisplayValue={(option) =>
											option.id === "none"
												? t("form.unspecified")
												: option.name
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="finder2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("form.finder2ProfitShare")}
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

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								{t("form.cancel")}
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading
									? t("form.creating")
									: t("form.create")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
