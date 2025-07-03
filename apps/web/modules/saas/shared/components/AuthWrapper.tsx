import { config } from "@repo/config";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { cn } from "@ui/lib";
import Image from "next/image";
import Link from "next/link";
import { type PropsWithChildren, Suspense } from "react";
import bgImage from "../../../../public/cwasset/cwasset_bg.jpg";
import logoImage from "../../../../public/cwasset/cwasset_logo.jpeg";

export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="flex min-h-screen">
			{/* 左側登入區域 */}
			<div className="flex w-[500px] flex-col bg-[#0B1C2E] px-8 py-12">
				<div className="mb-12">
					<Link href="/" className="block">
						<Image
							src={logoImage}
							alt="CW Asset Management"
							width={200}
							height={80}
							className="object-contain"
						/>
					</Link>
				</div>

				<div className="flex-1">
					<main className={cn("w-full", contentClass)}>
						{children}
					</main>
				</div>

				<div className="text-sm text-gray-400">
					© {new Date().getFullYear()} CW Asset Management.
				</div>
			</div>

			{/* 右側背景圖區域 */}
			<div className="relative flex-1">
				<Image
					src={bgImage}
					alt="Background"
					fill
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-white">
					<div className="relative z-10 max-w-xl pt-52 pl-24">
						<div className="relative mb-6">
							<div className="absolute -inset-1 rounded-[1rem] bg-[#4263EB]/30 blur-md" />
							<div className="relative rounded-[1rem] border-2 border-[#4263EB]/50 bg-white/10 px-12 py-4">
								<h2 className="text-xl font-medium tracking-wide">
									Developing Innovative Strategies
								</h2>
							</div>
						</div>
						<div className="text-xl font-bold tracking-wide text-right">
							ACHIEVING GROWTH
						</div>
					</div>
				</div>
				{/* 漸層遮罩 */}
				<div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
			</div>

			{/* 語言和主題切換按鈕 */}
			<div className="absolute right-6 top-6 flex items-center gap-2">
				{config.i18n.enabled && (
					<Suspense>
						<LocaleSwitch withLocaleInUrl={false} />
					</Suspense>
				)}
				<ColorModeToggle />
			</div>
		</div>
	);
}
