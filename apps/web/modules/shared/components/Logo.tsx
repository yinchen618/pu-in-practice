import { cn } from "@ui/lib";
import Image from "next/image";
import logoImage from "../../../public/cwasset/cwasset_icon.jpg";

export function Logo({
	withLabel = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<Image
				src={logoImage}
				alt="CW Asset"
				width={40}
				height={40}
				className="size-10 object-contain"
			/>
			{withLabel && (
				<span className="ml-3 hidden text-lg md:block">CW Asset</span>
			)}
		</span>
	);
}
