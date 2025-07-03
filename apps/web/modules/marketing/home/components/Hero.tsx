import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import bgImage from "../../../../public/cwasset/cwasset_bg.jpg";

export function Hero() {
	return (
		<div className="relative h-screen">
			<Image
				src={bgImage}
				alt="Investment Management"
				fill
				className="object-cover brightness-50"
				priority
			/>
			<div className="container relative z-20 flex h-full flex-col items-center justify-center text-center">
				<div className="mb-4 flex justify-center">
					<div className="mx-auto flex flex-wrap items-center justify-center rounded-full border border-white/30 p-px px-4 py-1 font-normal text-white text-sm shadow-sm">
						<span className="flex items-center gap-2 rounded-full font-semibold">
							<span className="size-2 rounded-full bg-white" />
							New:
						</span>
						<span className="ml-1 block font-medium">
							Advanced Portfolio Analytics
						</span>
					</div>
				</div>

				<h1 className="mx-auto max-w-4xl text-balance font-bold text-white text-5xl lg:text-7xl">
					Professional Investment Management System
				</h1>

				<p className="mx-auto mt-4 max-w-2xl text-balance text-white/80 text-lg">
					A comprehensive platform for investment professionals,
					offering advanced portfolio management, real-time analytics,
					and sophisticated risk assessment tools.
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/login">
							Get started
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					{/* <Button
						variant="outline"
						size="lg"
						className="text-white hover:text-white"
						asChild
					>
						<LocaleLink href="/docs">Learn more</LocaleLink>
					</Button> */}
				</div>

				<div className="mt-16 px-8 text-center">
					<h5 className="font-semibold text-white/70 text-xs uppercase tracking-wider">
						Trusted by Leading Financial Institutions
					</h5>
				</div>
			</div>
		</div>
	);
}
