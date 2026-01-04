import React from "react";
import {
    Folder, FileText, Image as ImageIcon, Music, Video, Code, Archive,
    Database, Settings, Terminal, Type, Layout, Disc, Package, Play,
    Table, FileCode, FileJson, FileSpreadsheet, Globe, Cpu, Box, Command,
    File, FileType, FileImage, FileAudio, FileVideo, FileVolume, MonitorPlay,
    Presentation, Sheet, Book, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
    type: "file" | "folder";
    name: string;
    className?: string;
}

// Config object for mapping style
interface IconConfig {
    icon: React.ElementType;
    className: string; // Tailwind classes for text color
    bgClassName: string; // Tailwind classes for background
}

const getIconConfig = (ext: string): IconConfig => {
    // Helpers for common styles
    const codeStyle = { icon: FileCode, className: "text-blue-600 dark:text-blue-400", bgClassName: "bg-blue-100 dark:bg-blue-900/30" };
    const jsStyle = { icon: FileCode, className: "text-yellow-600 dark:text-yellow-400", bgClassName: "bg-yellow-100 dark:bg-yellow-900/30" };
    const htmlStyle = { icon: Globe, className: "text-orange-600 dark:text-orange-400", bgClassName: "bg-orange-100 dark:bg-orange-900/30" };
    const stylesStyle = { icon: FileType, className: "text-pink-600 dark:text-pink-400", bgClassName: "bg-pink-100 dark:bg-pink-900/30" };
    const dataStyle = { icon: FileJson, className: "text-green-600 dark:text-green-400", bgClassName: "bg-green-100 dark:bg-green-900/30" };
    const dbStyle = { icon: Database, className: "text-indigo-600 dark:text-indigo-400", bgClassName: "bg-indigo-100 dark:bg-indigo-900/30" };
    const docStyle = { icon: FileText, className: "text-blue-600 dark:text-blue-400", bgClassName: "bg-blue-100 dark:bg-blue-900/30" };
    const excelStyle = { icon: FileSpreadsheet, className: "text-emerald-700 dark:text-emerald-400", bgClassName: "bg-emerald-100 dark:bg-emerald-900/30" };
    const pptStyle = { icon: Presentation, className: "text-orange-600 dark:text-orange-400", bgClassName: "bg-orange-100 dark:bg-orange-900/30" };
    const pdfStyle = { icon: FileText, className: "text-red-600 dark:text-red-400", bgClassName: "bg-red-100 dark:bg-red-900/30" };
    const imgStyle = { icon: FileImage, className: "text-purple-600 dark:text-purple-400", bgClassName: "bg-purple-100 dark:bg-purple-900/30" };
    const vidStyle = { icon: FileVideo, className: "text-rose-600 dark:text-rose-400", bgClassName: "bg-rose-100 dark:bg-rose-900/30" };
    const audStyle = { icon: FileAudio, className: "text-cyan-600 dark:text-cyan-400", bgClassName: "bg-cyan-100 dark:bg-cyan-900/30" };
    const archiveStyle = { icon: Archive, className: "text-amber-600 dark:text-amber-400", bgClassName: "bg-amber-100 dark:bg-amber-900/30" };
    const sysStyle = { icon: Settings, className: "text-slate-600 dark:text-slate-400", bgClassName: "bg-slate-100 dark:bg-slate-800" };
    const execStyle = { icon: Box, className: "text-slate-700 dark:text-slate-300", bgClassName: "bg-slate-200 dark:bg-slate-700" };
    const terminalStyle = { icon: Terminal, className: "text-slate-800 dark:text-slate-200", bgClassName: "bg-slate-200 dark:bg-slate-700" };
    const fontStyle = { icon: Type, className: "text-teal-600 dark:text-teal-400", bgClassName: "bg-teal-100 dark:bg-teal-900/30" };
    const bookStyle = { icon: BookOpen, className: "text-amber-700 dark:text-amber-400", bgClassName: "bg-amber-50 dark:bg-amber-900/20" };

    switch (ext) {
        // --- CODE ---
        case "js":
        case "mjs":
        case "cjs":
        case "jsx": return jsStyle;
        case "ts":
        case "tsx": return codeStyle;
        case "html":
        case "vue": return htmlStyle;
        case "css":
        case "scss":
        case "less":
        case "sass": return stylesStyle;
        case "py": return { ...codeStyle, className: "text-blue-500 dark:text-blue-400" }; // Python
        case "java":
        case "jar": return { ...codeStyle, className: "text-orange-700 dark:text-orange-400" }; // Java
        case "rb": return { ...codeStyle, className: "text-red-700 dark:text-red-400" }; // Ruby
        case "go": return { ...codeStyle, className: "text-cyan-600 dark:text-cyan-400" }; // Go
        case "rs": return { ...codeStyle, className: "text-orange-900 dark:text-orange-400" }; // Rust
        case "php": return { ...codeStyle, className: "text-indigo-600 dark:text-indigo-400" }; // PHP
        case "c":
        case "cpp":
        case "h": return { ...codeStyle, className: "text-blue-800 dark:text-blue-300" }; // C/C++
        case "cs": return { ...codeStyle, className: "text-purple-700 dark:text-purple-300" }; // C#

        // --- DATA ---
        case "json":
        case "yaml":
        case "yml":
        case "toml": return dataStyle;
        case "xml": return { ...dataStyle, className: "text-orange-600" };
        case "sql":
        case "db":
        case "sqlite":
        case "mdb": return dbStyle;
        case "env":
        case "ini":
        case "config": return sysStyle;

        // --- OFFICE ---
        case "doc":
        case "docx":
        case "rtf":
        case "odt": return docStyle;
        case "xls":
        case "xlsx":
        case "csv":
        case "ods": return excelStyle;
        case "ppt":
        case "pptx":
        case "odp": return pptStyle;
        case "pdf": return pdfStyle;
        case "txt":
        case "md":
        case "log": return { ...docStyle, className: "text-slate-500 dark:text-slate-400", bgClassName: "bg-slate-100 dark:bg-slate-800" };
        case "epub":
        case "mobi": return bookStyle;

        // --- MEDIA ---
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":
        case "svg":
        case "bmp":
        case "ico":
        case "tiff":
        case "psd": // Adobe Ps maps to Image
        case "ai":  // Adobe Ai maps to Image/Vector
            return imgStyle;

        case "mp4":
        case "mov":
        case "avi":
        case "mkv":
        case "webm":
        case "pr": // Adobe Premiere
        case "ae": // Adobe AE
            return vidStyle;

        case "mp3":
        case "wav":
        case "flac":
        case "ogg":
        case "m4a":
        case "aac":
            return audStyle;

        // --- ARCHIVE ---
        case "zip":
        case "rar":
        case "7z":
        case "tar":
        case "gz":
        case "tgz": return archiveStyle;

        // --- SYSTEMS ---
        case "exe":
        case "msi":
        case "apk":
        case "app": return execStyle;
        case "sh":
        case "bash":
        case "zsh":
        case "bat":
        case "cmd":
        case "ps1": return terminalStyle;
        case "dll":
        case "sys":
        case "iso":
        case "dmg": return { ...sysStyle, icon: Disc };

        // --- FONTS ---
        case "ttf":
        case "otf":
        case "woff":
        case "woff2": return fontStyle;

        default:
            return { icon: File, className: "text-slate-500 dark:text-slate-400", bgClassName: "bg-slate-100 dark:bg-slate-800" };
    }
};

export function FileIcon({ type, name, className }: FileIconProps) {
    // --- FOLDER ---
    if (type === "folder") {
        return (
            <div className={cn(
                "flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5",
                className
            )}>
                <Folder className="w-full h-full fill-blue-600/20" />
            </div>
        );
    }

    // --- FILE ---
    const extension = name.split(".").pop()?.toLowerCase() || "";
    const config = getIconConfig(extension);
    const IconComponent = config.icon;

    return (
        <div className={cn(
            "flex items-center justify-center rounded-lg p-1.5 transition-colors",
            config.bgClassName,
            config.className,
            className
        )} title={`${extension.toUpperCase()} File`}>
            <IconComponent className="w-full h-full" />
        </div>
    );
}
