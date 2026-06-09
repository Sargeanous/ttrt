import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Signature,
  Sparkles,
  Upload,
  UserPlus,
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

type Page =
  | "dashboard"
  | "submissions"
  | "documents"
  | "reviews"
  | "signatures"
  | "rules"
  | "reports"
  | "users"
  | "notifications"
  | "settings";

type ProjectType = "New Tender" | "Tender Renewal" | "Variation" | "Direct Awarding" | "Other";

type ProjectFile = {
  id: string;
  submissionId: string;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  category: string;
  dataUrl: string;
  aiAnalysis: string;
};

type TtrtUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  status: "Active" | "Pending";
};

type TtrtNotification = {
  id: string;
  submissionId: string;
  title: string;
  body: string;
  createdAt: string;
  recipients: string[];
  read: boolean;
};

type SubmissionPayload = {
  name: string;
  projectType: ProjectType;
  manager: string;
  managerEmail: string;
  sector: string;
  division: string;
  budget: string;
  startDate: string;
  endDate: string;
  scope: string;
};

type ProjectUpdatePayload = Pick<
  Submission,
  | "name"
  | "sector"
  | "division"
  | "manager"
  | "managerEmail"
  | "submittedOn"
  | "dueOn"
  | "duration"
  | "estimateCost"
  | "scope"
  | "priority"
  | "stage"
  | "round"
  | "decision"
  | "bottleneck"
  | "nextAction"
>;

interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Project review",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "submissions", label: "Submissions", icon: Inbox },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "reviews", label: "Review Board", icon: UsersRound },
      { id: "signatures", label: "Signatures", icon: Signature },
      { id: "rules", label: "Rules", icon: Library },
      { id: "reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users", label: "User Management", icon: UsersRound },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
];

const pageLabels: Record<Page, { group: string; page: string }> = {
  dashboard: { group: "Project review", page: "Overview" },
  submissions: { group: "Project review", page: "Submissions" },
  documents: { group: "Project review", page: "Documents" },
  reviews: { group: "Project review", page: "Review Board" },
  signatures: { group: "Project review", page: "Signatures" },
  rules: { group: "Project review", page: "Rules" },
  reports: { group: "Project review", page: "Reports" },
  users: { group: "Admin", page: "User Management" },
  notifications: { group: "Admin", page: "Notifications" },
  settings: { group: "Admin", page: "Settings" },
};

const initialUsers: TtrtUser[] = [
  { id: "u-mehdi", name: "Mehdi Sargeane", email: "mehdi.sargeane@origen.ae", role: "Platform admin", scope: "Configuration", status: "Active" },
  { id: "u-abdulqader", name: "Abdulqader Ahmed", email: "abdulqader.ahmed@itc.gov.ae", role: "TTRT lead", scope: "All submissions", status: "Active" },
  { id: "u-zain", name: "Zain Abdulnaser Al Zubaidi", email: "zain.alzubaidi@itc.gov.ae", role: "Project manager", scope: "Aviation submissions", status: "Active" },
  { id: "u-hussein", name: "Hussein Elhadi", email: "hussein.elhadi@itc.gov.ae", role: "Technical reviewer", scope: "TTRT comments", status: "Active" },
  { id: "u-mohammad-almasoud", name: "Mohammad Almasoud", email: "mohammad.almasoud@itc.gov.ae", role: "Technical reviewer", scope: "TTRT comments", status: "Active" },
  { id: "u-rashid", name: "Rashid Al Naqbi", email: "rashid.alnaqbi@itc.gov.ae", role: "TTRT member", scope: "Final review", status: "Active" },
  { id: "u-mohammed-shalwani", name: "Mohammed Shalwani", email: "mohammed.shalwani@itc.gov.ae", role: "TTRT member", scope: "Final review", status: "Active" },
  { id: "u-mohamed-adnan", name: "Mohamed Adnan", email: "mohamed.adnan@itc.gov.ae", role: "Coordinator", scope: "Screening and circulation", status: "Active" },
  { id: "u-hadi", name: "Hadi Jammal", email: "hadi.jammal@itc.gov.ae", role: "Technical reviewer", scope: "Operations and ITS", status: "Active" },
  { id: "u-ghassan", name: "Ghassan Abazid", email: "ghassan.abazid@itc.gov.ae", role: "Technical reviewer", scope: "Enterprise architecture", status: "Active" },
  { id: "u-hasanul", name: "Hasanul Banna", email: "hasanul.banna@itc.gov.ae", role: "Technical reviewer", scope: "Signal systems", status: "Active" },
  { id: "u-surendra", name: "Surendra Sharma", email: "surendra.sharma@itc.gov.ae", role: "Technical reviewer", scope: "Network services", status: "Active" },
  { id: "u-nuha", name: "Nuha AlBusaeed", email: "nuha.albussaeed@itc.gov.ae", role: "Technical reviewer", scope: "Road safety", status: "Active" },
  { id: "u-hamad", name: "HE. Hamad Alafeefi", email: "hamad.alafeefi@itc.gov.ae", role: "Executive approver", scope: "Executive Director approval", status: "Active" },
];

const isEmbedded = new URLSearchParams(window.location.search).get("embed") === "1";

const storageKeys = {
  submissions: "ttrt.submissions.v2",
  files: "ttrt.files.v2",
  users: "ttrt.users.v2",
  notifications: "ttrt.notifications.v2",
  rules: "ttrt.rules.v2",
};

const projectTypes: ProjectType[] = ["New Tender", "Tender Renewal", "Variation", "Direct Awarding", "Other"];
const priorityOptions: Submission["priority"][] = ["Normal", "High", "Critical"];
const reviewRounds: Submission["round"][] = ["Initial Review", "2nd Review", "Final Review"];
const decisionPaths: Submission["decision"][] = ["Pending", "Approve", "Conditional approval", "Reject"];
const submissionStages: Submission["stage"][] = [
  "Initial screening",
  "Returned to PM",
  "Technical review",
  "PM response",
  "Final recommendation",
  "Executive approval",
  "Released",
  "Rejected",
];

const requiredDocsByType: Record<ProjectType, string[]> = {
  "New Tender": ["TTRT submission form", "Scope of services", "Budget estimate", "Risk register", "Technical evaluation"],
  "Tender Renewal": ["TTRT submission form", "Previous contract reference", "Renewal justification", "Budget estimate"],
  Variation: ["TTRT submission form", "Approved baseline", "Variation justification", "Cost and schedule impact"],
  "Direct Awarding": ["TTRT submission form", "Direct award justification", "Market comparison", "Budget approval"],
  Other: ["TTRT submission form", "Scope note", "Supporting evidence"],
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Large files may exceed localStorage. The UI still keeps the current session state.
  }
}

export default function App() {
  const [signedIn, setSignedIn] = useState(isEmbedded);
  const [page, setPage] = useState<Page>("dashboard");
  const [submissionRecords, setSubmissionRecords] = useState<Submission[]>(() =>
    loadStored(storageKeys.submissions, submissions.slice(0, 1)),
  );
  const [selectedId, setSelectedId] = useState(() => submissionRecords[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [foldedGroups, setFoldedGroups] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<Rule[]>(() => loadStored(storageKeys.rules, initialRules));
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => loadStored(storageKeys.files, []));
  const [users, setUsers] = useState<TtrtUser[]>(() => loadStored(storageKeys.users, initialUsers));
  const [notifications, setNotifications] = useState<TtrtNotification[]>(() =>
    loadStored(storageKeys.notifications, []),
  );
  const [submitOpen, setSubmitOpen] = useState(false);

  useEffect(() => saveStored(storageKeys.submissions, submissionRecords), [submissionRecords]);
  useEffect(() => saveStored(storageKeys.files, projectFiles), [projectFiles]);
  useEffect(() => saveStored(storageKeys.users, users), [users]);
  useEffect(() => saveStored(storageKeys.notifications, notifications), [notifications]);
  useEffect(() => saveStored(storageKeys.rules, rules), [rules]);

  const selected = submissionRecords.find((item) => item.id === selectedId) ?? submissionRecords[0];
  const searchQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!searchQuery) return submissionRecords;
    return submissionRecords.filter((submission) =>
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
  }, [searchQuery, submissionRecords]);

  async function uploadProjectFiles(submissionId: string, files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(async (file) => ({
      id: `${submissionId}-${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      submissionId,
      name: file.name,
      size: formatFileSize(file.size),
      uploadedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      uploadedBy: "Current user",
      category: inferDocumentCategory(file.name),
      dataUrl: await readFileAsDataUrl(file),
      aiAnalysis: analyzeUploadedFile(file.name),
    })));
    setProjectFiles((current) => [...uploaded, ...current]);
  }

  function removeProjectFile(id: string) {
    setProjectFiles((current) => current.filter((file) => file.id !== id));
  }

  function addUser() {
    const next = users.length + 1;
    setUsers((current) => [
      {
        id: `u-new-${Date.now()}`,
        name: `New TTRT user ${next}`,
        email: `new.user.${next}@itc.local`,
        role: "Technical reviewer",
        scope: "Assigned submissions",
        status: "Pending",
      },
      ...current,
    ]);
  }

  function patchUser(id: string, patch: Partial<TtrtUser>) {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...patch } : user)));
  }

  async function createSubmission(payload: SubmissionPayload, files: FileList | null) {
    const nextNumber = submissionRecords.length + 142;
    const id = `sub-${Date.now()}`;
    const requiredDocuments = requiredDocsByType[payload.projectType];
    const created: Submission = {
      id,
      code: `TTRT-2026-${String(nextNumber).padStart(4, "0")}`,
      name: payload.name,
      sector: payload.sector || "Unassigned",
      division: payload.division || payload.projectType,
      manager: payload.manager,
      managerEmail: payload.managerEmail,
      submittedOn: formatDateForSubmission(payload.startDate || new Date().toISOString()),
      dueOn: formatDateForSubmission(payload.endDate || new Date(Date.now() + 7 * 86400000).toISOString()),
      round: "Initial Review",
      stage: "Initial screening",
      priority: "Normal",
      decision: "Pending",
      duration: deriveDuration(payload.startDate, payload.endDate),
      estimateCost: payload.budget ? `AED ${payload.budget}` : "Pending",
      scope: payload.scope,
      submittedDocuments: requiredDocuments,
      documents: requiredDocuments.map((name) => ({
        name,
        state: "warning",
        note: "Awaiting AI extraction against the uploaded package.",
      })),
      comments: [],
      signatures: users
        .filter((user) => ["TTRT lead", "TTRT member", "Coordinator", "Technical reviewer", "Executive approver"].includes(user.role))
        .slice(0, 6)
        .map((user) => ({ name: user.name, role: user.role, status: "pending" as SignatureStatus })),
      timeline: stageFlow.map((step, index) => ({
        label: step.label,
        owner: index === 0 ? payload.manager : index === 1 ? "TTRT Coordinator" : "TTRT",
        status: index === 0 ? "done" : index === 1 ? "current" : "next",
        sla: index === 0 ? "submitted" : index === 1 ? "same day" : "pending",
      })),
      recommendation: "Pending initial screening.",
      aiSummary:
        "The submission has been received. AI will compare the uploaded package with the required document list and flag missing fields before circulation.",
      nextAction: "Run initial screening and notify reviewers if complete.",
      slaRemaining: "7d",
      bottleneck: "Initial screening not completed",
    };

    setSubmissionRecords((current) => [created, ...current]);
    setSelectedId(id);
    setPage("submissions");
    setSubmitOpen(false);
    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        submissionId: id,
        title: `New TTRT submission: ${created.code}`,
        body: `${payload.manager} submitted ${payload.name}. Initial screening is ready.`,
        createdAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        recipients: users.filter((user) => user.status === "Active").map((user) => user.name),
        read: false,
      },
      ...current,
    ]);
    await uploadProjectFiles(id, files);
  }

  function openNotification(notification: TtrtNotification) {
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    setSelectedId(notification.submissionId);
    setPage("submissions");
  }

  function pushNotification(submissionId: string, title: string, body: string, recipients?: string[]) {
    setNotifications((current) => [
      {
        id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        submissionId,
        title,
        body,
        createdAt: nowStamp(),
        recipients: recipients ?? users.filter((user) => user.status === "Active").map((user) => user.name),
        read: false,
      },
      ...current,
    ]);
  }

  function patchSubmission(id: string, updater: (submission: Submission) => Submission) {
    setSubmissionRecords((current) => current.map((submission) => (submission.id === id ? updater(submission) : submission)));
  }

  function addSubmissionComment(id: string, comment: string, state: CommentState = "resolved") {
    patchSubmission(id, (submission) => ({
      ...submission,
      comments: [
        {
          reviewer: "Current user",
          role: "TTRT Coordinator",
          date: todayStamp(),
          state,
          comment,
        },
        ...submission.comments,
      ],
    }));
  }

  function applySubmissionAction(id: string, action: "approve" | "conditional" | "return" | "reject") {
    const current = submissionRecords.find((submission) => submission.id === id);
    if (!current) return;

    const actionConfig = {
      approve: {
        stage: "Executive approval" as const,
        decision: "Approve" as const,
        recommendation: "Approved by TTRT. Prepare the final approved report and route to Executive Director approval.",
        nextAction: "Collect Executive Director approval, then release the project from TTRT.",
        bottleneck: "Executive Director approval pending",
        comment: "TTRT decision recorded: approved and routed to Executive Director approval.",
        notificationTitle: `${current.code} approved by TTRT`,
        notificationBody: `${current.name} is ready for Executive Director approval.`,
      },
      conditional: {
        stage: "Executive approval" as const,
        decision: "Conditional approval" as const,
        recommendation:
          "Conditionally approved. PM must provide closure evidence for all listed conditions before final release.",
        nextAction: "Send conditional approval conditions to the project manager and track closure evidence.",
        bottleneck: "Conditions require PM evidence",
        comment: "TTRT decision recorded: conditional approval with evidence required from the project manager.",
        notificationTitle: `${current.code} conditionally approved`,
        notificationBody: `${current.name} requires PM evidence before final release.`,
      },
      return: {
        stage: "Returned to PM" as const,
        decision: "Pending" as const,
        recommendation:
          "Returned to the project manager for clarification and missing evidence before TTRT circulation can continue.",
        nextAction: "Await PM resubmission with the requested clarifications and documents.",
        bottleneck: "Waiting for project manager response",
        comment: "Clarification sent to PM. Submission is returned until the requested evidence is uploaded.",
        notificationTitle: `${current.code} returned to PM`,
        notificationBody: `Clarification request sent to ${current.manager} for ${current.name}.`,
      },
      reject: {
        stage: "Rejected" as const,
        decision: "Reject" as const,
        recommendation:
          "Rejected by TTRT. The rejection report should include justification, reviewer comments, and evidence gaps.",
        nextAction: "Generate the rejected TTRT report and notify the project manager with justification.",
        bottleneck: "Closed as rejected",
        comment: "TTRT decision recorded: rejected with justification required in the final report.",
        notificationTitle: `${current.code} rejected`,
        notificationBody: `${current.name} was rejected. Prepare the rejection report and PM notification.`,
      },
    }[action];

    patchSubmission(id, (submission) => ({
      ...submission,
      stage: actionConfig.stage,
      decision: actionConfig.decision,
      recommendation: actionConfig.recommendation,
      nextAction: actionConfig.nextAction,
      bottleneck: actionConfig.bottleneck,
      slaRemaining: action === "reject" ? "closed" : action === "return" ? "awaiting PM" : submission.slaRemaining,
      timeline: updateTimelineForStage(submission.timeline, actionConfig.stage),
      signatures:
        action === "reject"
          ? submission.signatures.map((signature) => (signature.status === "pending" ? { ...signature, status: "blocked" as SignatureStatus } : signature))
          : submission.signatures,
      comments: [
        {
          reviewer: "Current user",
          role: "TTRT decision",
          date: todayStamp(),
          state: action === "return" ? "open" : "resolved",
          comment: actionConfig.comment,
        },
        ...submission.comments,
      ],
    }));
    pushNotification(id, actionConfig.notificationTitle, actionConfig.notificationBody);
  }

  function updateCommentState(submissionId: string, index: number, state: CommentState) {
    patchSubmission(submissionId, (submission) => ({
      ...submission,
      comments: submission.comments.map((comment, commentIndex) =>
        commentIndex === index ? { ...comment, state, date: todayStamp() } : comment,
      ),
      nextAction:
        state === "resolved"
          ? "Continue consolidation and prepare the final recommendation once all comments are resolved."
          : submission.nextAction,
    }));
  }

  function addReviewerComment(submissionId: string) {
    addSubmissionComment(
      submissionId,
      "Reviewer comment added from the Review Board. Coordinator must consolidate it before final recommendation.",
      "open",
    );
    pushNotification(submissionId, "Reviewer comment added", "A new TTRT review comment was added and requires consolidation.");
  }

  function addProjectComment(submissionId: string, comment: string) {
    const clean = comment.trim();
    if (!clean) return;
    addSubmissionComment(submissionId, clean, "open");
    pushNotification(submissionId, "Project comment added", "A new project comment was added from the project workspace.");
  }

  function updateSubmissionDetails(submissionId: string, payload: ProjectUpdatePayload) {
    const current = submissionRecords.find((submission) => submission.id === submissionId);
    if (!current) return;

    patchSubmission(submissionId, (submission) => ({
      ...submission,
      ...payload,
      timeline: payload.stage !== submission.stage ? updateTimelineForStage(submission.timeline, payload.stage) : submission.timeline,
      comments: [
        {
          reviewer: "Current user",
          role: "TTRT Coordinator",
          date: todayStamp(),
          state: "resolved",
          comment: "Project details updated from the project workspace.",
        },
        ...submission.comments,
      ],
    }));
    pushNotification(submissionId, `${current.code} updated`, `${payload.name} project details were updated.`);
  }

  function signSubmission(submissionId: string, signatureKey: string) {
    const current = submissionRecords.find((submission) => submission.id === submissionId);
    if (!current) return;

    let allSigned = false;
    patchSubmission(submissionId, (submission) => {
      const signatures = submission.signatures.map((signature) => {
        const key = `${signature.name}-${signature.role}`;
        return key === signatureKey ? { ...signature, status: "signed" as SignatureStatus, date: todayStamp() } : signature;
      });
      allSigned = signatures.every((signature) => signature.status === "signed");
      const shouldRelease = allSigned && submission.stage === "Executive approval" && submission.decision !== "Pending";
      return {
        ...submission,
        signatures,
        stage: shouldRelease ? "Released" : submission.stage,
        slaRemaining: shouldRelease ? "closed" : submission.slaRemaining,
        bottleneck: shouldRelease ? "None" : submission.bottleneck,
        nextAction: shouldRelease ? "Archive the final TTRT package." : "Continue collecting pending signatures.",
        timeline: shouldRelease ? updateTimelineForStage(submission.timeline, "Released") : submission.timeline,
      };
    });
    pushNotification(
      submissionId,
      allSigned ? `${current.code} fully signed` : `${current.code} signature recorded`,
      allSigned ? `${current.name} is released and ready for archive.` : `A signature was recorded for ${current.name}.`,
    );
  }

  function remindSignature(submissionId: string, signature: SignatureRecord) {
    pushNotification(
      submissionId,
      `Signature reminder: ${signature.name}`,
      `${signature.name} has been reminded to sign the selected TTRT package.`,
      [signature.name],
    );
  }

  function saveRules() {
    saveStored(storageKeys.rules, rules);
    const target = selected?.id ?? submissionRecords[0]?.id ?? "rules";
    pushNotification(target, "Rules saved", "TTRT business rules were saved and will be used for the next review checks.");
  }

  function generateReport(kind: string, submission: Submission = selected) {
    const text = buildReportText(kind, submission, projectFiles.filter((file) => file.submissionId === submission.id));
    downloadTextFile(`${submission.code}-${slugify(kind)}.txt`, text);
    pushNotification(submission.id, `${kind} generated`, `${kind} was generated for ${submission.code}.`);
  }

  if (!signedIn) return <Login onSubmit={() => setSignedIn(true)} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <button className="brand-home" type="button" onClick={() => setPage("dashboard")} aria-label="Open overview">
            <img src={admLogo} alt="Abu Dhabi Mobility" className="brand-logo" />
          </button>
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
            Built by Origen for ITC
            <img src={origenLogo} alt="Origen" />
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
            </div>
            <span className="clock">18:42 / Asia Dubai</span>
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setPage("notifications")}>
              <Bell size={17} />
              {notifications.some((item) => !item.read) && <span className="dot" />}
            </button>
            <button className="icon-button" type="button" aria-label="Settings" onClick={() => setPage("settings")}><Settings size={17} /></button>
            <button className="icon-button" type="button" aria-label="Sign out" onClick={() => setSignedIn(false)}><LogOut size={17} /></button>
          </div>
        </header>

        <main className="content">
          {page === "dashboard" && (
            <Dashboard
              selected={selected}
              submissions={submissionRecords}
              setPage={setPage}
              setSelectedId={setSelectedId}
              onOpenSubmit={() => setSubmitOpen(true)}
              onClarification={(submissionId) => applySubmissionAction(submissionId, "return")}
              onGenerateReport={(kind) => generateReport(kind)}
            />
          )}
          {page === "submissions" && (
            <SubmissionsPage
              submissions={filtered}
              selected={selected}
              setSelectedId={setSelectedId}
              projectFiles={projectFiles}
              onUpload={uploadProjectFiles}
              onRemoveFile={removeProjectFile}
              onOpenSubmit={() => setSubmitOpen(true)}
              onDecision={applySubmissionAction}
              onAddComment={addProjectComment}
              onCommentState={updateCommentState}
              onUpdateSubmission={updateSubmissionDetails}
            />
          )}
          {page === "documents" && <DocumentsPage submissions={filtered} selected={selected} setSelectedId={setSelectedId} projectFiles={projectFiles} onUpload={uploadProjectFiles} onRemoveFile={removeProjectFile} />}
          {page === "reviews" && <ReviewBoard selected={selected} submissions={filtered} setSelectedId={setSelectedId} onCommentState={updateCommentState} onAddComment={addReviewerComment} />}
          {page === "signatures" && <SignaturesPage selected={selected} submissions={filtered} setSelectedId={setSelectedId} onSign={signSubmission} onRemind={remindSignature} />}
          {page === "rules" && <RulesPage rules={rules} setRules={setRules} onSave={saveRules} />}
          {page === "reports" && <ReportsPage selected={selected} setPage={setPage} onGenerate={generateReport} />}
          {page === "users" && <UsersPage users={users} addUser={addUser} patchUser={patchUser} />}
          {page === "notifications" && <NotificationsPage notifications={notifications} onOpen={openNotification} />}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
      {submitOpen && <SubmitProjectModal onClose={() => setSubmitOpen(false)} onSubmit={createSubmission} />}
    </div>
  );
}

function SubmitProjectModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: SubmissionPayload, files: FileList | null) => void;
}) {
  const [projectType, setProjectType] = useState<ProjectType>("New Tender");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onSubmit(
      {
        name: String(data.get("name") ?? ""),
        projectType,
        manager: String(data.get("manager") ?? ""),
        managerEmail: String(data.get("managerEmail") ?? ""),
        sector: String(data.get("sector") ?? ""),
        division: String(data.get("division") ?? ""),
        budget: String(data.get("budget") ?? ""),
        startDate: String(data.get("startDate") ?? ""),
        endDate: String(data.get("endDate") ?? ""),
        scope: String(data.get("scope") ?? ""),
      },
      (form.elements.namedItem("documents") as HTMLInputElement | null)?.files ?? null,
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="submit-modal" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Submit project</p>
            <h2>New TTRT project submission</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label>
            Project name
            <input name="name" required placeholder="Development of..." />
          </label>
          <label>
            Project type
            <select value={projectType} onChange={(event) => setProjectType(event.target.value as ProjectType)}>
              {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            Project manager
            <input name="manager" required placeholder="Name" />
          </label>
          <label>
            Manager email
            <input name="managerEmail" required type="email" placeholder="name@itc.gov.ae" />
          </label>
          <label>
            Sector
            <input name="sector" placeholder="Aviation, ITS, Road Safety..." />
          </label>
          <label>
            Division / section
            <input name="division" placeholder="Strategy and Governance" />
          </label>
          <label>
            Budget
            <input name="budget" placeholder="50M" />
          </label>
          <label>
            Start date
            <input name="startDate" type="date" />
          </label>
          <label>
            End date
            <input name="endDate" type="date" />
          </label>
          <label className="wide">
            Scope of work
            <textarea name="scope" required placeholder="Briefly describe the project objective, scope, and expected outputs." />
          </label>
        </div>

        <div className="required-docs-panel">
          <p className="eyebrow">Required for {projectType}</p>
          <div className="required-doc-chips">
            {requiredDocsByType[projectType].map((doc) => <span key={doc}>{doc}</span>)}
          </div>
        </div>

        <label className="upload-dropzone">
          <Upload size={20} />
          <strong>Upload TTRT sheet and supporting package</strong>
          <span>DOCX, PDF, Excel, DWG, or ZIP. Files are attached to the submitted project record.</span>
          <input name="documents" type="file" multiple accept=".doc,.docx,.pdf,.xlsx,.xls,.dwg,.zip" />
        </label>

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit"><Send size={16} />Submit project</button>
        </div>
      </form>
    </div>
  );
}

function NotificationsPage({
  notifications,
  onOpen,
}: {
  notifications: TtrtNotification[];
  onOpen: (notification: TtrtNotification) => void;
}) {
  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Notifications"
        title="Project alerts and reviewer assignments"
        subtitle="When a project is submitted, stakeholders receive a link back to the project package and its form details."
      />
      <section className="panel notification-list">
        {notifications.length === 0 ? (
          <div className="empty-upload-state">
            <Bell size={18} />
            <strong>No notifications yet</strong>
            <p>Submit a project to generate the first stakeholder alert.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              className={`notification-row ${notification.read ? "" : "unread"}`}
              type="button"
              key={notification.id}
              onClick={() => onOpen(notification)}
            >
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>Recipients: {notification.recipients.slice(0, 5).join(", ")}{notification.recipients.length > 5 ? ` +${notification.recipients.length - 5}` : ""}</small>
              </div>
              <span>{notification.createdAt}</span>
            </button>
          ))
        )}
      </section>
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
          Built by Origen for ITC
          <img src={origenLogo} alt="Origen" />
        </div>
      </form>
    </div>
  );
}

function Dashboard({
  selected,
  submissions: visibleSubmissions,
  setPage,
  setSelectedId,
  onOpenSubmit,
  onClarification,
  onGenerateReport,
}: {
  selected: Submission;
  submissions: Submission[];
  setPage: (page: Page) => void;
  setSelectedId: (id: string) => void;
  onOpenSubmit: () => void;
  onClarification: (submissionId: string) => void;
  onGenerateReport: (kind: string) => void;
}) {
  const actionItems = visibleSubmissions.filter((item) => item.stage !== "Released" && item.stage !== "Rejected").slice(0, 4);
  const waitingSignatures = visibleSubmissions.reduce((total, item) => total + signatureCounts(item).pending, 0);
  const missingEvidence = visibleSubmissions.reduce((total, item) => total + requirementCounts(item).fail + requirementCounts(item).warning, 0);
  const activeSubmissions = visibleSubmissions.filter((item) => item.stage !== "Released" && item.stage !== "Rejected");
  const releasedSubmissions = visibleSubmissions.filter((item) => item.stage === "Released");
  const overdueSubmissions = activeSubmissions.filter((item) => {
    const due = parseDisplayDate(item.dueOn);
    return due ? due.getTime() < Date.now() : false;
  });
  const completion = visibleSubmissions.length
    ? Math.round((releasedSubmissions.length / visibleSubmissions.length) * 100)
    : 0;
  const submittedThisMonth = visibleSubmissions.filter((item) => item.submittedOn.includes("May") || item.submittedOn.includes("Jun")).length;
  const averageTargetDays = Math.round(
    visibleSubmissions.reduce((total, item) => {
      const submitted = parseDisplayDate(item.submittedOn);
      const due = parseDisplayDate(item.dueOn);
      return total + (submitted && due ? Math.max(1, Math.round((due.getTime() - submitted.getTime()) / 86400000)) : 0);
    }, 0) / Math.max(1, visibleSubmissions.length),
  );
  const decisionSplit = [
    { label: "Approved", count: visibleSubmissions.filter((item) => item.decision === "Approve").length, color: "#64b77d" },
    { label: "Approved with comments", count: visibleSubmissions.filter((item) => item.decision === "Conditional approval").length, color: "#2f6ea8" },
    { label: "Pending / waiting", count: visibleSubmissions.filter((item) => item.decision === "Pending").length, color: "#e8b64f" },
    { label: "Rejected", count: visibleSubmissions.filter((item) => item.decision === "Reject").length, color: "#c8574f" },
  ];
  const stageLoad = [
    { label: "Screening", count: visibleSubmissions.filter((item) => item.stage === "Initial screening" || item.stage === "Returned to PM").length, tone: "blue" as const },
    { label: "Technical", count: visibleSubmissions.filter((item) => item.stage === "Technical review" || item.stage === "PM response").length, tone: "amber" as const },
    { label: "Decision", count: visibleSubmissions.filter((item) => item.stage === "Final recommendation" || item.stage === "Executive approval").length, tone: "purple" as const },
    { label: "Closed", count: visibleSubmissions.filter((item) => item.stage === "Released" || item.stage === "Rejected").length, tone: "green" as const },
  ];

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="TTRT overview"
        title="Project review without circulation delays"
        subtitle="Track the submitted project, see exactly where it sits in the process, and move the package from screening to final closure without email drift."
        actions={
          <>
            <button className="primary-button compact" type="button" onClick={onOpenSubmit}><Plus size={16} />Submit project</button>
            <button className="secondary-button compact" type="button" onClick={() => setPage("submissions")}><Inbox size={16} />Open submissions</button>
          </>
        }
      />

      <section className="ttrt-progress-dashboard">
        <div className="ttrt-progress-main">
          <div className="section-heading tight">
            <div>
              <p className="eyebrow">Latest TTRT submissions</p>
              <h2>Progress and review health</h2>
            </div>
            <Pill label={`${completion}% complete`} tone={completion >= 70 ? "green" : completion >= 40 ? "amber" : "blue"} />
          </div>
          <div className="ttrt-kpi-tiles">
            <ProgressKpi label="Total submissions" value={String(visibleSubmissions.length)} helper="All project packages" tone="blue" progress={100} />
            <ProgressKpi label="Released" value={String(releasedSubmissions.length)} helper="Closed and archived" tone="green" progress={completion} />
            <ProgressKpi label="Active queue" value={String(activeSubmissions.length)} helper="Being reviewed now" tone="amber" progress={Math.min(100, activeSubmissions.length * 24)} />
            <ProgressKpi label="Due / evidence risk" value={String(overdueSubmissions.length + missingEvidence)} helper={`${overdueSubmissions.length} overdue, ${missingEvidence} evidence gaps`} tone={overdueSubmissions.length + missingEvidence > 0 ? "red" : "green"} progress={Math.max(8, Math.min(100, (overdueSubmissions.length + missingEvidence) * 16))} />
          </div>
          <div className="ttrt-chart-row">
            <StageLoadChart stages={stageLoad} total={Math.max(1, visibleSubmissions.length)} />
            <MiniTrendChart submittedThisMonth={submittedThisMonth} averageTargetDays={averageTargetDays} />
          </div>
        </div>

        <DecisionSplitCard split={decisionSplit} total={Math.max(1, visibleSubmissions.length)} />
      </section>

      <section className="flow-card process-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Flow accelerator</p>
            <h2>Simplified process map</h2>
          </div>
          <Pill label={`${waitingSignatures} signatures pending`} tone={waitingSignatures > 0 ? "amber" : "green"} />
        </div>
        <TtrtProcessMap />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reviewer action queue</p>
              <h2>What needs follow-up now</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setPage("submissions")}>View all <ArrowRight size={15} /></button>
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
                  <strong>{item.code}</strong>
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
            <button className="primary-button" onClick={() => onClarification(selected.id)}><Send size={16} />Send PM clarification</button>
            <button className="secondary-button" onClick={() => onGenerateReport("TTRT recommendation report")}><FileCheck2 size={16} />Prepare report</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SubmissionsPage({
  submissions: visibleSubmissions,
  selected,
  setSelectedId,
  projectFiles,
  onUpload,
  onRemoveFile,
  onOpenSubmit,
  onDecision,
  onAddComment,
  onCommentState,
  onUpdateSubmission,
}: {
  submissions: Submission[];
  selected: Submission;
  setSelectedId: (id: string) => void;
  projectFiles: ProjectFile[];
  onUpload: (submissionId: string, files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  onOpenSubmit: () => void;
  onDecision: (submissionId: string, action: "approve" | "conditional" | "return" | "reject") => void;
  onAddComment: (submissionId: string, comment: string) => void;
  onCommentState: (submissionId: string, index: number, state: CommentState) => void;
  onUpdateSubmission: (submissionId: string, payload: ProjectUpdatePayload) => void;
}) {
  const selectedFiles = projectFiles.filter((file) => file.submissionId === selected.id);
  const [filterMode, setFilterMode] = useState<"all" | "active" | "needsAttention" | "closed">("all");
  const [editing, setEditing] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const queue = visibleSubmissions.filter((item) => {
    if (filterMode === "active") return item.stage !== "Released" && item.stage !== "Rejected";
    if (filterMode === "closed") return item.stage === "Released" || item.stage === "Rejected";
    if (filterMode === "needsAttention") {
      const counts = requirementCounts(item);
      return counts.fail + counts.warning > 0 || signatureCounts(item).pending > 0;
    }
    return true;
  });

  function cycleFilter() {
    setFilterMode((current) =>
      current === "all" ? "active" : current === "active" ? "needsAttention" : current === "needsAttention" ? "closed" : "all",
    );
  }

  useEffect(() => {
    setEditing(false);
    setCommentDraft("");
  }, [selected.id]);

  function handleProjectUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onUpdateSubmission(selected.id, {
      name: String(data.get("name") ?? selected.name),
      sector: String(data.get("sector") ?? selected.sector),
      division: String(data.get("division") ?? selected.division),
      manager: String(data.get("manager") ?? selected.manager),
      managerEmail: String(data.get("managerEmail") ?? selected.managerEmail),
      submittedOn: String(data.get("submittedOn") ?? selected.submittedOn),
      dueOn: String(data.get("dueOn") ?? selected.dueOn),
      duration: String(data.get("duration") ?? selected.duration),
      estimateCost: String(data.get("estimateCost") ?? selected.estimateCost),
      scope: String(data.get("scope") ?? selected.scope),
      priority: data.get("priority") as Submission["priority"],
      stage: data.get("stage") as Submission["stage"],
      round: data.get("round") as Submission["round"],
      decision: data.get("decision") as Submission["decision"],
      bottleneck: String(data.get("bottleneck") ?? selected.bottleneck),
      nextAction: String(data.get("nextAction") ?? selected.nextAction),
    });
    setEditing(false);
  }

  function submitProjectComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddComment(selected.id, commentDraft);
    setCommentDraft("");
  }

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Submissions"
        title="One workspace for each project package"
        subtitle="Select a project, review completeness, inspect comments, and take the next reviewer action without changing tabs."
        actions={
          <>
            <button className="primary-button compact" type="button" onClick={onOpenSubmit}><Plus size={16} />Submit project</button>
            <button className="secondary-button compact" type="button" onClick={cycleFilter}><Filter size={16} />{filterLabel(filterMode)}</button>
          </>
        }
      />
      <div className="workspace-grid">
        <section className="panel queue-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Queue</p>
              <h2>{queue.length} submissions</h2>
            </div>
          </div>
          <div className="submission-list">
            {queue.map((item) => (
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
            <div className="detail-title-actions">
              <Pill label={selected.decision} tone={decisionTone(selected.decision)} />
              <button className="secondary-button compact" type="button" onClick={() => setEditing((current) => !current)}>
                <PenLine size={15} />
                {editing ? "Close edit" : "Modify project"}
              </button>
            </div>
          </div>
          {editing && (
            <ProjectEditForm selected={selected} onSubmit={handleProjectUpdate} onCancel={() => setEditing(false)} />
          )}
          <ProjectStepTimeline selected={selected} compact />
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
          <ProjectCommentsPanel
            selected={selected}
            commentDraft={commentDraft}
            setCommentDraft={setCommentDraft}
            onSubmit={submitProjectComment}
            onCommentState={onCommentState}
          />
          <section className="subsection">
            <DocumentPackagePanel
              selected={selected}
              files={selectedFiles}
              onUpload={onUpload}
              onRemoveFile={onRemoveFile}
              compact
            />
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
              <button className="primary-button" type="button" onClick={() => onDecision(selected.id, "approve")}><CheckCircle2 size={16} />Approve</button>
              <button className="secondary-button amber" type="button" onClick={() => onDecision(selected.id, "conditional")}><PenLine size={16} />Conditional approval</button>
              <button className="secondary-button" type="button" onClick={() => onDecision(selected.id, "return")}><Mail size={16} />Return to PM</button>
              <button className="secondary-button danger" type="button" onClick={() => onDecision(selected.id, "reject")}><XCircle size={16} />Reject</button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function ProjectEditForm({
  selected,
  onSubmit,
  onCancel,
}: {
  selected: Submission;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="project-edit-form" onSubmit={onSubmit}>
      <div className="form-grid compact-edit-grid">
        <label className="wide">
          Project name
          <input name="name" defaultValue={selected.name} required />
        </label>
        <label>
          Project manager
          <input name="manager" defaultValue={selected.manager} required />
        </label>
        <label>
          Manager email
          <input name="managerEmail" type="email" defaultValue={selected.managerEmail} required />
        </label>
        <label>
          Sector
          <input name="sector" defaultValue={selected.sector} required />
        </label>
        <label>
          Division
          <input name="division" defaultValue={selected.division} required />
        </label>
        <label>
          Submitted on
          <input name="submittedOn" defaultValue={selected.submittedOn} required />
        </label>
        <label>
          Due on
          <input name="dueOn" defaultValue={selected.dueOn} required />
        </label>
        <label>
          Duration
          <input name="duration" defaultValue={selected.duration} required />
        </label>
        <label>
          Budget / estimate
          <input name="estimateCost" defaultValue={selected.estimateCost} required />
        </label>
        <label>
          Priority
          <select name="priority" defaultValue={selected.priority}>
            {priorityOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Review round
          <select name="round" defaultValue={selected.round}>
            {reviewRounds.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Stage
          <select name="stage" defaultValue={selected.stage}>
            {submissionStages.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Decision
          <select name="decision" defaultValue={selected.decision}>
            {decisionPaths.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="wide">
          Scope of work
          <textarea name="scope" defaultValue={selected.scope} required />
        </label>
        <label className="wide">
          Bottleneck
          <input name="bottleneck" defaultValue={selected.bottleneck} />
        </label>
        <label className="wide">
          Next action
          <textarea name="nextAction" defaultValue={selected.nextAction} required />
        </label>
      </div>
      <div className="modal-actions inline-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit"><FileCheck2 size={16} />Save changes</button>
      </div>
    </form>
  );
}

function ProjectCommentsPanel({
  selected,
  commentDraft,
  setCommentDraft,
  onSubmit,
  onCommentState,
}: {
  selected: Submission;
  commentDraft: string;
  setCommentDraft: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCommentState: (submissionId: string, index: number, state: CommentState) => void;
}) {
  return (
    <section className="subsection project-comments">
      <div className="section-heading tight">
        <div>
          <h3>Project comments</h3>
          <p className="muted-line">Comments stay attached to this project package and feed the consolidated recommendation.</p>
        </div>
        <Pill label={`${selected.comments.length} comments`} tone={selected.comments.some((comment) => comment.state === "open") ? "amber" : "green"} />
      </div>
      <form className="comment-compose" onSubmit={onSubmit}>
        <textarea
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
          placeholder="Leave a comment, clarification, reviewer note, or condition for this project..."
          required
        />
        <button className="primary-button compact" type="submit"><Plus size={16} />Add comment</button>
      </form>
      <div className="project-comment-list">
        {selected.comments.length === 0 ? (
          <div className="empty-upload-state compact-empty">
            <FileText size={18} />
            <strong>No comments yet</strong>
            <p>Add the first project comment from here. It will also appear in the Review Board.</p>
          </div>
        ) : (
          selected.comments.map((comment, index) => (
            <article className="project-comment" key={`${comment.reviewer}-${comment.date}-${index}`}>
              <div>
                <strong>{comment.reviewer}</strong>
                <span>{comment.role} / {comment.date}</span>
              </div>
              <p>{comment.comment}</p>
              <div className="comment-actions">
                <Pill label={commentStateLabel(comment.state)} tone={commentTone(comment.state)} />
                <button type="button" className="text-button" onClick={() => onCommentState(selected.id, index, "resolved")}>Resolve</button>
                <button type="button" className="text-button" onClick={() => onCommentState(selected.id, index, "approvedWithComments")}>Carry condition</button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function DocumentsPage({
  submissions: visibleSubmissions,
  selected,
  setSelectedId,
  projectFiles,
  onUpload,
  onRemoveFile,
}: {
  submissions: Submission[];
  selected: Submission;
  setSelectedId: (id: string) => void;
  projectFiles: ProjectFile[];
  onUpload: (submissionId: string, files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
}) {
  const selectedFiles = projectFiles.filter((file) => file.submissionId === selected.id);

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Documents"
        title="Upload and download TTRT project packages"
        subtitle="Keep the original sheet, supporting evidence, revised submissions, and final TTRT report attached to the project record."
      />

      <div className="workspace-grid narrow-left">
        <section className="panel queue-panel">
          <p className="eyebrow">Project packages</p>
          <div className="submission-list compact-list">
            {visibleSubmissions.map((item) => {
              const fileCount = projectFiles.filter((file) => file.submissionId === item.id).length;
              return (
                <button key={item.id} className={`project-rail-item ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)} type="button">
                  <div>
                    <strong>{item.code}</strong>
                    <span>{item.name}</span>
                  </div>
                  <div className="rail-meta">
                    <Pill label={`${fileCount} files`} tone={fileCount > 0 ? "green" : "amber"} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <DocumentPackagePanel selected={selected} files={selectedFiles} onUpload={onUpload} onRemoveFile={onRemoveFile} />
      </div>
    </div>
  );
}

function DocumentPackagePanel({
  selected,
  files,
  onUpload,
  onRemoveFile,
  compact = false,
}: {
  selected: Submission;
  files: ProjectFile[];
  onUpload: (submissionId: string, files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  compact?: boolean;
}) {
  const inputId = `file-upload-${selected.id}-${compact ? "compact" : "page"}`;

  return (
    <section className={compact ? "document-panel compact-document-panel" : "panel document-panel"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Document package</p>
          <h2>{compact ? "Submitted documents" : selected.name}</h2>
        </div>
        <label className="primary-button compact file-upload-button" htmlFor={inputId}>
          <Upload size={16} />
          Upload
          <input
            id={inputId}
            type="file"
            multiple
            accept=".doc,.docx,.pdf,.xlsx,.xls,.dwg,.zip"
            onChange={(event) => {
              onUpload(selected.id, event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="document-layout">
        <div className="expected-documents">
          <p className="eyebrow">Expected in package</p>
          {selected.submittedDocuments.map((name) => (
            <div className="expected-document" key={name}>
              <FileText size={15} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        <div className="uploaded-documents">
          <p className="eyebrow">Uploaded files</p>
          {files.length === 0 ? (
            <div className="empty-upload-state">
              <Upload size={18} />
              <strong>No files uploaded yet</strong>
              <p>Upload the TTRT sheet or supporting files, then reviewers can download them from this panel.</p>
            </div>
          ) : (
            files.map((file) => (
              <div className="uploaded-document" key={file.id}>
                <div>
                  <strong>{file.name}</strong>
                  <p>{file.category} / {file.size} / {file.uploadedAt} / {file.uploadedBy}</p>
                  <p className="file-ai-note">{file.aiAnalysis}</p>
                </div>
                <div className="document-actions">
                  <a className="secondary-button compact" href={file.dataUrl} download={file.name}>
                    <Download size={15} />
                    Download
                  </a>
                  <button className="text-button danger-link" type="button" onClick={() => onRemoveFile(file.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewBoard({
  submissions: visibleSubmissions,
  selected,
  setSelectedId,
  onCommentState,
  onAddComment,
}: {
  submissions: Submission[];
  selected: Submission;
  setSelectedId: (id: string) => void;
  onCommentState: (submissionId: string, index: number, state: CommentState) => void;
  onAddComment: (submissionId: string) => void;
}) {
  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Review Board"
        title="Technical comments are consolidated before PM response"
        subtitle="The coordinator sees who commented, what remains open, and whether each comment is resolved or carried into conditions."
        actions={<button className="primary-button compact" type="button" onClick={() => onAddComment(selected.id)}><Plus size={16} />Add comment</button>}
      />
      <div className="workspace-grid narrow-left">
        <section className="panel queue-panel">
          <p className="eyebrow">Projects in review</p>
          <div className="submission-list compact-list">
            {visibleSubmissions.map((item) => (
              <button key={item.id} className={`project-rail-item ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)} type="button">
                <div>
                  <strong>{item.code}</strong>
                  <span>{item.name}</span>
                </div>
                <div className="rail-meta">
                  <Pill label={item.stage} tone={stageTone(item.stage)} />
                  <small>{item.slaRemaining}</small>
                </div>
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
            {selected.comments.map((comment, index) => (
              <div className="comment-row" key={`${comment.reviewer}-${comment.date}`}>
                <div>
                  <strong>{comment.reviewer}</strong>
                  <p>{comment.role}</p>
                </div>
                <p>{comment.comment}</p>
                <div className="comment-actions">
                  <Pill label={commentStateLabel(comment.state)} tone={commentTone(comment.state)} />
                  <button type="button" className="text-button" onClick={() => onCommentState(selected.id, index, "resolved")}>Resolve</button>
                  <button type="button" className="text-button" onClick={() => onCommentState(selected.id, index, "approvedWithComments")}>Carry condition</button>
                </div>
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

function SignaturesPage({
  submissions: visibleSubmissions,
  selected,
  setSelectedId,
  onSign,
  onRemind,
}: {
  submissions: Submission[];
  selected: Submission;
  setSelectedId: (id: string) => void;
  onSign: (submissionId: string, signatureKey: string) => void;
  onRemind: (submissionId: string, signature: SignatureRecord) => void;
}) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Signatures" title="Signature chain and ED release tracker" subtitle="The app shows who must sign, who is late, and which package is ready for Executive Director approval." />
      <div className="workspace-grid narrow-left">
        <section className="panel queue-panel">
          <p className="eyebrow">Packages</p>
          <div className="submission-list compact-list">
            {visibleSubmissions.map((item) => (
              <button className={`project-rail-item ${selected.id === item.id ? "active" : ""}`} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
                <div>
                  <strong>{item.code}</strong>
                  <span>{item.name}</span>
                </div>
                <div className="rail-meta">
                  <Pill label={`${signatureCounts(item).pending} pending`} tone={signatureCounts(item).pending > 0 ? "amber" : "green"} />
                  <small>{item.stage}</small>
                </div>
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
            {selected.signatures.map((signature) => (
              <SignatureCard
                key={`${signature.name}-${signature.role}`}
                signature={signature}
                onSign={() => onSign(selected.id, `${signature.name}-${signature.role}`)}
                onRemind={() => onRemind(selected.id, signature)}
              />
            ))}
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

function RulesPage({ rules, setRules, onSave }: { rules: Rule[]; setRules: (rules: Rule[]) => void; onSave: () => void }) {
  function updateRule(id: string, patch: Partial<Rule>) {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="Rules" title="Business requirements that drive checks and alerts" subtitle="Rules stay readable for coordinators: each one says what must be true, what the app should automate, and who owns it." actions={<button className="primary-button compact" type="button" onClick={onSave}><FileCheck2 size={16} />Save rules</button>} />
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

function ReportsPage({ selected, setPage, onGenerate }: { selected: Submission; setPage: (page: Page) => void; onGenerate: (kind: string) => void }) {
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
            <button className="secondary-button compact" type="button" onClick={() => onGenerate(report.title)}>Generate</button>
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

const userRoles = [
  "Platform admin",
  "TTRT lead",
  "TTRT member",
  "Coordinator",
  "Project manager",
  "Technical reviewer",
  "Executive approver",
  "Read-only viewer",
];

function UsersPage({ users, addUser, patchUser }: { users: TtrtUser[]; addUser: () => void; patchUser: (id: string, patch: Partial<TtrtUser>) => void }) {
  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="User management"
        title="Control who can access TTRT reviews"
        subtitle="Manage coordinators, technical reviewers, supervisors, and read-only users without exposing the technical platform layer."
        actions={<button className="primary-button compact" onClick={addUser}><UserPlus size={16} />Add user</button>}
      />
      <section className="panel user-table">
        <div className="user-table-header">
          <span>User</span>
          <span>Role</span>
          <span>Scope</span>
          <span>Status</span>
        </div>
        {users.map((user) => (
          <div className="user-row" key={user.id}>
            <div className="user-identity">
              <span className="user-avatar">{initials(user.name)}</span>
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
              </div>
            </div>
            <label className="user-field">
              <span>Role</span>
              <select className="user-control" value={user.role} onChange={(event) => patchUser(user.id, { role: event.target.value })}>
                {userRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="user-field">
              <span>Scope</span>
              <input className="user-control" value={user.scope} onChange={(event) => patchUser(user.id, { scope: event.target.value })} />
            </label>
            <button className={`toggle ${user.status === "Active" ? "on" : ""}`} type="button" onClick={() => patchUser(user.id, { status: user.status === "Active" ? "Pending" : "Active" })}>
              {user.status}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

const processPhases = [
  {
    number: "01",
    title: "Intake and screening",
    subtitle: "Quality gate before circulation",
    tone: "blue" as StageTone,
    steps: stageFlow.slice(0, 2),
    outcome: "Incomplete packages return to the project manager before TTRT time is consumed.",
  },
  {
    number: "02",
    title: "Technical review loop",
    subtitle: "Comments resolved once, not by email drift",
    tone: "amber" as StageTone,
    steps: stageFlow.slice(2, 5),
    outcome: "AI consolidates comments, tracks PM responses, and flags unresolved requirements.",
  },
  {
    number: "03",
    title: "Decision and release",
    subtitle: "Recommendation, signatures, archive",
    tone: "green" as StageTone,
    steps: stageFlow.slice(5),
    outcome: "The final report, conditions, approvals, and evidence trail are locked for audit.",
  },
];

function ProjectStepTimeline({ selected, compact = false }: { selected: Submission; compact?: boolean }) {
  const currentIndex = getCurrentStageIndex(selected);

  return (
    <div className={`project-stepper ${compact ? "compact-stepper" : ""}`}>
      {stageFlow.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        return (
          <div className={`project-step ${state}`} key={step.label}>
            <span>{index < currentIndex ? <CheckCircle2 size={16} /> : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              {!compact && <p>{step.helper}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TtrtProcessMap() {
  return (
    <div className="process-map">
      {processPhases.map((phase, phaseIndex) => (
        <article className={`process-phase ${phase.tone}`} key={phase.title}>
          <div className="phase-header">
            <span>{phase.number}</span>
            <div>
              <p>{phase.subtitle}</p>
              <h3>{phase.title}</h3>
            </div>
          </div>
          <div className="process-steps">
            {phase.steps.map((step, stepIndex) => {
              const globalIndex = processPhases.slice(0, phaseIndex).reduce((total, item) => total + item.steps.length, 0) + stepIndex + 1;
              return (
                <div className="process-step" key={step.label}>
                  <span className={`step-index ${step.tone}`}>{globalIndex}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="phase-outcome">
            <CheckCircle2 size={15} />
            <span>{phase.outcome}</span>
          </div>
          {phaseIndex < processPhases.length - 1 && (
            <div className="phase-connector" aria-hidden="true">
              <ArrowRight size={16} />
            </div>
          )}
        </article>
      ))}
      <div className="decision-strip">
        <div>
          <p className="eyebrow">Final recommendation paths</p>
          <strong>Approve, conditional approval, or reject</strong>
        </div>
        <div className="decision-paths">
          <Pill label="Approve" tone="green" />
          <Pill label="Conditional approval" tone="amber" />
          <Pill label="Reject" tone="red" />
        </div>
      </div>
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
        <InfoBlock label="Default landing" value="Overview" helper="Business review workspace" />
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

function ProgressKpi({
  label,
  value,
  helper,
  tone,
  progress,
}: {
  label: string;
  value: string;
  helper: string;
  tone: StageTone;
  progress: number;
}) {
  return (
    <article className="progress-kpi">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{helper}</p>
      </div>
      <div className={`progress-dot ${tone}`} />
      <div className="progress-track" aria-hidden="true">
        <i className={tone} style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}

function DecisionSplitCard({
  split,
  total,
}: {
  split: Array<{ label: string; count: number; color: string }>;
  total: number;
}) {
  const safeTotal = Math.max(1, total);
  let cursor = 0;
  const stops = split.map((item) => {
    const start = cursor;
    const span = (item.count / safeTotal) * 100;
    cursor += span;
    return `${item.color} ${start}% ${cursor}%`;
  });
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#e4ebe8 0 100%)";

  return (
    <aside className="decision-split-card">
      <div>
        <p className="eyebrow">Committee decision split</p>
        <h2>Decision mix</h2>
      </div>
      <div className="decision-split-body">
        <div className="donut-chart" style={{ background: gradient }} aria-label={`${total} TTRT submissions`}>
          <div>
            <strong>{total}</strong>
            <span>items</span>
          </div>
        </div>
        <div className="decision-legend">
          {split.map((item) => (
            <div key={item.label} className="decision-legend-row">
              <span style={{ backgroundColor: item.color }} />
              <strong>{item.label}</strong>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StageLoadChart({
  stages,
  total,
}: {
  stages: Array<{ label: string; count: number; tone: StageTone }>;
  total: number;
}) {
  return (
    <div className="stage-load-card">
      <div>
        <span>Stage load</span>
        <strong>Where work sits now</strong>
      </div>
      <div className="stage-load-bars">
        {stages.map((stage) => (
          <div key={stage.label} className="stage-load-row">
            <span>{stage.label}</span>
            <div className="stage-load-track" aria-hidden="true">
              <i className={stage.tone} style={{ width: `${Math.max(5, (stage.count / Math.max(1, total)) * 100)}%` }} />
            </div>
            <b>{stage.count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTrendChart({
  submittedThisMonth,
  averageTargetDays,
}: {
  submittedThisMonth: number;
  averageTargetDays: number;
}) {
  const points = [18, 26, 22, 35, 31, 46, 41, 57, 53, 66, 61, 74];
  return (
    <div className="mini-trend-card">
      <div>
        <span>Monthly pace</span>
        <strong>{submittedThisMonth} this month</strong>
        <p>{averageTargetDays}d average target window</p>
      </div>
      <svg viewBox="0 0 160 72" role="img" aria-label="Submission pace trend">
        <polyline
          points={points.map((value, index) => `${index * 14 + 3},${72 - value}`).join(" ")}
          fill="none"
          stroke="#2f6ea8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points.map((value, index) => `${index * 14 + 3},${72 - value}`).join(" ")}
          fill="none"
          stroke="rgba(47,110,168,0.16)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: StageTone;
  progress?: number;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{helper}</p>
      {typeof progress === "number" && (
        <div className="metric-progress" aria-hidden="true">
          <i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
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

function SignatureCard({
  signature,
  onSign,
  onRemind,
}: {
  signature: SignatureRecord;
  onSign?: () => void;
  onRemind?: () => void;
}) {
  return (
    <article className={`signature-card ${signature.status}`}>
      <div>
        <strong>{signature.name}</strong>
        <p>{signature.role}</p>
      </div>
      <Pill label={signature.status} tone={signature.status === "signed" ? "green" : signature.status === "blocked" ? "red" : "amber"} />
      <span>{signature.date ?? "awaiting"}</span>
      {signature.status === "pending" && (
        <div className="signature-actions">
          <button className="primary-button compact" type="button" onClick={onSign}><Signature size={14} />Sign</button>
          <button className="secondary-button compact" type="button" onClick={onRemind}><Bell size={14} />Remind</button>
        </div>
      )}
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

function parseDisplayDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ].indexOf(monthName.toLowerCase());
  if (month < 0) return null;
  return new Date(Number(year), month, Number(day), 23, 59, 59);
}

function commentTone(state: CommentState): StageTone {
  if (state === "resolved") return "green";
  if (state === "approvedWithComments") return "amber";
  return "red";
}

function commentStateLabel(state: CommentState): string {
  if (state === "approvedWithComments") return "Approved with comments";
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function filterLabel(filterMode: "all" | "active" | "needsAttention" | "closed"): string {
  if (filterMode === "active") return "Active";
  if (filterMode === "needsAttention") return "Needs attention";
  if (filterMode === "closed") return "Closed";
  return "All";
}

function nowStamp(): string {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayStamp(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function updateTimelineForStage(timeline: TimelineStep[], stage: Submission["stage"]): TimelineStep[] {
  const currentIndex = stageIndexForStage(stage);
  return timeline.map((step, index) => ({
    ...step,
    status:
      stage === "Rejected" && index >= currentIndex
        ? "blocked"
        : stage === "Released"
          ? "done"
          : index < currentIndex
            ? "done"
            : index === currentIndex
              ? "current"
              : "next",
    sla: index === currentIndex && stage !== "Released" && stage !== "Rejected" ? "current" : step.sla,
  }));
}

function stageIndexForStage(stage: Submission["stage"]): number {
  if (stage === "Initial screening") return 1;
  if (stage === "Returned to PM" || stage === "PM response") return 4;
  if (stage === "Technical review") return 2;
  if (stage === "Final recommendation") return 5;
  if (stage === "Executive approval") return 6;
  if (stage === "Released" || stage === "Rejected") return 7;
  return 0;
}

function buildReportText(kind: string, submission: Submission, files: ProjectFile[]): string {
  const counts = requirementCounts(submission);
  const signatures = signatureCounts(submission);
  return [
    "TTRT PROJECT REVIEW OUTPUT",
    `Report type: ${kind}`,
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    "",
    "SUBMISSION",
    `Code: ${submission.code}`,
    `Name: ${submission.name}`,
    `Sector: ${submission.sector}`,
    `Division: ${submission.division}`,
    `Project manager: ${submission.manager} <${submission.managerEmail}>`,
    `Submitted: ${submission.submittedOn}`,
    `Due: ${submission.dueOn}`,
    `Stage: ${submission.stage}`,
    `Decision: ${submission.decision}`,
    `Priority: ${submission.priority}`,
    `Cost: ${submission.estimateCost}`,
    "",
    "SCOPE",
    submission.scope,
    "",
    "AI SCREENING OPINION",
    submission.aiSummary,
    "",
    "NEXT ACTION",
    submission.nextAction,
    "",
    "RECOMMENDATION",
    submission.recommendation,
    "",
    "DOCUMENT CHECKS",
    `Pass: ${counts.pass} / Warning: ${counts.warning} / Fail: ${counts.fail}`,
    ...submission.documents.map((doc) => `- ${doc.name}: ${doc.state.toUpperCase()} - ${doc.note}`),
    "",
    "UPLOADED FILES",
    ...(files.length ? files.map((file) => `- ${file.name} (${file.category}, ${file.size}, ${file.uploadedAt})`) : ["- No files uploaded"]),
    "",
    "COMMENTS",
    ...(submission.comments.length
      ? submission.comments.map((comment) => `- ${comment.date} / ${comment.reviewer} / ${commentStateLabel(comment.state)}: ${comment.comment}`)
      : ["- No comments recorded"]),
    "",
    "SIGNATURES",
    `Signed: ${signatures.signed} / Pending: ${signatures.pending} / Blocked: ${signatures.blocked}`,
    ...submission.signatures.map((signature) => `- ${signature.name} (${signature.role}): ${signature.status}${signature.date ? ` on ${signature.date}` : ""}`),
    "",
    "TIMELINE",
    ...submission.timeline.map((step) => `- ${step.label}: ${step.status} / ${step.owner} / ${step.sla}`),
    "",
  ].join("\n");
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferDocumentCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".dwg")) return "CAD / drawing";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "TTRT sheet";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) return "Evidence register";
  if (lower.endsWith(".zip")) return "Package archive";
  if (lower.endsWith(".pdf")) return "Signed PDF";
  return "Supporting file";
}

function analyzeUploadedFile(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    return "AI screen: ready to extract project fields, dates, contact person, comments, and signature markers.";
  }
  if (lower.endsWith(".pdf")) {
    return "AI screen: ready for OCR, page-level evidence checks, and attachment completeness review.";
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return "AI screen: ready to compare tabular costs, dates, and requirements against the submission form.";
  }
  if (lower.endsWith(".dwg")) {
    return "AI screen: CAD file detected; route to drawing/model review when CAD analysis is enabled.";
  }
  if (lower.endsWith(".zip")) {
    return "AI screen: package archive detected; unzip and inspect contents before circulation.";
  }
  return "AI screen: supporting file attached and available for reviewer inspection.";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDateForSubmission(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function deriveDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return "Pending";
  const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  return `${months} month${months === 1 ? "" : "s"}`;
}

function getCurrentStageIndex(submission: Submission): number {
  return stageIndexForStage(submission.stage);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
