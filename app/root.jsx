import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";

export const meta = () => [
  { charset: "utf-8" },
  { title: "FROND — Control Center & Admin Panel" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
];

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap",
  },
];

export default function App() {
  return (
    <html lang="tr" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-[#FAFAF8] text-[#1D2A1C] antialiased">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
