import React from "react";

interface RadioGroupItemProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	value: string;
	id: string;
	checked?: boolean;
	onChange?: () => void;
}

const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
	value: itemValue,
	id,
	checked,
	onChange,
	...props
}) => (
	<input
		type="radio"
		id={id}
		value={itemValue}
		checked={checked}
		onChange={onChange}
		className="h-4 w-4"
		{...props}
	/>
);

export default RadioGroupItem;
