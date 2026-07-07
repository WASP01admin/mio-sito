import { routing } from "@/i18n/routing";

export function resolveLocale(value: string | null | undefined): string {
  return (routing.locales as readonly string[]).includes(value ?? "")
    ? (value as string)
    : routing.defaultLocale;
}
