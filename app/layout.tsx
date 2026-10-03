import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Crypto Pilot — Personal Trading Assistant",description:"A rule-based crypto market analyst with paper trading and AI explanations."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
