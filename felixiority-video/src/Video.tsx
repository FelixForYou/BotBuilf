import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Hero, HERO_DURATION } from "./scenes/Hero";
import { Projects, PROJECTS_DURATION } from "./scenes/Projects";
import { About, ABOUT_DURATION, Contact, CONTACT_DURATION, Outro, OUTRO_DURATION, Services, SERVICES_DURATION } from "./scenes/Sections";
import { curtain } from "./lib/curtain";
import { K } from "./lib/anim";
import { TR } from "./timeline";
export { VIDEO_DURATION } from "./timeline";
import { SoundTrack } from "./SoundTrack";

const timing = linearTiming({ durationInFrames: TR * K });


export const FelixiorityVideo: React.FC = () => (
  <>
  <TransitionSeries>
    <TransitionSeries.Sequence name="Hero" durationInFrames={HERO_DURATION * K}>
      <Hero />
    </TransitionSeries.Sequence>
    <TransitionSeries.Sequence name="Projects" durationInFrames={PROJECTS_DURATION * K}>
      <Projects />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Tentang")} timing={timing} />
    <TransitionSeries.Sequence name="About" durationInFrames={ABOUT_DURATION * K}>
      <About />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Layanan")} timing={timing} />
    <TransitionSeries.Sequence name="Services" durationInFrames={SERVICES_DURATION * K}>
      <Services />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Kontak")} timing={timing} />
    <TransitionSeries.Sequence name="Contact" durationInFrames={CONTACT_DURATION * K}>
      <Contact />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Felixiority")} timing={timing} />
    <TransitionSeries.Sequence name="Outro" durationInFrames={OUTRO_DURATION * K}>
      <Outro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
  <SoundTrack />
  </>
);
