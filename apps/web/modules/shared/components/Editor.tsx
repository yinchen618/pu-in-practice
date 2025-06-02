"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@ui/components/button";
import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Heading3,
	ImagePlus,
	Italic,
	List,
	ListOrdered,
	Quote,
} from "lucide-react";
import { useRef } from "react";

interface MenuBarProps {
	editor: any;
	onImageUpload?: (file: File) => Promise<string | null>;
}

const MenuBar = ({ editor, onImageUpload }: MenuBarProps) => {
	const imageInputRef = useRef<HTMLInputElement>(null);

	if (!editor) {
		return null;
	}

	const handleImageClick = () => {
		imageInputRef.current?.click();
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!onImageUpload) return;
		const file = e.target.files?.[0];
		if (file) {
			const url = await onImageUpload(file);
			if (url) {
				editor.chain().focus().setImage({ src: url }).run();
			}
		}
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	};

	return (
		<div className="flex gap-1 border-b p-2">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={editor.isActive("bold") ? "bg-slate-200" : ""}
			>
				<Bold className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={editor.isActive("italic") ? "bg-slate-200" : ""}
			>
				<Italic className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={
					editor.isActive("heading", { level: 1 }) ? "bg-slate-200" : ""
				}
			>
				<Heading1 className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={
					editor.isActive("heading", { level: 2 }) ? "bg-slate-200" : ""
				}
			>
				<Heading2 className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				className={
					editor.isActive("heading", { level: 3 }) ? "bg-slate-200" : ""
				}
			>
				<Heading3 className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={editor.isActive("bulletList") ? "bg-slate-200" : ""}
			>
				<List className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={editor.isActive("orderedList") ? "bg-slate-200" : ""}
			>
				<ListOrdered className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				className={editor.isActive("blockquote") ? "bg-slate-200" : ""}
			>
				<Quote className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleCode().run()}
				className={editor.isActive("code") ? "bg-slate-200" : ""}
			>
				<Code className="h-4 w-4" />
			</Button>
			{onImageUpload && (
				<>
					<Button variant="ghost" size="sm" onClick={handleImageClick}>
						<ImagePlus className="h-4 w-4" />
					</Button>
					<input
						type="file"
						ref={imageInputRef}
						onChange={handleImageChange}
						accept="image/*"
						className="hidden"
					/>
				</>
			)}
		</div>
	);
};

interface EditorProps {
	value: string;
	onChange: (value: string) => void;
	onImageUpload?: (file: File) => Promise<string | null>;
	placeholder?: string;
}

export default function Editor({
	value,
	onChange,
	onImageUpload,
	placeholder = "开始写作...",
}: EditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Image,
			Placeholder.configure({
				placeholder,
			}),
		],
		content: value,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	return (
		<div className="min-h-[500px] w-full rounded-md border">
			<MenuBar editor={editor} onImageUpload={onImageUpload} />
			<EditorContent
				editor={editor}
				className="prose prose-slate max-w-none p-4"
			/>
		</div>
	);
}
