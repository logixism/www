import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function format(str: string, values: Record<string, unknown>) {
  return str.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));
}

export function isAlphaNumeric(str: string) {
  return new RegExp(/^[a-z0-9]+$/i).test(str);
}
