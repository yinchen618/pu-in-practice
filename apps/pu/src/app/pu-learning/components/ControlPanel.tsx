// ControlPanel.tsx
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

interface ControlPanelProps {
	children: ReactNode;
}

export default function ControlPanel({ children }: ControlPanelProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Zap className="w-5 h-5 text-blue-600" />
					Control Panel
				</CardTitle>
				<CardDescription>
					Configure algorithm parameters and data generation
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}
