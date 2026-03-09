import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AnimG",
  description: "Manim AI animation generator",
};

const themeInitScript = `
(() => {
  try {
    const key = "animg-theme";
    const stored = localStorage.getItem(key);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "dark" || stored === "light" ? stored : (systemDark ? "dark" : "light");
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
