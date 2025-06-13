import { FaqSection } from "@/components/landing/faq-section";
import Navbar from "@/components/landing/NavBar";

export default function FAQPage() {
  return (
    <section>
      <Navbar />

      <div className="pt-12">
        <FaqSection />
      </div>
    </section>
  );
}
