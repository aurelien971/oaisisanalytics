import "./globals.css";

export const metadata = { title: "OAISIS Analytics", description: "Every product's numbers, one password." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
