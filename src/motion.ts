// Shared motion presets. Durations follow the product register: feedback near 150 ms,
// state changes near 250 ms, dialogs a little longer. Exits run faster than entrances.
// Reduced motion is handled globally by <MotionConfig reducedMotion="user"> in App.

export const easeOutQuint = [0.22, 1, 0.36, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.04 } },
};

export const dialogMotion = {
  initial: { opacity: 0, y: 16, scale: 0.985, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.38, ease: easeOutExpo } },
  exit: { opacity: 0, y: 8, scale: 0.99, filter: "blur(4px)", transition: { duration: 0.18, ease: easeOutQuint } },
};

export const disclosureMotion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { height: { duration: 0.3, ease: easeOutQuint }, opacity: { duration: 0.22, delay: 0.05 } } },
  exit: { height: 0, opacity: 0, transition: { height: { duration: 0.22, ease: easeOutQuint }, opacity: { duration: 0.12 } } },
};

/** Content that replaces other content in place: a tab panel, a newly selected asset. */
export const swapMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOutQuint } },
};
