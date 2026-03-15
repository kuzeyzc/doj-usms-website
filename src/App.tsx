import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "./components/PageTransition";
import SplashScreen from "./components/SplashScreen";
import AdminLayout from "./layouts/AdminLayout";

import Index from "./pages/Index.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import RulesPage from "./pages/RulesPage.tsx";
import DocumentsPage from "./pages/DocumentsPage.tsx";
import GalleryPage from "./pages/GalleryPage.tsx";
import ApplyPage from "./pages/ApplyPage.tsx";
import FaqPage from "./pages/FaqPage.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminHierarchy from "./pages/admin/AdminHierarchy.tsx";
import AdminDocuments from "./pages/admin/AdminDocuments.tsx";
import AdminRules from "./pages/admin/AdminRules.tsx";
import AdminFaq from "./pages/admin/AdminFaq.tsx";
import AdminGallery from "./pages/admin/AdminGallery.tsx";
import AdminApplications from "./pages/admin/AdminApplications.tsx";
import AdminFormEditor from "./pages/admin/AdminFormEditor.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppContent() {
  const [contentReady, setContentReady] = useState(false);

  return (
    <>
      <SplashScreen onExitStart={() => setContentReady(true)} />
      <motion.div
        initial={false}
        animate={{
          filter: contentReady ? "blur(0px)" : "blur(12px)",
          opacity: contentReady ? 1 : 0.7,
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
      >
        <BrowserRouter>
        <Routes>
          <Route element={<PageTransition />}>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="hierarchy" element={<AdminHierarchy />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="rules" element={<AdminRules />} />
            <Route path="faq" element={<AdminFaq />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="form-editor" element={<AdminFormEditor />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </motion.div>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="doj-marshals-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
