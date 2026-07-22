"use client";

import { type ButtonHTMLAttributes } from "react";

export default function Button({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[
        "switch-shadow w-full rounded-md border border-stone-300 bg-orange-500 px-4 py-2 text-xs font-semibold text-white uppercase transition disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
