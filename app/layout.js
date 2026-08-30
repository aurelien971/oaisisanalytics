import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

// SF Pro leads the stack on a Mac; Jakarta is the fallback that shares its
// soft, rounded terminals rather than fighting them.
const jakarta = Plus_Jakarta_Sans({
  weight: ["200", "300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = { title: "OAISIS Analytics", description: "Every product's numbers, one password." };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
