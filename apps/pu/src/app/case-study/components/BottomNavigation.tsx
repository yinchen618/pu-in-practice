"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BottomNavigation() {
	return (
		<div className="mt-12 flex justify-between items-center">
			<Button variant="outline" asChild>
				<Link href="/">← Back to Home</Link>
			</Button>
			<div className="flex gap-4">
				<Button variant="outline" asChild>
					<Link href="/pu-learning">← PU Principle</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/testbed">← Testbed</Link>
				</Button>
			</div>
		</div>
	);
}
