import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "prismjs/themes/prism-dark.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
