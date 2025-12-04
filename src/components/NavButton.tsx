import React from "react";

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export function NavButton({
  href,
  children,
  bgColor = "#AF2828",
  textColor = "#ffffff",
  className = "",
}: NavButtonProps) {
  return (
    <a
      href={href}
      className={`px-6 py-3 rounded-lg font-semibold transition ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {children}
    </a>
  );
}