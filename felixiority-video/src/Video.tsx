import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Hero, HERO_DURATION } from "./scenes/Hero";
import { Projects, PROJECTS_DURATION } from "./scenes/Projects";
import { About, ABOUT_DURATION, Contact, CONTACT_DURATION, Outro, OUTRO_DURATION, Services, SERVICES_DURATION } from "./scenes/Sections";
import { curtain } from "./lib/curtain";

const TR = 36;
const timing = linearTiming({ durationInFrames: TR });

export const VIDEO_DURATION =
  HERO_DURATION + PROJECTS_DURATION + ABOUT_DURATION + SERVICES_DURATION + CONTACT_DURATION + OUTRO_DURATION - TR * 4;

export const FelixiorityVideo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Hero" durationInFrames={HERO_DURATION}>
      <Hero />
    </TransitionSeries.Sequence>
    <TransitionSeries.Sequence name="Projects" durationInFrames={PROJECTS_DURATION}>
      <Projects />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Tentang")} timing={timing} />
    <TransitionSeries.Sequence name="About" durationInFrames={ABOUT_DURATION}>
      <About />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Layanan")} timing={timing} />
    <TransitionSeries.Sequence name="Services" durationInFrames={SERVICES_DURATION}>
      <Services />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Kontak")} timing={timing} />
    <TransitionSeries.Sequence name="Contact" durationInFrames={CONTACT_DURATION}>
      <Contact />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={curtain("Felixiority")} timing={timing} />
    <TransitionSeries.Sequence name="Outro" durationInFrames={OUTRO_DURATION}>
      <Outro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
