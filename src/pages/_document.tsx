import { Head, Html, Main, NextScript } from "next/document";
import Footer from "./_footer";
import NavBar from "./_navbar";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="theme bg-base-200 min-h-screen">
        <NavBar />
        <Main />
        <Footer />
        <NextScript />
      </body>
    </Html>
  );
}
