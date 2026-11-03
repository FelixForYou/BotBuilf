import { Nav } from "@/components/site/Nav";
import { TransitionProvider } from "@/components/site/Transition";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransitionProvider>
      <a href="#main" className="skip">Lewati ke konten</a>
      <Nav />
      <main id="main">{children}</main>
    </TransitionProvider>
  );
}
