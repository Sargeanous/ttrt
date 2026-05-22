import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Signature,
  Sparkles,
  UsersRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  requirementCounts,
  rules as initialRules,
  signatureCounts,
  stageFlow,
  stageTone,
  submissions,
  type CommentState,
  type DocumentCheck,
  type RequirementState,
  type Rule,
  type Signature as SignatureRecord,
  type SignatureStatus,
  type StageTone,
  type Submission,
  type TimelineStep,
} from "./data";
import admLogo from "./assets/adm-logo.png";
import origenLogo from "./assets/origen-logo.png";
import sutpcLogo from "./assets/sutpc-logo.svg";

type Page = "dashboard" | "submissions" | "reviews" | "signatures" | "rules" | "reports" | "agents" | "workflows" | "settings";

interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Project review",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "submissions", label: "Submissions", icon: Inbox },
      { id: "reviews", label: "Review Board", icon: UsersRound },
      { id: "signatures", label: "Signatures", icon: Signature },
      { id: "rules", label: "Rules", icon: Library },
      { id: "reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "agents", label: "Agents & Alerts", icon: Bot },
      { id: "workflows", label: "Workflow Setup", icon: GitBranch },
    ],
  },
];

const pageLabels: Record<Page, { group: string; page: string }> = {
  dashboard: { group: "Project review", page: "Dashboard" },
  submissions: { group: "Project review", page: "Submissions" },
  reviews: { group: "Project review", page: "Review Board" },
  signatures: { group: "Project review", page: "Signatures" },
  rules: { group: "Project review", page: "Rules" },
  reports: { group: "Project review", page: "Reports" },
  agents: { group: "Platform", page: "Agents & Alerts" },
  workflows: { group: "Platform", page: "Workflow Setup" },
  settings: { group: "Admin", page: "Settings" },
};

const isEmbedded = new URLSearchParams(window.location.search).get("embed") === "1";

export default function App() {
  const [signedIn, setSignedIn] = useState(isEmbedded);
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [foldedGroups, setFoldedGroups] = useState<Record<string, boolean>>({ Platform: true });
  const [rules, setRules] = useState<Rule[]>(initialRules);

  const selected = submissions.find((item) => item.id === selectedId) ?? submissions[0];
  const searchQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!searchQuery) return submissions;
    return submissions.filter((submission) =>
      [
        submission.code,
        submission.name,
        submission.sector,
        submission.division,
        submission.manager,
        submission.stage,
        submission.decision,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [searchQuery]);

  if (!signedIn) return <Login onSubmit={() => setSignedIn(true)} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <img src={admLogo} alt="Abu Dhabi Mobility" className="brand-logo" />
          <p>TTRT</p>
          <button className="sidebar-close" type="button" aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)}>
            <PanelLeftClose size={18} />
          </button>
        </div>
        <button className="ask-button" type="button" onClick={() => setPage("submissions")}>
          <Sparkles size={16} />
          <span>Ask TTRT...</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="sidebar-nav">
          {navGroups.map((group) => {
            const folded = foldedGroups[group.label];
            return (
              <section className="nav-group" key={group.label}>
                <button
                  className="nav-group-toggle"
                  type="button"
                  onClick={() => setFoldedGroups((current) => ({ ...current, [group.label]: !current[group.label] }))}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={folded ? "folded" : ""} size={14} />
                </button>
                {!folded && (
                  <div className="nav-group-items">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        className={`nav-item ${page === item.id ? "active" : ""}`}
                        type="button"
                        onClick={() => setPage(item.id)}
                      >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="built-by">
            Built by Origen + SUTPC for ITC
            <img src={origenLogo} alt="Origen" />
            <span className="partner-plus">+</span>
            <img src={sutpcLogo} alt="SUTPC" className="sutpc-logo" />
          </div>
        </div>
      </aside>

      <div className={`main ${sidebarOpen ? "" : "expanded"}`}>
        <header className="topbar">
          {!sidebarOpen && (
            <button className="icon-button" type="button" aria-label="Expand sidebar" onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen size={18} />
            </button>
          )}
          <div className="breadcrumb">
            <span>{pageLabels[page].group}</span>
            <ArrowRight size={14} />
            <strong>{pageLabels[page].page}</strong>
          </div>
          <label className="top-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search submissions, reviewers, sectors..."
            />
          </label>
          <div className="top-actions">
            <div className="powered-by">
              Powered by
              <img src={origenLogo} alt="Origen" />
              <span className="partner-plus">+</span>
              <img src={sutpcLogo} alt="SUTPC" className="sutpc-logo" />
            </div>
            <span className="clock">18:42 / Asia Dubai</span>
            <button className="icon-button" type="button" aria-label="Notifications"><Bell size={17} /><span className="dot" /></button>
            <button className="icon-button" type="button" aria-label="Settings" onClick={() => setPage("settings")}><Settings size={17} /></button>
            <button className="icon-button" type="button" aria-label="Sign out" onClick={() => setSignedIn(false)}><LogOut size={17} /></button>
          </div>
        </header>

        <main className="content">
          {page === "dashboard" && <Dashboard selected={selected} setPage={setPage} setSelectedId={setSelectedId} />}
          {page === "submissions" && (
            <SubmissionsPage submissions={filtered} selected={selected} setSelectedId={setSelectedId} />
          )}
          {page === "reviews" && <ReviewBoard selected={selected} submissions={filtered} setSelectedId={setSelectedId} />}
          {page === "signatures" && <SignaturesPage selected={selected} submissions={filtered} setSelectedId={setSelectedId} />}
          {page === "rules" && <RulesPage rules={rules} setRules={setRules} />}
          {page === "reports" && <ReportsPage selected={selected} setPage={setPage} />}
          {page === "agents" && <AgentsPage />}
          {page === "workflows" && <WorkflowsPage />}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

function Login({ onSubmit }: { onSubmit: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <img src={admLogo} alt="Abu Dhabi Mobility" />
          <div>
            <h1>Sign in</h1>
            <p>TTRT Review Cockpit</p>
          </div>
        </div>
        <label>
          Email
          <input defaultValue="admin@itc.local" />
        </label>
        <label>
          Password
          <input defaultValue="ChangeMe!2026" type="password" />
        </label>
        <label>
          Tenant
          <input defaultValue="default" />
        </label>
        <button className="primary-button" type="submit">Sign in</button>
        <div className="login-footer">
          Built by Origen + SUTPC for ITC
          <img src={origenLogo} alt="Origen" />
          <span className="partner-plus">+</span>
          <img src={sutpcLogo} alt="SUTPC" className="sutpc-logo" />
        </div>
      </form>
    </div>
  );
}

function Dashboard({ selected, setPage, setSelectedId }: { selected: Submission; setPage: (page: Page) => void; setSelectedId: (id: string) => void }) {
  const actionItems = submissions.filter((item) => item.stage !== "Released" && item.stage !== "Rejected").slice(0, 4);
  const waitingSignatures = submissions.reduce((total, item) => total + signatureCounts(item).pending, 0);
  const missingEvidence = submissions.reduce((total, item) => total + requirementCounts(item).fail + requirementCounts(item).warning, 0);

  return (
    <div className="page-stack">
      <PageTitle eyebrow="TTRT command center" title="Project submissions without the circulation latency" subtitle="Internal review workspace for screening, technical comments, PM resubmissions, signatures, and final TTRT decisions." actions={<button className="primary-button compact" onClick={() => setPage("submissions")}><Inbox size={16} />Open submissions</button>} />

      <section className="metric-grid">
        <MetricCard icon={Inbox} label="Open submissions" value={String(submissions.filter((item) => item.stage !== "Released").length)} tone="blue" helper="active TTRT files" />
        <MetricCard icon={AlertTriangle} label="Needs action" value={String(actionItems.length)} tone="red" helper="screening, comments, or PM response" />
        <MetricCard icon={Signature} label="Signatures pending" value={String(waitingSignatures)} tone="amber" helper="across all open packages" />
        <MetricCard icon={ShieldCheck} label="Evidence gaps" value={String(missingEvidence)} tone="purple" helper="missing, unclear, or expired inputs" />
      </section>

      <section className="flow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Flow accelerator</p>
            <h2>Every handoff has an owner, SLA, and next action</h2>
          </div>
          <Pill label="automated alerts" tone="green" />
        </div>
        <div className="flow-rail">
          {stageFlow.map((step, index) => (
            <div className={`flow-step ${step.tone}`} key={step.label}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <p>{step.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reviewer action queue</p>
              <h2>What needs follow-up now</h2>
            </div>
            <button className="text-button" onClick={() => setPage("submissions")}>View all <ArrowRight size={15} /></button>
          </div>
          <div className="action-list">
            {actionItems.map((item) => (
              <button
                className="action-row"
                type="button"
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setPage("submissions");
                }}
              >
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.nextAction}</p>
                </div>
                <div className="row-meta">
                  <Pill label={item.stage} tone={stageTone(item.stage)} />
                  <span>{item.slaRemaining}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel highlight">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI screening opinion</p>
              <h2>{selected.code}</h2>
            </div>
            <Pill label={selected.priority} tone={selected.priority === "Critical" ? "red" : selected.priority === "High" ? "amber" : "green"} />
          </div>
          <p className="large-copy">{selected.aiSummary}</p>
          <div className="decision-actions">
            <button className="primary-button" onClick={() => setPage("submissions")}><Send size={16} />Send PM clarification</button>
            <button className="secondary-button" onClick={() => setPage("reports")}><FileCheck2 size={16} />Prepare report</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SubmissionsPage({ submissions: visibleSubmissions, selected, setSelectedId }: { submissions: Submission[]; selected: Submission; setSelectedId: (id: string) => void }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Submissions" title="One workspace for each project package" subtitle="Select a project, review completeness, inspect comments, and take the next reviewer action without changing tabs." actions={<button className="secondary-button compact"><Filter size={16} />Filter</button>} />
      <div className="workspace-grid">
        <section className="panel queue-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Queue</p>
              <h2>{visibleSubmissions.length} submissions</h2>
            </div>
          </div>
          <div className="submission-list">
            {visibleSubmissions.map((item) => (
              <button key={item.id} type="button" className={`submission-card ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.code} / {item.sector} / {item.round}</p>
                </div>
                <div className="submission-card-footer">
                  <Pill label={item.stage} tone={stageTone(item.stage)} />
                  <span>{item.slaRemaining}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{selected.code}</p>
              <h2>{selected.name}</h2>
            </div>
            <Pill label={selected.decision} tone={decisionTone(selected.decision)} />
          </div>
          <div className="detail-summary-grid">
            <InfoBlock label="Project manager" value={selected.manager} helper={selected.managerEmail} />
            <InfoBlock label="Sector / division" value={selected.sector} helper={selected.division} />
            <InfoBlock label="Duration" value={selected.duration} helper={selected.estimateCost} />
            <InfoBlock label="Bottleneck" value={selected.bottleneck} helper={`Due ${selected.dueOn}`} />
          </div>
          <section className="subsection">
            <h3>Scope of work</h3>
            <p>{selected.scope}</p>
          </section>
          <section className="subsection">
            <div className="section-heading tight">
              <h3>Input checks</h3>
              <Pill label={`${requirementCounts(selected).fail + requirementCounts(selected).warning} needs attention`} tone={requirementCounts(selected).fail > 0 ? "red" : requirementCounts(selected).warning > 0 ? "amber" : "green"} />
            </div>
            <div className="check-grid">
              {selected.documents.map((doc) => <DocumentCheckCard key={doc.name} doc={doc} />)}
            </div>
          </section>
          <section className="subsection">
            <div className="section-heading tight">
              <h3>AI opinion and next decision</h3>
              <Pill label="auditable recommendation" tone="green" />
            </div>
            <div className="ai-opinion">
              <Sparkles size={18} />
              <div>
                <strong>{selected.nextAction}</strong>
                <p>{selected.aiSummary}</p>
              </div>
            </div>
            <div className="decision-actions sticky-actions">
              <button className="primary-button"><CheckCircle2 size={16} />Approve</button>
              <button className="secondary-button amber"><PenLine size={16} />Conditional approval</button>
              <button className="secondary-button"><Mail size={16} />Return to PM</button>
              <button className="secondary-button danger"><XCircle size={16} />Reject</button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function ReviewBoard({ submissions: visibleSubmissions, selected, setSelectedId }: { submissions: Submission[]; selected: Submission; setSelectedId: (id: string) => void }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Review Board" title="Technical comments are consolidated before PM response" subtitle="The coordinator sees who commented, what remains open, and whether each comment is resolved or carried into conditions." />
      <div className="workspace-grid narrow-left">
        <section className="panel queue-panel">
          <p className="eyebrow">Projects in review</p>
          <div className="submission-list compact-list">
            {visibleSubmissions.map((item) => (
              <button key={item.id} className={`mini-row ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)} type="button">
                <span>{item.code}</span>
                <strong>{item.stage}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{selected.code}</p>
              <h2>{selected.name}</h2>
            </div>
            <Pill label={`${selected.comments.length} comments`} tone="blue" />
          </div>
          <div className="comments-table">
            {selected.comments.map((comment) => (
              <div className="comment-row" key={`${comment.reviewer}-${comment.date}`}>
                <div>
                  <strong>{comment.reviewer}</strong>
                  <p>{comment.role}</p>
                </div>
                <p>{comment.comment}</p>
                <Pill label={comment.state} tone={commentTone(comment.state)} />
                <span>{comment.date}</span>
              </div>
            ))}
          </div>
          <section className="subsection report-box">
            <h3>Consolidated recommendation</h3>
            <p>{selected.recommendation}</p>
          </section>
        </section>
      </div>
    </div>
  );
}

function SignaturesPage({ submissions: visibleSubmissions, selected, setSelectedId }: { submissions: Submission[]; selected: Submission; setSelectedId: (id: string) => void }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Signatures" title="Signature chain and ED release tracker" subtitle="The app shows who must sign, who is late, and which package is ready for Executive Director approval." />
      <div className="workspace-grid narrow-left">
        <section className="panel queue-panel">
          <p className="eyebrow">Packages</p>
          <div className="submission-list compact-list">
            {visibleSubmissions.map((item) => (
              <button className={`mini-row ${selected.id === item.id ? "active" : ""}`} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
                <span>{item.code}</span>
                <strong>{signatureCounts(item).pending} pending</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{selected.code}</p>
              <h2>{selected.name}</h2>
            </div>
            <Pill label={`${signatureCounts(selected).signed}/${selected.signatures.length} signed`} tone={signatureCounts(selected).pending > 0 ? "amber" : "green"} />
          </div>
          <div className="signature-grid">
            {selected.signatures.map((signature) => <SignatureCard key={`${signature.name}-${signature.role}`} signature={signature} />)}
          </div>
          <section className="subsection">
            <h3>Submission timeline</h3>
            <div className="timeline">
              {selected.timeline.map((step) => <TimelineItem key={step.label} step={step} />)}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function RulesPage({ rules, setRules }: { rules: Rule[]; setRules: (rules: Rule[]) => void }) {
  function updateRule(id: string, patch: Partial<Rule>) {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="Rules" title="Business requirements that drive checks and alerts" subtitle="Rules stay readable for coordinators: each one says what must be true, what the app should automate, and who owns it." actions={<button className="primary-button compact"><FileCheck2 size={16} />Save rules</button>} />
      <section className="panel">
        <div className="rules-grid">
          {rules.map((rule) => (
            <article className="rule-card" key={rule.id}>
              <div className="section-heading tight">
                <div>
                  <p className="eyebrow">{rule.category}</p>
                  <h3>{rule.service}</h3>
                </div>
                <button className={`toggle ${rule.active ? "on" : ""}`} type="button" onClick={() => updateRule(rule.id, { active: !rule.active })}>{rule.active ? "Active" : "Paused"}</button>
              </div>
              <label>
                Requirement
                <textarea value={rule.rule} onChange={(event) => updateRule(rule.id, { rule: event.target.value })} />
              </label>
              <label>
                Automation
                <textarea value={rule.automation} onChange={(event) => updateRule(rule.id, { automation: event.target.value })} />
              </label>
              <label>
                Owner
                <input value={rule.owner} onChange={(event) => updateRule(rule.id, { owner: event.target.value })} />
              </label>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportsPage({ selected, setPage }: { selected: Submission; setPage: (page: Page) => void }) {
  const reports = [
    { title: "TTRT recommendation report", desc: "Final approve / conditional approval / reject pack with comments, evidence gaps, and signature status.", icon: FileCheck2 },
    { title: "PM clarification email", desc: "Professional PM-facing message listing only missing items, required action, due date, and upload channel.", icon: Mail },
    { title: "Signature follow-up memo", desc: "Internal reminder for pending reviewers and ED approval dependencies.", icon: Signature },
    { title: "Weekly TTRT latency report", desc: "Review volume, average handoff time, bottlenecks, and SLA risks.", icon: Clock3 },
  ];

  return (
    <div className="page-stack">
      <PageTitle eyebrow="Reports" title="Generate the right document from the selected project" subtitle="Outputs stay controlled: internal report, PM clarification, signature reminder, and weekly latency view." />
      <div className="reports-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.title}>
            <report.icon size={20} />
            <h3>{report.title}</h3>
            <p>{report.desc}</p>
            <button className="secondary-button compact">Generate</button>
          </article>
        ))}
      </div>
      <section className="panel report-box">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected submission</p>
            <h2>{selected.name}</h2>
          </div>
          <button className="text-button" onClick={() => setPage("submissions")}>Open project <ArrowRight size={15} /></button>
        </div>
        <p>{selected.recommendation}</p>
      </section>
    </div>
  );
}

function AgentsPage() {
  const agents = [
    { name: "Screening Agent", desc: "Checks mandatory fields, document list, and obvious missing attachments before circulation." },
    { name: "Comment Consolidation Agent", desc: "Groups reviewer comments by requirement, owner, and whether they need PM action." },
    { name: "Signature Follow-up Agent", desc: "Detects signature bottlenecks and drafts internal reminders before SLA breach." },
    { name: "Report Drafting Agent", desc: "Produces approval, conditional approval, and rejection report drafts from the audit trail." },
  ];
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Platform" title="Agents & alerts" subtitle="Operational AI layer for TTRT. Business users can keep this collapsed unless they supervise automations." />
      <section className="panel card-grid">
        {agents.map((agent) => (
          <article className="soft-card" key={agent.name}>
            <Bot size={18} />
            <h3>{agent.name}</h3>
            <p>{agent.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function WorkflowsPage() {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Platform" title="Workflow setup" subtitle="The encoded version of the TTRT process: return to PM, technical loop, conditional approval, ED approval, and archive." />
      <section className="flow-card">
        <div className="flow-rail large">
          {stageFlow.map((step, index) => (
            <div className={`flow-step ${step.tone}`} key={step.label}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <p>{step.helper}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Settings" title="Profile and notifications" subtitle="Notification defaults for TTRT coordinators, reviewers, PMs, and supervisors." />
      <section className="panel settings-grid">
        <InfoBlock label="User" value="Abdulqader Ahmed" helper="TTRT reviewer" />
        <InfoBlock label="Notification mode" value="Email + in-app" helper="PM returns, signature reminders, SLA alerts" />
        <InfoBlock label="Default landing" value="Dashboard" helper="Business review workspace" />
      </section>
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone }: { icon: LucideIcon; label: string; value: string; helper: string; tone: StageTone }) {
  return (
    <article className="metric-card">
      <Icon className={tone} size={21} />
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{helper}</p>
    </article>
  );
}

function InfoBlock({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <p>{helper}</p>}
    </div>
  );
}

function DocumentCheckCard({ doc }: { doc: DocumentCheck }) {
  return (
    <article className={`check-card ${doc.state}`}>
      {doc.state === "pass" ? <CheckCircle2 size={17} /> : doc.state === "fail" ? <XCircle size={17} /> : <AlertTriangle size={17} />}
      <div>
        <strong>{doc.name}</strong>
        <p>{doc.note}</p>
      </div>
    </article>
  );
}

function SignatureCard({ signature }: { signature: SignatureRecord }) {
  return (
    <article className={`signature-card ${signature.status}`}>
      <div>
        <strong>{signature.name}</strong>
        <p>{signature.role}</p>
      </div>
      <Pill label={signature.status} tone={signature.status === "signed" ? "green" : signature.status === "blocked" ? "red" : "amber"} />
      <span>{signature.date ?? "awaiting"}</span>
    </article>
  );
}

function TimelineItem({ step }: { step: TimelineStep }) {
  return (
    <div className={`timeline-item ${step.status}`}>
      <span />
      <div>
        <strong>{step.label}</strong>
        <p>{step.owner} / {step.sla}</p>
      </div>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: StageTone }) {
  return <span className={`pill ${tone}`}>{label}</span>;
}

function decisionTone(decision: Submission["decision"]): StageTone {
  if (decision === "Approve") return "green";
  if (decision === "Reject") return "red";
  if (decision === "Conditional approval") return "amber";
  return "blue";
}

function commentTone(state: CommentState): StageTone {
  if (state === "resolved") return "green";
  if (state === "approved-with-comments") return "amber";
  return "red";
}
