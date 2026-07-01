import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import DonationSection from "@/components/home/DonationSection";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <AboutSection />
      <DonationSection />
    </main>
  );
}
