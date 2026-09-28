import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useNodesState,
  type NodeSelectionChange,
  type OnNodesChange,
} from "@xyflow/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowUpRight, ClipboardText, GraduationCap, Path } from "@phosphor-icons/react";
import {
  affectedPath,
  asksForNode,
  connections,
  DEFAULT_SELECTED_ID,
  defaultNode,
  impactByNode,
  learningSteps,
  nodeDepth,
  powerNodes,
  shiftHandoff,
  statusCounts,
  type HandoffItem,
  type LearnSection,
  type ImpactResult,
  type LensTab,
  type PowerNode,
} from "./data/scenario";
import {
  buildInitialNodes,
  clearPinsAndDecisions,
  initialPositions,
  markTourSeen,
  readStoredDecisions,
  readStoredWidgets,
  readTourSeen,
  saveDecisions,
  savePositions,
  saveWidgets,
} from "./layoutStorage";
import { useMockTelemetry } from "./useMockTelemetry";
import { useMediaQuery } from "./useMediaQuery";
import { AssetPanel } from "./components/LearningPanel";
import { LearningLayer } from "./components/LearningLayer";
import { MissionPanel } from "./components/MissionPanel";
import { PowerNodeCard } from "./components/PowerNodeCard";
import { PowerEdge, type PowerEdgeState, type PowerEdgeType } from "./components/PowerEdge";
import { ResetLayoutControl } from "./components/ResetLayoutControl";
import { ClearBoardControl } from "./components/ClearBoardControl";
import { ViewportFocus, type FocusRequest } from "./components/ViewportFocus";
import { FitOnResize } from "./components/FitOnResize";
import { ShiftBrief } from "./components/ShiftBrief";
import { DecisionDialog } from "./components/DecisionDialog";
import { CanvasWidgets } from "./components/CanvasWidgets";
import { TourCoach } from "./components/TourCoach";
import { PhoneFallback } from "./components/PhoneFallback";
import { BrandMark } from "./components/BrandMark";
import { defaultPlacement, type PinnedWidget, type WidgetKind } from "./data/widgets";
import { recommendationByNode, recommendations, simulatedNow, type OperatorDecision } from "./data/decisions";
import { tourSteps, type TourSnapshot } from "./data/tour";
import { cssVariables, palette } from "./theme";

const nodeTypes = { power: PowerNodeCard };
const edgeTypes = { power: PowerEdge };
// Stable identity matters: React Flow re-syncs this object into its store whenever the reference changes,
// which would overwrite the options of an in-flight fitView request.
const defaultFitViewOptions = { padding: 0.08 };

/** Below this width the three-column console cannot fit, so phones get a designed fallback instead. */
const CONSOLE_QUERY = "(min-width: 1000px)";

export function App() {
  const isConsole = useMediaQuery(CONSOLE_QUERY);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" style={cssVariables}>
        {isConsole ? <Console /> : <PhoneFallback />}
      </div>
    </MotionConfig>
  );
}

function Console() {
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID);
  const [learningMode, setLearningMode] = useState(false);
  const [traceActive, setTraceActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [openAsk, setOpenAsk] = useState<string | null>(null);
  const [impactActive, setImpactActive] = useState(false);
  const [tab, setTab] = useState<LensTab>("ask");
  const [openSection, setOpenSection] = useState<LearnSection>("what");
  const [honestyOpen, setHonestyOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [briefOpenItem, setBriefOpenItem] = useState<string | null>(null);
  const [energized, setEnergized] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [decisions, setDecisions] = useState<OperatorDecision[]>(readStoredDecisions);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [tour, setTour] = useState(() => ({ active: !readTourSeen(), index: 0 }));
  const [widgets, setWidgets] = useState<PinnedWidget[]>(() => {
    const stored = readStoredDecisions();
    // A decision card with no decision behind it would render empty, so drop it.
    return readStoredWidgets().filter(
      (widget) => widget.kind !== "decision" || stored.some((decision) => decision.node === widget.node),
    );
  });
  const telemetry = useMockTelemetry();
  const selectedNode = powerNodes.find((node) => node.id === selectedId) ?? defaultNode;

  const initialNodes = useMemo(() => buildInitialNodes(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<PowerNode>(initialNodes);

  // Mouse clicks and keyboard selection (Enter or Space on a focused node) both arrive here
  // as selection changes, so the asset panel follows either input method.
  const handleNodesChange = useCallback<OnNodesChange<PowerNode>>(
    (changes) => {
      onNodesChange(changes);
      const selection = changes.find(
        (change): change is NodeSelectionChange => change.type === "select" && change.selected,
      );
      if (selection) setSelectedId(selection.id);
    },
    [onNodesChange],
  );

  // `selectedId` stays the single source of truth so the guided steps and the graph agree.
  // Exactly one node is highlighted at all times. Only the `selected` flag is rewritten,
  // which leaves dragged positions untouched.
  useEffect(() => {
    setNodes((current) => {
      if (current.every((node) => node.selected === (node.id === selectedId))) return current;
      return current.map((node) =>
        node.selected === (node.id === selectedId) ? node : { ...node, selected: node.id === selectedId },
      );
    });
  }, [selectedId, nodes, setNodes]);

  // Persist once a drag settles rather than on every intermediate move.
  useEffect(() => {
    if (nodes.some((node) => node.dragging)) return;
    savePositions(nodes);
  }, [nodes]);

  // The graph sits unpowered behind the brief and powers up the first time the operator takes control.
  useEffect(() => {
    if (!briefOpen) setEnergized(true);
  }, [briefOpen]);

  // Nodes arriving from the handoff pulse once so the eye lands on them after the view moves.
  useEffect(() => {
    if (!pulseId) return;
    const timer = window.setTimeout(() => setPulseId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [pulseId]);

  // A node that just had its decision recorded settles with one ring in the decided color.
  useEffect(() => {
    if (!settledId) return;
    const timer = window.setTimeout(() => setSettledId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [settledId]);

  // Amber says the equipment has a condition. Red says a human owes a decision.
  // They are different axes, so they get different colors.
  const reviewState = useMemo(() => {
    const map: Record<string, "review" | "decided"> = {};
    for (const item of recommendations) {
      map[item.node] = decisions.some((decision) => decision.node === item.node) ? "decided" : "review";
    }
    return map;
  }, [decisions]);

  const needsReviewCount = Object.values(reviewState).filter((state) => state === "review").length;

  // Impact overlay, cited assets and the arrival pulse all express themselves as node classes,
  // so the canvas stays a pure function of state.
  const impact: ImpactResult | undefined = impactActive ? impactByNode.get(selectedId) : undefined;
  const cited = useMemo(() => {
    if (!openAsk) return new Set<string>();
    return new Set(asksForNode(selectedId).find((ask) => ask.id === openAsk)?.cites ?? []);
  }, [openAsk, selectedId]);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        const classes: string[] = [];
        const review = reviewState[node.id];
        if (review === "review") classes.push("needs-review");
        if (review === "decided") classes.push("is-decided");
        if (node.id === pulseId) classes.push("is-pulsing");
        if (node.id === settledId) classes.push("is-settling");
        if (cited.has(node.id)) classes.push("is-cited");
        let impactRole: PowerNode["data"]["impact"];
        if (impact) {
          if (node.id === impact.failed) impactRole = "failed";
          else if (impact.dropped.includes(node.id)) impactRole = "dropped";
          else if (impact.held.includes(node.id)) impactRole = "held";
          classes.push(impactRole ? `impact-${impactRole}` : "impact-muted");
        }
        const data = review || impactRole ? { ...node.data, review, impact: impactRole } : node.data;
        return {
          ...node,
          data,
          className: classes.join(" "),
          style: { "--depth": nodeDepth[node.id] ?? 0 } as CSSProperties,
        };
      }),
    [nodes, pulseId, settledId, impact, reviewState, cited],
  );

  const resetLayout = useCallback(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, position: { ...initialPositions[node.id] } })),
    );
  }, [setNodes]);

  const edges = useMemo<PowerEdgeType[]>(
    () =>
      connections.map(([source, target]) => {
        const id = `${source}-${target}`;
        let state: PowerEdgeState = traceActive && affectedPath.has(id) ? "traced" : "normal";
        if (impact) {
          const dead = impact.failed === source || impact.failed === target || impact.dropped.includes(target);
          state = dead ? "dead" : "muted";
        }
        return { id, source, target, type: "power", data: { state, depth: nodeDepth[source] ?? 0 } };
      }),
    [traceActive, impact],
  );

  // The Impact tab is where a failure is previewed, so opening it draws the preview on the graph
  // and leaving it clears the graph. The toggle inside the tab can still hide it.
  const changeTab = useCallback((next: LensTab) => {
    setTab(next);
    setImpactActive(next === "impact");
  }, []);

  // The one place trace state changes. Showing the trace also opens the lens on the evidence,
  // unless the caller (a guided step) has its own lens to show. Hiding the trace changes nothing else.
  const showTrace = (next: boolean, lens: LensTab = "evidence") => {
    setTraceActive(next);
    if (next) changeTab(lens);
  };

  // A handoff item lands the operator on the asset it concerns, with the path traced when relevant.
  const openHandoffOnGraph = (item: HandoffItem) => {
    setSelectedId(item.node);
    if (item.showsTrace) showTrace(true);
    else changeTab("ask");
    setBriefOpen(false);
    setPulseId(item.node);
    setFocusRequest({ id: item.node, token: Date.now() });
  };

  const minutesSinceHandoff = shiftHandoff.minutesAgoAtLoad + Math.floor(telemetry.elapsedSeconds / 60);
  const now = simulatedNow(minutesSinceHandoff);

  useEffect(() => saveWidgets(widgets), [widgets]);
  useEffect(() => saveDecisions(decisions), [decisions]);

  const positionOf = (nodeId: string) => nodes.find((node) => node.id === nodeId)?.position.x ?? 0;
  const decisionFor = (nodeId: string) => decisions.find((item) => item.node === nodeId);
  const isPinned = (nodeId: string, kind: WidgetKind) => widgets.some((w) => w.node === nodeId && w.kind === kind);

  const togglePin = (nodeId: string, kind: WidgetKind) => {
    setWidgets((current) =>
      current.some((w) => w.node === nodeId && w.kind === kind)
        ? current.filter((w) => !(w.node === nodeId && w.kind === kind))
        : [
            ...current,
            {
              id: `${nodeId}-${kind}`,
              node: nodeId,
              kind,
              ...defaultPlacement(positionOf(nodeId), current.filter((w) => w.node === nodeId).length),
            },
          ],
    );
  };

  const clearBoard = useCallback(() => {
    setWidgets([]);
    setDecisions([]);
    clearPinsAndDecisions();
  }, []);

  // A recorded decision pins itself, so the operator's own call is on the canvas
  // for the rest of the shift rather than buried in a panel.
  const recordDecision = (decision: OperatorDecision) => {
    setDecisions((current) => [...current.filter((item) => item.node !== decision.node), decision]);
    setWidgets((current) =>
      current.some((w) => w.node === decision.node && w.kind === "decision")
        ? current
        : [
            ...current,
            {
              id: `${decision.node}-decision`,
              node: decision.node,
              kind: "decision",
              ...defaultPlacement(positionOf(decision.node), current.filter((w) => w.node === decision.node).length),
            },
          ],
    );
    setReviewOpen(false);
    // Return to the plain view so the operator sees the red clear and the decision pin itself.
    if (tab === "impact") changeTab("ask");
    setSettledId(decision.node);
  };

  // A new asset closes the open answer. The impact preview follows the selection, so it stays on.
  useEffect(() => {
    setOpenAsk(null);
  }, [selectedId]);

  const goToStep = (index: number) => {
    const step = learningSteps[index];
    setActiveStep(index);
    setSelectedId(step.node);
    if (step.showsTrace) showTrace(true, step.lens);
    else changeTab(step.lens);
  };

  /* ---------------------------------------------------------------------------
   * Guided tour. A step completes when the app reaches the state it asks for.
   * ------------------------------------------------------------------------- */

  const tourStep = tourSteps[tour.index];
  const snapshot: TourSnapshot = {
    briefOpen,
    briefOpenItem,
    selectedId,
    tab,
    impactActive,
    reviewOpen,
    decisionCount: decisions.length,
    learningMode,
  };
  const tourStepDone = tour.active && !!tourStep.isDone?.(snapshot);
  const tourAutoAdvance = tourStepDone && !tourStep.holdWhenDone;

  // A short pause lets the visitor see their action land before the tour moves on.
  useEffect(() => {
    if (!tourAutoAdvance) return;
    const timer = window.setTimeout(
      () => setTour((current) => ({ ...current, index: Math.min(current.index + 1, tourSteps.length - 1) })),
      420,
    );
    return () => window.clearTimeout(timer);
  }, [tourAutoAdvance, tour.index]);

  const endTour = () => {
    setTour({ active: false, index: 0 });
    markTourSeen();
  };

  const nextTourStep = () => setTour((current) => ({ ...current, index: Math.min(current.index + 1, tourSteps.length - 1) }));

  // "Do it for me": performs the step's task, and the state it produces completes the step.
  const doTourTask = () => {
    switch (tourStep.id) {
      case "open-item":
        setBriefOpen(true);
        setBriefOpenItem("ups-a-impedance");
        break;
      case "open-graph":
        openHandoffOnGraph(shiftHandoff.items[0]);
        break;
      case "impact":
        setSelectedId("ups-a");
        changeTab("impact");
        break;
      case "compare":
        changeTab("impact");
        setSelectedId("pdu");
        break;
      case "decide":
        setSelectedId("ups-a");
        setReviewOpen(true);
        break;
      case "learning":
        setLearningMode(true);
        break;
      default:
        nextTourStep();
    }
  };

  // Replaying the tour restores the opening state so every step can be done again.
  const restartTour = () => {
    clearBoard();
    resetLayout();
    setSelectedId(DEFAULT_SELECTED_ID);
    setTraceActive(false);
    changeTab("ask");
    setLearningMode(false);
    setOpenAsk(null);
    setAnswer(null);
    setQuizOpen(false);
    setActiveStep(0);
    setReviewOpen(false);
    setBriefOpenItem(null);
    setBriefOpen(true);
    setTour({ active: true, index: 1 });
  };

  return (
    <>
      <header className="topbar">
        <div className="brand-lockup">
          <BrandMark />
          <strong>Neuron Shift</strong>
          <span className="topbar__context">
            <span>{shiftHandoff.site}</span>
            <span>Night shift</span>
            <span className="mono">{now}</span>
          </span>
        </div>
        <div className="top-actions">
          <button className="button button--quiet" onClick={restartTour}>
            <Path size={14} weight="bold" /> Guided tour
          </button>
          <button id="open-shift-brief" className="button button--secondary" aria-haspopup="dialog" onClick={() => setBriefOpen(true)}>
            <ClipboardText size={14} weight="bold" /> Shift brief
          </button>
          <a className="prototype-link" href="/case-study" data-tour="case-study" title="Read how and why this was built">
            Concept prototype · Case study <ArrowUpRight size={12} weight="bold" />
          </a>
          <span className="avatar" title="Signed in as Louie, the incoming operator">LS</span>
        </div>
      </header>

      <main className="workspace">
        <MissionPanel
          activeStep={activeStep}
          traceActive={traceActive}
          honestyOpen={honestyOpen}
          onToggleHonesty={() => setHonestyOpen((value) => !value)}
          onToggleTrace={() => showTrace(!traceActive)}
          onGoToStep={goToStep}
        />

        <section className="flow-stage" aria-label="Power path">
          <div className="flow-toolbar">
            <div>
              <span className="flow-eyebrow">Electrical single-line · {shiftHandoff.site}</span>
              <h2>Critical load power path</h2>
            </div>
            <div className="toolbar-controls">
              <div className="status-summary" data-tour="status-summary">
                <span className="status-count status-count--flow"><i /> <b className="mono">{statusCounts.healthy}</b> healthy</span>
                <span className="status-count status-count--condition"><i /> <b className="mono">{statusCounts.warning}</b> to watch</span>
                <AnimatePresence initial={false}>
                  {needsReviewCount > 0 && (
                    <motion.span
                      className="status-count status-count--owed"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                    >
                      <i />
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.b
                          key={needsReviewCount}
                          className="mono"
                          initial={{ y: -8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 8, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          {needsReviewCount}
                        </motion.b>
                      </AnimatePresence>{" "}
                      need your decision
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <button
                className={`mode-toggle ${learningMode ? "is-on" : ""}`}
                data-tour="learning-toggle"
                aria-pressed={learningMode}
                title="A personal onboarding overlay. Operators can switch it off."
                onClick={() => setLearningMode((value) => !value)}
              >
                <GraduationCap size={14} weight={learningMode ? "fill" : "regular"} /> Learning layer
                <span className="toggle-track"><span /></span>
              </button>
            </div>
          </div>

          <div className={`flow-canvas ${learningMode ? "learning-on" : ""} ${energized ? "is-energized" : "is-dormant"}`}>
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={handleNodesChange}
              nodesDraggable
              nodesFocusable
              edgesFocusable={false}
              fitView
              fitViewOptions={defaultFitViewOptions}
              minZoom={0.42}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Cross} gap={28} size={5} color={palette.graphGrid} />
              <Controls showInteractive={false} position="bottom-left">
                <ResetLayoutControl onReset={resetLayout} />
                <ClearBoardControl onClear={clearBoard} disabled={widgets.length === 0 && decisions.length === 0} />
              </Controls>
              <ViewportFocus request={focusRequest} />
              <FitOnResize />
              <CanvasWidgets
                widgets={widgets}
                nodes={nodes}
                decisions={decisions}
                onUnpin={(id) => setWidgets((current) => current.filter((w) => w.id !== id))}
                onMove={(id, offset) =>
                  setWidgets((current) => current.map((w) => (w.id === id ? { ...w, offset } : w)))
                }
                onSelect={setSelectedId}
              />
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeBorderRadius={3}
                nodeColor={(node) =>
                  reviewState[node.id] === "review" ? palette.owed : node.data.status === "warning" ? palette.condition : palette.ruleStrong
                }
                maskColor={palette.minimapMask}
              />
            </ReactFlow>
            <div className="flow-legend" aria-label="Legend">
              <span><i className="legend-line legend-line--flow" /> Power flow</span>
              <span><i className="legend-line legend-line--condition" /> Investigated path</span>
              {impact ? (
                <span><i className="legend-line legend-line--dead" /> De-energized if this fails</span>
              ) : (
                <span><i className="legend-ring" /> Needs your decision</span>
              )}
            </div>
          </div>

          <div className="telemetry-bar">
            <span className="telemetry-bar__live"><i aria-hidden="true" /> Live simulation</span>
            <Readout label="Site load" value={`${telemetry.siteLoadMw.toFixed(1)} MW`} />
            <Readout label="PUE" value={telemetry.pue.toFixed(2)} />
            <Readout label="UPS-A runtime" value={`${telemetry.upsRuntimeMin} min`} tone="condition" />
            <Readout label="Last refresh" value={telemetry.secondsAgo === 0 ? "just now" : `${telemetry.secondsAgo} s ago`} quiet />
          </div>
        </section>

        <div className="right-rail">
          <AssetPanel
            node={selectedNode}
            tab={tab}
            onTabChange={changeTab}
            openAsk={openAsk}
            onOpenAsk={setOpenAsk}
            traceActive={traceActive}
            onShowEvidence={() => showTrace(true)}
            impactActive={impactActive}
            onToggleImpact={setImpactActive}
            decision={decisionFor(selectedId)}
            onReviewRecommendation={() => setReviewOpen(true)}
            onPin={(kind) => togglePin(selectedId, kind)}
            isPinned={(kind) => isPinned(selectedId, kind)}
          />
          <AnimatePresence>
            {learningMode && (
              <LearningLayer
                node={selectedNode}
                openSection={openSection}
                onOpenSection={setOpenSection}
                answer={answer}
                onAnswer={setAnswer}
                quizOpen={quizOpen}
                onToggleQuiz={() => setQuizOpen((value) => !value)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {reviewOpen && recommendationByNode.get(selectedId) && (
          <DecisionDialog
            key="decision"
            recommendation={recommendationByNode.get(selectedId) as NonNullable<ReturnType<typeof recommendationByNode.get>>}
            now={now}
            onClose={() => setReviewOpen(false)}
            onDecide={recordDecision}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {briefOpen && (
          <ShiftBrief
            key="brief"
            minutesSinceHandoff={minutesSinceHandoff}
            decisions={decisions}
            openItem={briefOpenItem}
            onToggleItem={setBriefOpenItem}
            onStartShift={() => setBriefOpen(false)}
            onOpenOnGraph={openHandoffOnGraph}
          />
        )}
      </AnimatePresence>

      {tour.active && (
        <TourCoach
          step={tourStep}
          index={tour.index}
          taskDone={tourStepDone}
          canDo={!(tourStep.id === "decide" && reviewOpen)}
          onDo={doTourTask}
          onNext={nextTourStep}
          onSkip={endTour}
          onFinish={endTour}
        />
      )}
    </>
  );
}

/** One telemetry value. The key restarts a brief highlight whenever the value changes. */
function Readout({ label, value, tone, quiet }: { label: string; value: string; tone?: "condition"; quiet?: boolean }) {
  return (
    <div className="readout">
      <small>{label}</small>
      <strong key={value} className={`mono ${tone ? `readout--${tone}` : ""} ${quiet ? "" : "readout--tick"}`}>{value}</strong>
    </div>
  );
}
