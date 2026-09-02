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
import { Bell, BookOpenText, ClipboardText, FlowArrow, Gauge } from "@phosphor-icons/react";
import {
  affectedPath,
  connections,
  DEFAULT_SELECTED_ID,
  defaultNode,
  learningSteps,
  powerNodes,
  shiftHandoff,
  statusCounts,
  type HandoffItem,
  type LearnSection,
  type LensTab,
  type PowerNode,
} from "./data/scenario";
import { buildInitialNodes, initialPositions, savePositions } from "./layoutStorage";
import { useMockTelemetry } from "./useMockTelemetry";
import { LearningPanel } from "./components/LearningPanel";
import { MissionPanel } from "./components/MissionPanel";
import { PowerNodeCard } from "./components/PowerNodeCard";
import { ResetLayoutControl } from "./components/ResetLayoutControl";
import { ViewportFocus, type FocusRequest } from "./components/ViewportFocus";
import { ShiftBrief } from "./components/ShiftBrief";
import { cssVariables, palette } from "./theme";

const nodeTypes = { power: PowerNodeCard };
// Stable identity matters: React Flow re-syncs this object into its store whenever the reference changes,
// which would overwrite the options of an in-flight fitView request.
const defaultFitViewOptions = { padding: 0.06 };

export function App() {
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID);
  const [learningMode, setLearningMode] = useState(true);
  const [traceActive, setTraceActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [tab, setTab] = useState<LensTab>("learn");
  const [openSection, setOpenSection] = useState<LearnSection>("what");
  const [honestyOpen, setHonestyOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
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

  const displayNodes = useMemo(
    () => (pulseId ? nodes.map((node) => (node.id === pulseId ? { ...node, className: "is-pulsing" } : node)) : nodes),
    [nodes, pulseId],
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
        const color = affected ? palette.amber : palette.green;
        return {
          id,
          source,
          target,
          type: "smoothstep",
          animated: affected,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: {
            stroke: color,
            strokeWidth: affected ? 2.4 : 1.4,
            opacity: affected ? 1 : 0.58,
          },
        };
      }),
    [traceActive],
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
    else setTab("learn");
    setBriefOpen(false);
    setPulseId(item.node);
    setFocusRequest({ id: item.node, token: Date.now() });
  };

  const minutesSinceHandoff = shiftHandoff.minutesAgoAtLoad + Math.floor(telemetry.elapsedSeconds / 60);

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
              <button
                className={`mode-toggle ${learningMode ? "is-on" : ""}`}
                aria-pressed={learningMode}
                onClick={() => setLearningMode((value) => !value)}
              >
                <BookOpenText size={15} /> Learning labels
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
              </Controls>
              <ViewportFocus request={focusRequest} />
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeColor={(node) => (node.data.status === "warning" ? palette.amber : palette.green)}
                maskColor={palette.minimapMask}
              />
            </ReactFlow>
            <div className="flow-legend">
              <span><i className="legend-line legend-line--green" /> Normal flow</span>
              <span><i className="legend-line legend-line--amber" /> Investigated path</span>
              <span><i className="legend-dot" /> Click an asset to learn</span>
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

        <LearningPanel
          node={selectedNode}
          tab={tab}
          onTabChange={setTab}
          openSection={openSection}
          onOpenSection={setOpenSection}
          traceActive={traceActive}
          onShowEvidence={() => showTrace(true)}
          answer={answer}
          onAnswer={setAnswer}
        />
      </main>

      {briefOpen && (
        <ShiftBrief
          minutesSinceHandoff={minutesSinceHandoff}
          onStartShift={() => setBriefOpen(false)}
          onOpenOnGraph={openHandoffOnGraph}
        />
      )}
    </div>
  );
}
