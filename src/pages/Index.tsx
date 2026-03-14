import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import QuickLinks from "@/components/QuickLinks";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <QuickLinks />
        <MissionSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
