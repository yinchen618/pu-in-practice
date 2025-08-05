import React from "react";

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
	children,
	className,
	htmlFor,
	...props
}) => (
	<label
		className={`text-sm font-medium leading-none ${className || ""}`}
		htmlFor={htmlFor}
		{...props}
	>
		{children}
	</label>
);

export default Label;
