import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useNodesState,
  type Edge,
  type NodeSelectionChange,
  type OnNodesChange,
} from "@xyflow/react";
import { Bell, ClipboardText, FlowArrow, Gauge, GraduationCap } from "@phosphor-icons/react";
import {
  affectedPath,
  connections,
  DEFAULT_SELECTED_ID,
  defaultNode,
  impactByNode,
  learningSteps,
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
  readStoredDecisions,
  readStoredWidgets,
  saveDecisions,
  savePositions,
  saveWidgets,
} from "./layoutStorage";
import { useMockTelemetry } from "./useMockTelemetry";
import { AssetPanel } from "./components/LearningPanel";
import { LearningLayer } from "./components/LearningLayer";
import { MissionPanel } from "./components/MissionPanel";
import { PowerNodeCard } from "./components/PowerNodeCard";
import { ResetLayoutControl } from "./components/ResetLayoutControl";
import { ClearBoardControl } from "./components/ClearBoardControl";
import { ViewportFocus, type FocusRequest } from "./components/ViewportFocus";
import { ShiftBrief } from "./components/ShiftBrief";
import { DecisionDialog } from "./components/DecisionDialog";
import { CanvasWidgets } from "./components/CanvasWidgets";
import { defaultOffset, type PinnedWidget, type WidgetKind } from "./data/widgets";
import { recommendationByNode, recommendations, simulatedNow, type OperatorDecision } from "./data/decisions";
import { cssVariables, palette } from "./theme";

const nodeTypes = { power: PowerNodeCard };
// Stable identity matters: React Flow re-syncs this object into its store whenever the reference changes,
// which would overwrite the options of an in-flight fitView request.
const defaultFitViewOptions = { padding: 0.06 };

export function App() {
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
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [decisions, setDecisions] = useState<OperatorDecision[]>(readStoredDecisions);
  const [reviewOpen, setReviewOpen] = useState(false);
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
  // as selection changes, so the Learning Lens follows either input method.
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

  // Nodes arriving from the handoff pulse once so the eye lands on them after the view moves.
  useEffect(() => {
    if (!pulseId) return;
    const timer = window.setTimeout(() => setPulseId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [pulseId]);

  // Amber says the equipment has a condition. Red says a human owes a decision.
  // They are different axes, so they get different colours.
  const reviewState = useMemo(() => {
    const map: Record<string, "review" | "decided"> = {};
    for (const item of recommendations) {
      map[item.node] = decisions.some((decision) => decision.node === item.node) ? "decided" : "review";
    }
    return map;
  }, [decisions]);

  const needsReviewCount = Object.values(reviewState).filter((state) => state === "review").length;

  // Impact overlay and the arrival pulse both express themselves as node classes,
  // so the canvas stays a pure function of state.
  const impact: ImpactResult | undefined = impactActive ? impactByNode.get(selectedId) : undefined;

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        const classes: string[] = [];
        const review = reviewState[node.id];
        if (review === "review") classes.push("needs-review");
        if (review === "decided") classes.push("is-decided");
        if (node.id === pulseId) classes.push("is-pulsing");
        if (impact) {
          if (node.id === impact.failed) classes.push("impact-failed");
          else if (impact.dropped.includes(node.id)) classes.push("impact-dropped");
          else if (impact.held.includes(node.id)) classes.push("impact-held");
          else classes.push("impact-muted");
        }
        const next = review ? { ...node, data: { ...node.data, review } } : node;
        return classes.length > 0 ? { ...next, className: classes.join(" ") } : next;
      }),
    [nodes, pulseId, impact, reviewState],
  );

  const resetLayout = useCallback(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, position: { ...initialPositions[node.id] } })),
    );
  }, [setNodes]);

  const edges = useMemo<Edge[]>(
    () =>
      connections.map(([source, target]) => {
        const id = `${source}-${target}`;
        const affected = traceActive && affectedPath.has(id);
        const deEnergised = impact ? impact.failed === source || impact.failed === target || impact.dropped.includes(target) : false;
        const color = deEnergised ? palette.danger : affected ? palette.amber : palette.green;
        return {
          id,
          source,
          target,
          type: "smoothstep",
          animated: affected && !deEnergised,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: {
            stroke: color,
            strokeWidth: deEnergised || affected ? 2.4 : 1.4,
            opacity: impact && !deEnergised ? 0.22 : affected || deEnergised ? 1 : 0.58,
            strokeDasharray: deEnergised ? "5 4" : undefined,
          },
        };
      }),
    [traceActive, impact],
  );

  // The one place trace state changes. Showing the trace also opens the lens on the evidence,
  // unless the caller (a guided step) has its own lens to show. Hiding the trace changes nothing else.
  const showTrace = (next: boolean, lens: LensTab = "evidence") => {
    setTraceActive(next);
    if (next) setTab(lens);
  };

  // Guided steps own the step index and the selected node. They may turn the trace on, never off.
  // A handoff item lands the operator on the asset it concerns, with the path traced when relevant.
  const openHandoffOnGraph = (item: HandoffItem) => {
    setSelectedId(item.node);
    if (item.showsTrace) showTrace(true);
    else setTab("ask");
    setBriefOpen(false);
    setPulseId(item.node);
    setFocusRequest({ id: item.node, token: Date.now() });
  };

  const minutesSinceHandoff = shiftHandoff.minutesAgoAtLoad + Math.floor(telemetry.elapsedSeconds / 60);

  useEffect(() => saveWidgets(widgets), [widgets]);
  useEffect(() => saveDecisions(decisions), [decisions]);

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
              offset: defaultOffset(current.filter((w) => w.node === nodeId).length),
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
              offset: defaultOffset(current.filter((w) => w.node === decision.node).length),
            },
          ],
    );
    setReviewOpen(false);
  };

  // A new asset invalidates the open answer and any impact overlay from the previous one.
  useEffect(() => {
    setOpenAsk(null);
    setImpactActive(false);
  }, [selectedId]);

  const goToStep = (index: number) => {
    const step = learningSteps[index];
    setActiveStep(index);
    setSelectedId(step.node);
    if (step.showsTrace) showTrace(true, step.lens);
    else setTab(step.lens);
  };

  return (
    <div className="app-shell" style={cssVariables}>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark"><FlowArrow size={20} weight="duotone" /></span>
          <div><strong>NEURON</strong><span>Shift</span></div>
        </div>
        <div className="top-actions">
          <span className="prototype-pill">Exploratory prototype</span>
          <button id="open-shift-brief" className="ghost-button" aria-haspopup="dialog" onClick={() => setBriefOpen(true)}>
            <ClipboardText size={15} /> Shift brief
          </button>
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
          <span className="avatar">LS</span>
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

        <section className="flow-stage">
          <div className="flow-toolbar">
            <div>
              <span className="flow-eyebrow">ASHBURN 88 · Electrical single-line</span>
              <h2>Critical load power path</h2>
            </div>
            <div className="toolbar-controls">
              <span className="health-badge"><span /> {statusCounts.healthy} healthy</span>
              <span className="warning-badge"><span /> {statusCounts.warning} watch items</span>
              {needsReviewCount > 0 && (
                <span className="review-badge"><span /> {needsReviewCount} need your review</span>
              )}
              <button
                className={`mode-toggle ${learningMode ? "is-on" : ""}`}
                aria-pressed={learningMode}
                title="A personal onboarding overlay. Operators can switch it off."
                onClick={() => setLearningMode((value) => !value)}
              >
                <GraduationCap size={15} /> Learning layer
                <span className="toggle-track"><span /></span>
              </button>
            </div>
          </div>

          <div className={`flow-canvas ${learningMode ? "learning-on" : ""}`}>
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              nodesDraggable
              nodesFocusable
              fitView
              fitViewOptions={defaultFitViewOptions}
              minZoom={0.42}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} color={palette.graphGrid} />
              <Controls showInteractive={false} position="bottom-left">
                <ResetLayoutControl onReset={resetLayout} />
                <ClearBoardControl onClear={clearBoard} disabled={widgets.length === 0 && decisions.length === 0} />
              </Controls>
              <ViewportFocus request={focusRequest} />
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
                nodeColor={(node) => (reviewState[node.id] === "review" ? palette.danger : node.data.status === "warning" ? palette.amber : palette.green)}
                maskColor={palette.minimapMask}
              />
            </ReactFlow>
            <div className="flow-legend">
              <span><i className="legend-line legend-line--green" /> Normal flow</span>
              <span><i className="legend-line legend-line--amber" /> Investigated path</span>
              {impact ? (
                <span><i className="legend-line legend-line--danger" /> De-energised if this fails</span>
              ) : needsReviewCount > 0 ? (
                <span><i className="legend-ring" /> Needs your review</span>
              ) : (
                <span><i className="legend-dot" /> Click an asset to inspect</span>
              )}
            </div>
          </div>

          <div className="telemetry-bar">
            <span><Gauge size={15} /> Live simulation</span>
            <div><small>Site load</small><strong>{telemetry.siteLoadMw.toFixed(1)} MW</strong></div>
            <div><small>PUE</small><strong>{telemetry.pue.toFixed(2)}</strong></div>
            <div><small>UPS-A runtime</small><strong className="amber-text">{telemetry.upsRuntimeMin} min</strong></div>
            <div>
              <small>Last refresh</small>
              <strong>{telemetry.secondsAgo === 0 ? "just now" : `${telemetry.secondsAgo} sec ago`}</strong>
            </div>
          </div>
        </section>

        <div className="right-rail">
          <AssetPanel
            node={selectedNode}
            tab={tab}
            onTabChange={setTab}
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
        </div>
      </main>

      {reviewOpen && recommendationByNode.get(selectedId) && (
        <DecisionDialog
          recommendation={recommendationByNode.get(selectedId) as NonNullable<ReturnType<typeof recommendationByNode.get>>}
          now={simulatedNow(minutesSinceHandoff)}
          onClose={() => setReviewOpen(false)}
          onDecide={recordDecision}
        />
      )}

      {briefOpen && (
        <ShiftBrief
          minutesSinceHandoff={minutesSinceHandoff}
          decisions={decisions}
          onStartShift={() => setBriefOpen(false)}
          onOpenOnGraph={openHandoffOnGraph}
        />
      )}
    </div>
  );
}
