"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Input" },
  { href: "/statements", label: "Library" },
  { href: "/conflicts", label: "Conflicts" }
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
