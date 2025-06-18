import { FaqSection } from "@/components/landing/faq-section";
import Navbar from "@/components/landing/NavBar";
import { SiteFooter } from "@/components/site-footer";

export default function FAQPage() {
  return (
    <section>
      <Navbar />

      <div className="pt-12">
        <FaqSection />
      
        <SiteFooter/>
      </div>


    </section>
  );
}
