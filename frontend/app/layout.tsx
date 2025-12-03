// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "./providers"; // ou o caminho correto

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body>
        {/* A MÁGICA ESTÁ AQUI: attribute="class" */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}