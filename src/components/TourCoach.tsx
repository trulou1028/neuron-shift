import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CheckCircle, HandPointing, X } from "@phosphor-icons/react";
import { countedSteps, type TourStep } from "../data/tour";

type TourCoachProps = {
  step: TourStep;
  index: number;
  /** The app already reached the state the step asks for. */
  taskDone: boolean;
  /** False when the task is already underway, for example the decision dialog is open. */
  canDo: boolean;
  onDo: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
};

const CARD_WIDTH = 296;
const GAP = 14;
const EDGE = 12;
const RING_PAD = 6;

type Rect = { x: number; y: number; width: number; height: number };
/**
 * `ring` is what gets highlighted. `clear` is what the card must not cover: the target, or the dialog or panel it sits in.
 * `stage` is set for graph nodes: the card stays on the canvas so it never hides the panels the step talks about.
 */
type Obstacle = Rect & { weight: number };
type Target = { ring: Rect; clear: Rect; stage?: Rect; obstacles: Obstacle[] };

const toRect = (box: DOMRect): Rect => ({ x: box.x, y: box.y, width: box.width, height: box.height });

/** Follows the first matching target every frame, so the ring stays on it through pans, zooms and dialogs. */
function useTarget(targets: string[]): Target | null {
  const [target, setTarget] = useState<Target | null>(null);
  const key = targets.join("|");

  useEffect(() => {
    let frame = 0;
    let last = "";
    const selectors = key.split("|");
    const tick = () => {
      let next: Target | null = null;
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const box = element?.getBoundingClientRect();
        if (element && box && box.width > 0 && box.height > 0) {
          // Inside a dialog or the asset panel, the card clears the whole container, not only the target.
          const dialog = element.closest('[role="dialog"], .right-rail')?.getBoundingClientRect();
          const stage = element.closest(".flow-canvas")?.getBoundingClientRect();
          // The assets and pinned cards on the canvas are what the card should avoid covering.
          // Assets pushed back by the failure preview matter less than the ones it is showing.
          const obstacles = Array.from(document.querySelectorAll(".react-flow__node, .canvas-widget, .flow-legend"), (node) => ({
            ...toRect(node.getBoundingClientRect()),
            weight: node.classList.contains("impact-muted") || node.classList.contains("flow-legend") ? 0.2 : 1,
          }));
          next = { ring: toRect(box), clear: dialog ? toRect(dialog) : toRect(box), stage: stage ? toRect(stage) : undefined, obstacles };
          break;
        }
      }
      const signature = next
        ? [next.ring.x, next.ring.y, next.ring.width, next.ring.height, next.clear.x, next.clear.width, ...next.obstacles.flatMap((o) => [o.x, o.y])]
            .map(Math.round)
            .join(",")
        : "none";
      if (signature !== last) {
        last = signature;
        setTarget(next);
      }
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [key]);

  return target;
}

/** Beside the target where there is room, otherwise below or above it, always inside the viewport. */
function placeCard(target: Target | null, cardHeight: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), vw - CARD_WIDTH - EDGE);
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), vh - cardHeight - EDGE);

  if (!target) return { x: clampX((vw - CARD_WIDTH) / 2), y: vh - cardHeight - 28 };

  const { ring, clear, stage } = target;
  const below = ring.y + ring.height + GAP + RING_PAD;
  const above = ring.y - GAP - RING_PAD - cardHeight;
  // Score a spot by the graph it hides, plus a small pull toward the target so the card stays near it.
  const score = (spot: { x: number; y: number }) => {
    const hidden = target.obstacles.reduce((sum, o) => {
      const w = Math.min(spot.x + CARD_WIDTH, o.x + o.width) - Math.max(spot.x, o.x);
      const h = Math.min(spot.y + cardHeight, o.y + o.height) - Math.max(spot.y, o.y);
      return w > 0 && h > 0 ? sum + w * h * o.weight : sum;
    }, 0);
    const distance = Math.hypot(spot.x + CARD_WIDTH / 2 - (ring.x + ring.width / 2), spot.y + cardHeight / 2 - (ring.y + ring.height / 2));
    return hidden + distance * 12;
  };
  const leastCovering = (spots: { x: number; y: number }[]) => spots.sort((a, b) => score(a) - score(b))[0];

  if (stage) {
    // Try each side of the asset, top- and bottom-aligned, and keep the spot that hides the least of the graph.
    const candidates = [
      { x: ring.x - GAP - RING_PAD - CARD_WIDTH, y: ring.y },
      { x: ring.x - GAP - RING_PAD - CARD_WIDTH, y: ring.y + ring.height - cardHeight },
      { x: ring.x + ring.width + GAP + RING_PAD, y: ring.y },
      { x: ring.x + ring.width + GAP + RING_PAD, y: ring.y + ring.height - cardHeight },
      { x: ring.x + ring.width / 2 - CARD_WIDTH / 2, y: below },
      { x: ring.x + ring.width / 2 - CARD_WIDTH / 2, y: above },
      { x: stage.x + EDGE, y: stage.y + EDGE },
      { x: stage.x + stage.width - CARD_WIDTH - EDGE, y: stage.y + EDGE },
      { x: stage.x + EDGE, y: stage.y + stage.height - cardHeight - EDGE },
      { x: stage.x + stage.width - CARD_WIDTH - EDGE, y: stage.y + stage.height - cardHeight - EDGE },
    ].filter(
      (spot) =>
        spot.x >= stage.x + EDGE &&
        spot.x + CARD_WIDTH <= stage.x + stage.width - EDGE &&
        spot.y >= stage.y + EDGE &&
        spot.y + cardHeight <= stage.y + stage.height - EDGE,
    );
    const best = leastCovering(candidates);
    if (best) return best;
  }
  // Toolbar targets sit above the canvas, which is the one area the card can cover without hiding the task.
  // Slide along below the target to wherever it hides the fewest assets.
  if (ring.y < 140 && below + cardHeight <= vh - EDGE) {
    const canvas = document.querySelector(".flow-canvas")?.getBoundingClientRect();
    const xs = [ring.x + ring.width - CARD_WIDTH, ring.x, canvas ? canvas.x + EDGE : ring.x];
    return leastCovering(xs.map((x) => ({ x: clampX(x), y: below })));
  }
  const right = Math.max(ring.x + ring.width, clear.x + clear.width) + GAP + RING_PAD;
  if (right + CARD_WIDTH <= vw - EDGE) return { x: right, y: clampY(ring.y) };
  const left = Math.min(ring.x, clear.x) - GAP - RING_PAD - CARD_WIDTH;
  if (left >= EDGE) return leastCovering([ring.y, ring.y + ring.height - cardHeight, ring.y - cardHeight / 2].map((y) => ({ x: left, y: clampY(y) })));
  if (below + cardHeight <= vh - EDGE) return { x: clampX(ring.x), y: below };
  return { x: clampX(ring.x), y: clampY(above) };
}

export function TourCoach({ step, index, taskDone, canDo, onDo, onNext, onSkip, onFinish }: TourCoachProps) {
  const target = useTarget(step.targets);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(200);

  // Step content swaps with an exit animation, so measure whenever the card resizes rather than per step.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setCardHeight(card.offsetHeight);
    const observer = new ResizeObserver(() => setCardHeight(card.offsetHeight));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const position = placeCard(target, cardHeight);
  const isWelcome = step.id === "welcome";
  const isDone = step.id === "done";

  return (
    <div className="tour" aria-live="polite">
      {target && (
        <div
          className="tour-ring"
          aria-hidden="true"
          style={{
            transform: `translate(${target.ring.x - RING_PAD}px, ${target.ring.y - RING_PAD}px)`,
            width: target.ring.width + RING_PAD * 2,
            height: target.ring.height + RING_PAD * 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="tour-card"
        role="region"
        aria-label="Guided tour"
        style={{ width: CARD_WIDTH, transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tour-card__meta">
              <span>
                {isWelcome ? "Guided tour" : isDone ? "Tour complete" : `Step ${index} of ${countedSteps}`}
              </span>
              {!isDone && (
                <button className="tour-card__close" onClick={onSkip} aria-label="End the tour" title="End the tour">
                  <X size={13} weight="bold" />
                </button>
              )}
            </div>
            {!isWelcome && !isDone && (
              <div className="tour-card__progress" aria-hidden="true">
                {Array.from({ length: countedSteps }, (_, i) => (
                  <span key={i} className={i < index ? "is-filled" : ""} />
                ))}
              </div>
            )}
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            {step.task && (
              <p className={`tour-card__task ${taskDone ? "is-done" : ""}`}>
                {taskDone ? <CheckCircle size={14} weight="fill" /> : <HandPointing size={14} weight="fill" />} {step.task}
              </p>
            )}
            <div className="tour-card__actions">
              {isWelcome && (
                <>
                  <button className="button button--quiet" onClick={onSkip}>Explore on my own</button>
                  <button className="button button--primary" onClick={onNext}>
                    Start the tour <ArrowRight size={14} weight="bold" />
                  </button>
                </>
              )}
              {!isWelcome && !isDone && step.task && (
                taskDone ? (
                  <button className="button button--primary" onClick={onNext}>
                    Next <ArrowRight size={14} weight="bold" />
                  </button>
                ) : canDo ? (
                  <button className="button button--secondary" onClick={onDo}>{step.doLabel}</button>
                ) : (
                  <button className="button button--quiet" onClick={onNext}>Skip this step</button>
                )
              )}
              {!isWelcome && !isDone && !step.task && (
                <button className="button button--primary" onClick={onNext}>
                  Next <ArrowRight size={14} weight="bold" />
                </button>
              )}
              {isDone && (
                <>
                  <button className="button button--quiet" onClick={onFinish}>Keep exploring</button>
                  <a className="button button--primary" href="/case-study.html" onClick={onFinish}>
                    Read the case study <ArrowUpRight size={14} weight="bold" />
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
