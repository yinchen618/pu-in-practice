import { redirect } from "next/navigation";

export default function Page({
	searchParams,
}: { searchParams: Record<string, string | string[]> }) {
	const qs = new URLSearchParams(searchParams as Record<string, string>);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	redirect(`/pu-learning${suffix}`);
}
