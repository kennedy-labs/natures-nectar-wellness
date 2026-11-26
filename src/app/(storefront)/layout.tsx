import { FloatingWhatsAppButton } from "@/components/layout/FloatingWhatsAppButton";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { StorefrontSearchBar } from "@/components/layout/StorefrontSearchBar";

type StorefrontLayoutProps = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <StorefrontSearchBar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
