import { HERO_DURATION } from "./scenes/Hero";
import { PER_PROJECT, PROJECTS_DURATION } from "./scenes/Projects";
import { ABOUT_DURATION, CONTACT_DURATION, OUTRO_DURATION, SERVICES_DURATION } from "./scenes/Sections";

/** Panjang transisi tirai dan awal tiap adegan, dalam satuan 30 fps. */
export const TR = 42;

export const START = {
  hero: 0,
  projects: HERO_DURATION,
  about: HERO_DURATION + PROJECTS_DURATION - TR,
  services: HERO_DURATION + PROJECTS_DURATION + ABOUT_DURATION - TR * 2,
  contact: HERO_DURATION + PROJECTS_DURATION + ABOUT_DURATION + SERVICES_DURATION - TR * 3,
  outro: HERO_DURATION + PROJECTS_DURATION + ABOUT_DURATION + SERVICES_DURATION + CONTACT_DURATION - TR * 4,
};

export const VIDEO_DURATION = START.outro + OUTRO_DURATION;
export { PER_PROJECT };
