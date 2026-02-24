import { invoke } from "./invoke.js";

export interface DirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}

export function readTextFile(path: string): Promise<string> {
  return invoke<string>("plugin:fs|read_text_file", { path });
}

export function writeTextFile(path: string, contents: string): Promise<void> {
  return invoke<void>("plugin:fs|write_text_file", { path, contents });
}

export function readDir(path: string): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("plugin:fs|read_dir", { path });
}

export function mkdir(
  path: string,
  options?: { recursive?: boolean },
): Promise<void> {
  return invoke<void>("plugin:fs|mkdir", {
    path,
    options: options ?? {},
  });
}

export function exists(path: string): Promise<boolean> {
  return invoke<boolean>("plugin:fs|exists", { path });
}

export function openDialog(options?: OpenDialogOptions): Promise<string | null> {
  return invoke<string | null>("plugin:dialog|open", (options ?? {}) as Record<string, unknown>);
}
