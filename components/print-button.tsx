"use client";

export function PrintButton({ label = "พิมพ์" }: { label?: string }) {
  return (
    <button className="btn-primary" type="button" onClick={() => globalThis.print()}>
      {label}
    </button>
  );
}
