import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Cable,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Cpu,
  Download,
  Eraser,
  GitBranch,
  Info,
  Lightbulb,
  Orbit,
  PanelLeft,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from "lucide-react";

type Page = "briefing" | "lab" | "matrix";
type NodeType = "input" | "and" | "or" | "not" | "nand" | "nor" | "xor" | "xnor" | "output";
type PinKind = "input" | "output";

type CircuitNode = {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  value?: 0 | 1;
};

type Connection = {
  id: string;
  from: string;
  to: string;
  toIndex: number;
};

type TruthRow = {
  inputs: number[];
  outputs: number[];
};

const GATE_META: Record<NodeType, { name: string; short: string; category: string; inputs: number; accent: string }> = {
  input: { name: "Input toggle", short: "IN", category: "Sources", inputs: 0, accent: "amber" },
  and: { name: "AND gate", short: "AND", category: "Logic gates", inputs: 2, accent: "cyan" },
  or: { name: "OR gate", short: "OR", category: "Logic gates", inputs: 2, accent: "violet" },
  not: { name: "NOT gate", short: "NOT", category: "Logic gates", inputs: 1, accent: "pink" },
  nand: { name: "NAND gate", short: "NAND", category: "Logic gates", inputs: 2, accent: "lime" },
  nor: { name: "NOR gate", short: "NOR", category: "Logic gates", inputs: 2, accent: "blue" },
  xor: { name: "XOR gate", short: "XOR", category: "Logic gates", inputs: 2, accent: "orange" },
  xnor: { name: "XNOR gate", short: "XNOR", category: "Logic gates", inputs: 2, accent: "red" },
  output: { name: "Terminal LED", short: "LED", category: "Outputs", inputs: 1, accent: "green" },
};

const INITIAL_NODES: CircuitNode[] = [
  { id: "input-a", type: "input", label: "INPUT A", x: 76, y: 118, value: 0 },
  { id: "input-b", type: "input", label: "INPUT B", x: 76, y: 330, value: 1 },
  { id: "gate-and", type: "and", label: "AND 01", x: 390, y: 214 },
  { id: "output-led", type: "output", label: "OUTPUT", x: 735, y: 238 },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "wire-a", from: "input-a", to: "gate-and", toIndex: 0 },
  { id: "wire-b", from: "input-b", to: "gate-and", toIndex: 1 },
  { id: "wire-out", from: "gate-and", to: "output-led", toIndex: 0 },
];

function getInputCount(type: NodeType) {
  return GATE_META[type].inputs;
}

function isSource(type: NodeType) {
  return type !== "output";
}

function evaluateCircuit(nodes: CircuitNode[], connections: Connection[], overrides?: Record<string, number>) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const cache = new Map<string, number>();
  const visiting = new Set<string>();

  const evaluate = (id: string): number => {
    if (cache.has(id)) return cache.get(id)!;
    if (visiting.has(id)) return 0;
    const node = nodeMap.get(id);
    if (!node) return 0;
    visiting.add(id);

    let result = 0;
    if (node.type === "input") {
      result = overrides?.[id] ?? node.value ?? 0;
    } else {
      const incoming = connections.filter((wire) => wire.to === id);
      const args = Array.from({ length: getInputCount(node.type) }, (_, index) => {
        const wire = incoming.find((candidate) => candidate.toIndex === index);
        return wire ? evaluate(wire.from) : 0;
      });
      const [a = 0, b = 0] = args;
      switch (node.type) {
        case "and": result = a & b; break;
        case "or": result = a | b; break;
        case "not": result = a ? 0 : 1; break;
        case "nand": result = a & b ? 0 : 1; break;
        case "nor": result = a | b ? 0 : 1; break;
        case "xor": result = a ^ b; break;
        case "xnor": result = a === b ? 1 : 0; break;
        case "output": result = a; break;
        default: result = 0;
      }
    }
    visiting.delete(id);
    cache.set(id, result);
    return result;
  };

  const values: Record<string, number> = {};
  nodes.forEach((node) => { values[node.id] = evaluate(node.id); });
  return values;
}

function pinPosition(node: CircuitNode, kind: PinKind, index = 0) {
  const count = getInputCount(node.type);
  if (kind === "output") return { x: node.x + 176, y: node.y + 39 };
  return { x: node.x, y: node.y + 39 + (count === 2 ? (index === 0 ? -13 : 13) : 0) };
}

function signalClass(value: number) {
  return value ? "signal-high" : "signal-low";
}

function AppLogo() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><Orbit size={19} strokeWidth={2.2} /><span /></div>
      <div><strong>LOGIC//LAB</strong><small>BOOLEAN SYSTEMS</small></div>
    </div>
  );
}

function TopNav({ page, setPage, inputCount, wireCount }: { page: Page; setPage: (page: Page) => void; inputCount: number; wireCount: number }) {
  const items: { id: Page; number: string; label: string; icon: typeof Orbit }[] = [
    { id: "briefing", number: "01", label: "Mission briefing", icon: CircleHelp },
    { id: "lab", number: "02", label: "Lab workspace", icon: Cpu },
    { id: "matrix", number: "03", label: "Matrix decoder", icon: GitBranch },
  ];
  return (
    <header className="topbar">
      <AppLogo />
      <nav className="topnav" aria-label="Primary navigation">
        {items.map(({ id, number, label, icon: Icon }) => (
          <button key={id} onClick={() => setPage(id)} className={page === id ? "nav-item active" : "nav-item"}>
            <span className="nav-number">{number}</span><Icon size={15} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="top-status"><span className="status-dot" /> SIMULATOR ONLINE <span className="status-divider" /> {inputCount} INPUTS <span className="status-divider" /> {wireCount} WIRES</div>
    </header>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: React.ReactNode; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function Briefing({ setPage }: { setPage: (page: Page) => void }) {
  const steps = [
    { n: "01", title: "Open the workspace", copy: "Move into The Lab Workspace and start from a clean, inspectable circuit canvas.", icon: PanelLeft },
    { n: "02", title: "Place components", copy: "Add input toggles, standard gates, and terminal LEDs from the component palette.", icon: Plus },
    { n: "03", title: "Route signals", copy: "Click an output pin, then click an input pin to create a precise snapped wire.", icon: Cable },
    { n: "04", title: "Inject logic", copy: "Flip the amber switches to push real-time HIGH (1) and LOW (0) signals through the graph.", icon: Zap },
    { n: "05", title: "Decode the matrix", copy: "Open Matrix Decoder and calculate every 2ⁿ input permutation in one pass.", icon: GitBranch },
  ];
  return (
    <main className="page-shell briefing-page">
      <PageHeader eyebrow="MISSION CONTROL / 01" title={<>Make boolean logic<br /><em>visible.</em></>} description="A visual circuit workbench for designing, probing, and validating digital logic without the spreadsheet busywork." action={<button className="primary-button" onClick={() => setPage("lab")}><Play size={15} /> Enter the lab <ArrowRight size={15} /></button>} />
      <section className="brief-hero-grid">
        <div className="brief-hero-card panel-surface">
          <div className="hero-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Cpu size={26} /></div><span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" /></div>
          <div className="hero-card-copy"><div className="label-chip">WHY IT MATTERS <Sparkles size={12} /></div><h2>From abstract equation<br />to <span>live hardware model.</span></h2><p>Logic Lab visualizes boolean algebra as a signal network you can touch. It automates truth-table construction, exposes propagation in real time, and removes the manual computation errors that slow down engineering reviews.</p><button className="text-button" onClick={() => setPage("matrix")}>See the decoder <ArrowRight size={14} /></button></div>
        </div>
        <div className="metrics-stack">
          <div className="metric-card"><span className="metric-icon cyan"><Activity size={17} /></span><div><strong>LIVE</strong><small>signal propagation</small></div><span className="metric-value">01<span> ms</span></span></div>
          <div className="metric-card"><span className="metric-icon amber"><GitBranch size={17} /></span><div><strong>2ⁿ</strong><small>matrix permutations</small></div><span className="metric-value">∞</span></div>
          <div className="metric-card"><span className="metric-icon green"><Check size={17} /></span><div><strong>ZERO</strong><small>manual calculations</small></div><span className="metric-value">100<span>%</span></span></div>
          <div className="mission-note"><Target size={16} /><span>Built for the circuit-design mindset: <b>place, connect, probe, prove.</b></span></div>
        </div>
      </section>
      <section className="manual-section"><div className="section-kicker"><span>FLIGHT MANUAL</span><span className="section-rule" /><span>05 STEPS</span></div><div className="steps-grid">{steps.map(({ n, title, copy, icon: Icon }) => <div className="step-card" key={n}><div className="step-top"><span className="step-number">{n}</span><Icon size={18} /></div><h3>{title}</h3><p>{copy}</p><ChevronRight className="step-arrow" size={16} /></div>)}</div></section>
      <section className="brief-footer-callout"><div><div className="eyebrow"><span className="eyebrow-line" /> FIELD NOTE</div><h2>Good logic is <em>observable.</em></h2></div><p>Use the workspace to experiment freely. Your circuit state stays intact as you move between the Lab and Matrix tabs.</p><button className="secondary-button" onClick={() => setPage("lab")}>Open workspace <ArrowRight size={15} /></button></section>
    </main>
  );
}

function Palette({ addNode }: { addNode: (type: NodeType) => void }) {
  const groups = [
    { label: "Sources", types: ["input"] as NodeType[] },
    { label: "Logic gates", types: ["and", "or", "not", "nand", "nor", "xor", "xnor"] as NodeType[] },
    { label: "Outputs", types: ["output"] as NodeType[] },
  ];
  return <aside className="palette"><div className="palette-head"><div><span className="palette-overline">COMPONENT PALETTE</span><h2>Build your circuit</h2></div><button className="icon-button" title="Palette info"><Info size={15} /></button></div><p className="palette-hint">Drag-free precision: click a component to drop it into the workspace.</p>{groups.map((group) => <div className="palette-group" key={group.label}><div className="palette-group-label">{group.label}<span>{group.types.length}</span></div>{group.types.map((type) => <button key={type} className={`palette-item palette-${GATE_META[type].accent}`} onClick={() => addNode(type)}><span className="palette-symbol">{type === "input" ? <Zap size={14} /> : type === "output" ? <Lightbulb size={14} /> : GATE_META[type].short}</span><span>{GATE_META[type].name}</span><Plus size={14} /></button>)}</div>)}<div className="palette-tip"><Lightbulb size={15} /><span><b>Pro tip</b><br />Wire an output to a pin, then watch the path light up.</span></div></aside>;
}

function Lab({ nodes, setNodes, connections, setConnections, values, setPage }: { nodes: CircuitNode[]; setNodes: React.Dispatch<React.SetStateAction<CircuitNode[]>>; connections: Connection[]; setConnections: React.Dispatch<React.SetStateAction<Connection[]>>; values: Record<string, number>; setPage: (page: Page) => void }) {
  const [wireStart, setWireStart] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [toast, setToast] = useState("Click an output pin, then an input pin to wire.");
  const inputCount = nodes.filter((node) => node.type === "input").length;

  const addNode = (type: NodeType) => {
    const sameType = nodes.filter((node) => node.type === type).length;
    const nextNode: CircuitNode = { id: `${type}-${Date.now()}`, type, label: `${GATE_META[type].short} ${String(sameType + 1).padStart(2, "0")}`, x: 260 + (sameType % 3) * 210, y: 70 + (sameType % 4) * 112, ...(type === "input" ? { value: 0 as 0 | 1 } : {}) };
    setNodes((current) => [...current, nextNode]);
    setToast(`${GATE_META[type].name} added to the workspace.`);
  };

  const removeNode = (id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setConnections((current) => current.filter((wire) => wire.from !== id && wire.to !== id));
    setSelectedNode(null);
    setToast("Component removed. The remaining graph is still live.");
  };

  const toggleInput = (id: string) => setNodes((current) => current.map((node) => node.id === id && node.type === "input" ? { ...node, value: node.value === 1 ? 0 : 1 } : node));

  const connect = (from: string, to: string) => {
    if (from === to) return;
    const target = nodes.find((node) => node.id === to);
    const source = nodes.find((node) => node.id === from);
    if (!target || !source || !isSource(source.type) || getInputCount(target.type) < 1) return;
    const usedIndexes = connections.filter((wire) => wire.to === to).map((wire) => wire.toIndex);
    const firstFree = Array.from({ length: getInputCount(target.type) }, (_, i) => i).find((i) => !usedIndexes.includes(i));
    const targetIndex = firstFree ?? 0;
    const next = { id: `wire-${Date.now()}`, from, to, toIndex: targetIndex };
    setConnections((current) => [...current.filter((wire) => !(wire.to === to && wire.toIndex === targetIndex)), next]);
    setWireStart(null);
    setToast(`${source.label} → ${target.label} connected.`);
  };

  const clearCircuit = () => {
    setNodes([]); setConnections([]); setWireStart(null); setToast("Workspace cleared. Add a component to start a new graph.");
  };
  const resetDemo = () => { setNodes(INITIAL_NODES); setConnections(INITIAL_CONNECTIONS); setToast("Demo circuit restored."); };

  return <main className="lab-page"><div className="lab-toolbar"><div><div className="eyebrow"><span className="eyebrow-line" /> THE LAB WORKSPACE / 02</div><h1>Signal <em>assembly.</em></h1></div><div className="lab-actions"><button className="toolbar-button" onClick={resetDemo}><RotateCcw size={14} /> Reset demo</button><button className="toolbar-button danger" onClick={clearCircuit}><Eraser size={14} /> Clear</button><button className="primary-button small" onClick={() => setPage("matrix")}><GitBranch size={14} /> Decode matrix <ArrowRight size={14} /></button></div></div><div className="lab-layout"><Palette addNode={addNode} /><section className="workspace-shell"><div className="workspace-meta"><div className="workspace-title"><span className="live-pulse" /> <b>LIVE CANVAS</b><span className="workspace-divider" /> {nodes.length} COMPONENTS <span className="workspace-divider" /> {connections.length} CONNECTIONS</div><div className="workspace-help"><Cable size={14} /> {toast}</div></div><div className="workspace-canvas" onClick={() => setSelectedNode(null)}><div className="grid-crosshair one" /><div className="grid-crosshair two" /><svg className="wires" viewBox="0 0 1000 600" preserveAspectRatio="none">{connections.map((wire) => { const fromNode = nodes.find((node) => node.id === wire.from); const toNode = nodes.find((node) => node.id === wire.to); if (!fromNode || !toNode) return null; const start = pinPosition(fromNode, "output"); const end = pinPosition(toNode, "input", wire.toIndex); const midX = (start.x + end.x) / 2; const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`; return <g key={wire.id}><path className={`wire-shadow ${signalClass(values[wire.from] ?? 0)}`} d={path} /><path className={`wire-path ${signalClass(values[wire.from] ?? 0)}`} d={path} /><circle className={`wire-end ${signalClass(values[wire.from] ?? 0)}`} cx={end.x} cy={end.y} r="3.5" /></g>; })}</svg>{nodes.map((node) => <div key={node.id} className={`circuit-node node-${GATE_META[node.type].accent} ${selectedNode === node.id ? "selected" : ""}`} style={{ left: node.x, top: node.y }} onClick={(event) => { event.stopPropagation(); setSelectedNode(node.id); }}><div className="node-header"><span className="node-type">{GATE_META[node.type].short}</span><span className="node-label">{node.label}</span><button className="node-remove" onClick={(event) => { event.stopPropagation(); removeNode(node.id); }} aria-label={`Remove ${node.label}`}><Trash2 size={11} /></button></div><div className="node-body">{node.type === "input" ? <button className={`toggle-switch ${node.value ? "on" : ""}`} onClick={(event) => { event.stopPropagation(); toggleInput(node.id); }}><span className="toggle-track"><span className="toggle-knob" /></span><span className="toggle-readout">{node.value ? "HIGH" : "LOW"}<b>{node.value}</b></span></button> : node.type === "output" ? <div className={`led-readout ${values[node.id] ? "lit" : ""}`}><span className="led-bulb" /><span>{values[node.id] ? "HIGH" : "LOW"}</span><b>{values[node.id] ?? 0}</b></div> : <div className="gate-shape"><span className="gate-symbol">{GATE_META[node.type].short}</span><span className="gate-equation">{node.type === "not" ? "¬ A" : node.type === "xnor" ? "A ≡ B" : `${node.type.toUpperCase()} (A, B)`}</span></div>}</div>{Array.from({ length: getInputCount(node.type) }, (_, index) => <button key={`in-${index}`} className={`pin pin-input ${values[node.id] ? "high" : ""}`} style={{ top: getInputCount(node.type) === 2 ? (index === 0 ? 26 : 52) : 39 }} title="Input pin" onPointerUp={(event) => { event.stopPropagation(); if (wireStart) connect(wireStart, node.id); }} onClick={(event) => { event.stopPropagation(); if (wireStart) connect(wireStart, node.id); }} />)}{node.type !== "output" && <button className={`pin pin-output ${values[node.id] ? "high" : ""} ${wireStart === node.id ? "armed" : ""}`} title="Output pin — click, then select an input" onPointerDown={(event) => { event.stopPropagation(); setWireStart(node.id); setToast(`Output armed from ${node.label}. Select an input pin.`); }} onClick={(event) => { event.stopPropagation(); setWireStart(node.id); setToast(`Output armed from ${node.label}. Select an input pin.`); }} />}</div>)}</div><div className="workspace-footer"><div className="legend"><span><i className="legend-line high" /> HIGH / 1</span><span><i className="legend-line low" /> LOW / 0</span><span><i className="legend-pin" /> PIN</span></div><div className="canvas-tip"><CircleHelp size={13} /> Tip: wires snap to the first open input pin</div></div></section></div></main>;
}

function Matrix({ nodes, connections, values, setPage }: { nodes: CircuitNode[]; connections: Connection[]; values: Record<string, number>; setPage: (page: Page) => void }) {
  const [decoded, setDecoded] = useState(false);
  const inputs = nodes.filter((node) => node.type === "input");
  const outputs = nodes.filter((node) => node.type === "output");
  const rows = useMemo<TruthRow[]>(() => {
    const count = Math.min(inputs.length, 8);
    return Array.from({ length: Math.pow(2, count) }, (_, rowIndex) => {
      const bits = inputs.slice(0, count).map((_, index) => (rowIndex >> (count - index - 1)) & 1);
      const overrides = Object.fromEntries(inputs.slice(0, count).map((input, index) => [input.id, bits[index]]));
      const evaluated = evaluateCircuit(nodes, connections, overrides);
      return { inputs: bits, outputs: outputs.map((output) => evaluated[output.id] ?? 0) };
    });
  }, [nodes, connections, inputs, outputs]);
  const activeRows = rows.filter((row) => row.outputs.some(Boolean)).length;
  const outputValue = outputs.map((node) => values[node.id] ?? 0);

  const decode = () => setDecoded(true);
  const downloadCsv = () => {
    const header = [...inputs.map((node) => node.label), ...outputs.map((node) => node.label)].join(",");
    const body = rows.map((row) => [...row.inputs, ...row.outputs].join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "logic-lab-truth-table.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <main className="page-shell matrix-page"><PageHeader eyebrow="MATRIX DECODER / 03" title={<>Prove the <em>circuit.</em></>} description="Enumerate every input permutation, evaluate the graph, and export a clean truth matrix for your design review." action={<div className="matrix-actions"><button className="secondary-button" onClick={downloadCsv}><Download size={14} /> Export CSV</button><button className="primary-button" onClick={decode}><GitBranch size={15} /> Decode circuit matrix</button></div>} /><section className="matrix-summary"><div className="summary-card"><span className="summary-label">INPUT SPACE</span><strong>2<sup>{inputs.length}</sup></strong><small>{inputs.length} independent input{inputs.length === 1 ? "" : "s"}</small></div><div className="summary-card"><span className="summary-label">OBSERVATIONS</span><strong>{rows.length}</strong><small>generated permutations</small></div><div className="summary-card"><span className="summary-label">ACTIVE OUTPUTS</span><strong className="green-text">{activeRows}</strong><small>rows evaluate HIGH</small></div><div className="summary-card summary-live"><span className="summary-label">LIVE STATE</span><div className="summary-led"><span className={`led-bulb ${outputValue.some(Boolean) ? "lit" : ""}`} /><strong>{outputValue.some(Boolean) ? "HIGH" : "LOW"}</strong><span className="binary-pill">{outputValue.join("") || "0"}</span></div><small>current canvas reading</small></div></section><section className="matrix-card panel-surface"><div className="matrix-card-head"><div><div className="section-kicker compact"><span>TRUTH TABLE / {decoded ? "DECODED" : "READY"}</span><span className="section-rule" /></div><h2>Boolean observation matrix</h2><p>{decoded ? "Every possible input permutation has been evaluated against the current circuit graph." : "Press Decode circuit matrix to calculate every possible state."}</p></div><div className="matrix-status"><span className={`status-dot ${decoded ? "green" : "amber-dot"}`} /> {decoded ? "CALCULATION COMPLETE" : "AWAITING DECODE"}</div></div>{nodes.length === 0 || inputs.length === 0 || outputs.length === 0 ? <div className="matrix-empty"><GitBranch size={25} /><h3>Nothing to decode yet</h3><p>Add at least one input toggle and one terminal LED in the Lab Workspace.</p><button className="secondary-button" onClick={() => setPage("lab")}>Return to workspace <ArrowRight size={14} /></button></div> : <div className="table-wrap"><table><thead><tr><th className="index-col">#</th>{inputs.map((node) => <th key={node.id}><span className="th-type input-th">IN</span>{node.label}</th>)}<th className="divider-col" /><th><span className="th-type output-th">OUT</span>{outputs[0]?.label ?? "OUTPUT"}</th></tr></thead><tbody>{rows.map((row, index) => { const isActive = row.outputs.some(Boolean); return <tr key={index} className={isActive && decoded ? "active-row" : ""}><td className="index-col">{String(index + 1).padStart(2, "0")}</td>{row.inputs.map((bit, inputIndex) => <td key={`${index}-${inputIndex}`}><span className={`table-bit ${bit ? "one" : "zero"}`}>{bit}</span></td>)}<td className="divider-col" /><td><span className={`table-bit output-bit ${row.outputs[0] ? "one" : "zero"}`}>{row.outputs[0] ?? 0}</span>{isActive && decoded && <Check size={14} className="row-check" />}</td></tr>; })}</tbody></table></div>}</section><div className="decoder-note"><Info size={16} /><p><b>How it works:</b> the decoder finds independent input nodes, generates all 2ⁿ binary combinations, then recursively evaluates every placed gate until it reaches the terminal LED.</p><button className="text-button" onClick={() => setPage("lab")}>Edit circuit <ArrowRight size={14} /></button></div></main>;
}

export default function Home() {
  const [page, setPage] = useState<Page>("briefing");
  const [nodes, setNodes] = useState<CircuitNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const values = useMemo(() => evaluateCircuit(nodes, connections), [nodes, connections]);
  const inputCount = nodes.filter((node) => node.type === "input").length;

  return <div className="app-shell"><TopNav page={page} setPage={setPage} inputCount={inputCount} wireCount={connections.length} />{page === "briefing" && <Briefing setPage={setPage} />}{page === "lab" && <Lab nodes={nodes} setNodes={setNodes} connections={connections} setConnections={setConnections} values={values} setPage={setPage} />}{page === "matrix" && <Matrix nodes={nodes} connections={connections} values={values} setPage={setPage} />}<footer className="app-footer"><span>LOGIC//LAB · DIGITAL SYSTEMS EXPLORER</span><span>STATE PERSISTS BETWEEN MODULES <span className="status-dot" /></span></footer></div>;
}

export { GATE_META };

// PART A: MULTI-PAGE NAV & GAMIFIED USER GUIDE INTERFACE (Assigned to Team Member 1)
// PART B: CORE CIRCUITS & AUTOMATED TRUTH MATRIX ALGORITHM (Assigned to Team Member 2)
