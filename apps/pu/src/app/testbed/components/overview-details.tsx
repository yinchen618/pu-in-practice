import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function OverviewDetails() {
	return (
		<div className="space-y-6">
			{/* Participant Demographics */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Participant Demographics
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
						<div>
							<p className="font-medium">
								Age range: 22-75 years old
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
						<div>
							<p className="font-medium">
								Household size: 1-5 residents
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
						<div>
							<p className="font-medium">
								Participation period: 6-24 months
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
						<div>
							<p className="font-medium">
								Data collection: 24/7 automated
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
