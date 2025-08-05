import React from "react";

const RadioGroup: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<div className={`grid gap-2 ${className || ""}`} role="radiogroup">
		{children}
	</div>
);

export default RadioGroup;
