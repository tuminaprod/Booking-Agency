export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[];

/** Tiny classnames joiner (no runtime dependency). */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v || v === true) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(String(v));
  };
  values.forEach(walk);
  return out.join(" ");
}
