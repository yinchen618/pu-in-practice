import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forwardRef } from "react";

interface WorkbenchProps {
	children?: React.ReactNode;
}

export const Workbench = forwardRef<SVGSVGElement, WorkbenchProps>(
	({ children }, ref) => {
		return (
			<Card>
				<CardHeader>
					<CardTitle>實驗工作台</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border border-gray-200 rounded-lg bg-white">
						<svg
							ref={ref}
							width="800"
							height="600"
							className="w-full h-auto"
						/>
					</div>
					{children}
				</CardContent>
			</Card>
		);
	},
);
