import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TestbedNavigation() {
	return (
		<div className="mt-12 flex justify-between items-center">
			<Button variant="outline" asChild>
				<Link href="/">← Back to Home</Link>
			</Button>
			<div className="flex gap-4">
				<Button variant="outline" asChild>
					<Link href="/pu-learning">← PU Learning Theory</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/case-study">Case Study →</Link>
				</Button>
			</div>
		</div>
	);
}
