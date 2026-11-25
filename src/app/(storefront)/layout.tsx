import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingCartButton } from "@/features/cart/components/FloatingCartButton";

type StorefrontLayoutProps = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <FloatingCartButton />
      <Footer />
    </div>
  );
}
