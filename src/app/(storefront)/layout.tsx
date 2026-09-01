import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

type StorefrontLayoutProps = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
