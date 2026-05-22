export type StageTone = "blue" | "green" | "amber" | "red" | "purple";

export type SubmissionStage =
  | "Initial screening"
  | "Returned to PM"
  | "Technical review"
  | "PM response"
  | "Final recommendation"
  | "Executive approval"
  | "Released"
  | "Rejected";

export type DecisionPath = "Approve" | "Conditional approval" | "Reject" | "Pending";
export type ReviewRound = "Initial Review" | "2nd Review" | "Final Review";
export type SignatureStatus = "signed" | "pending" | "blocked";
export type RequirementState = "pass" | "warning" | "fail";
export type CommentState = "resolved" | "open" | "approved-with-comments";

export interface DocumentCheck {
  name: string;
  state: RequirementState;
  note: string;
}

export interface ReviewComment {
  reviewer: string;
  role: string;
  date: string;
  state: CommentState;
  comment: string;
}

export interface Signature {
  name: string;
  role: string;
  date?: string;
  status: SignatureStatus;
}

export interface TimelineStep {
  label: string;
  owner: string;
  status: "done" | "current" | "blocked" | "next";
  sla: string;
}

export interface Submission {
  id: string;
  code: string;
  name: string;
  sector: string;
  division: string;
  manager: string;
  managerEmail: string;
  submittedOn: string;
  dueOn: string;
  round: ReviewRound;
  stage: SubmissionStage;
  priority: "Normal" | "High" | "Critical";
  decision: DecisionPath;
  duration: string;
  estimateCost: string;
  scope: string;
  submittedDocuments: string[];
  documents: DocumentCheck[];
  comments: ReviewComment[];
  signatures: Signature[];
  timeline: TimelineStep[];
  recommendation: string;
  aiSummary: string;
  nextAction: string;
  slaRemaining: string;
  bottleneck: string;
}

export interface Rule {
  id: string;
  service: string;
  category: "Completeness" | "Circulation" | "Comments" | "Signatures" | "Decision";
  rule: string;
  automation: string;
  owner: string;
  active: boolean;
}

export const submissions: Submission[] = [
  {
    id: "sub-aviation-2031",
    code: "TTRT-2026-0142",
    name: "Development of the Abu Dhabi Civil Aviation Strategy (2027 to 2031)",
    sector: "Aviation",
    division: "Strategy and Governance",
    manager: "Zain Abdulnaser Al Zubaidi",
    managerEmail: "zain.alzubaidi@itc.gov.ae",
    submittedOn: "21 May 2026",
    dueOn: "28 May 2026",
    round: "Initial Review",
    stage: "Final recommendation",
    priority: "High",
    decision: "Conditional approval",
    duration: "12 months",
    estimateCost: "N/A",
    scope:
      "Appoint a strategic advisor to develop the Abu Dhabi Aviation Sector Strategy 2027-2031, with focus on sustainability, competitiveness, innovation, AI implementation, and long-term growth aligned with Abu Dhabi economic objectives.",
    submittedDocuments: ["Scope of services", "Appendices", "Risk register", "Technical evaluation"],
    documents: [
      { name: "Scope of services", state: "pass", note: "Submitted and readable." },
      { name: "Appendices", state: "pass", note: "Submitted with project package." },
      { name: "Risk register", state: "pass", note: "Submitted; requires alignment to enterprise risk taxonomy." },
      { name: "Technical evaluation", state: "warning", note: "Marked as not attached in the source sheet; AI flagged for PM confirmation." },
    ],
    comments: [
      { reviewer: "Hussein Elhadi", role: "TTRT member", date: "14.05.2026", state: "resolved", comment: "No comments." },
      {
        reviewer: "Abdulkader Ahmed",
        role: "AI/V2X reviewer",
        date: "15.05.2026",
        state: "approved-with-comments",
        comment: "Consider committee comments on platform alignment, governance, and data exchange.",
      },
      { reviewer: "Mohammad Almasoud", role: "TTRT member", date: "15.05.2026", state: "resolved", comment: "No comments." },
    ],
    signatures: [
      { name: "Rashid Al Naqbi", role: "TTRT member", date: "20/05/2026", status: "signed" },
      { name: "Mohammed Shalwani", role: "TTRT member", date: "20-05-2026", status: "signed" },
      { name: "Abdulqader Ahmed", role: "AI/V2X reviewer", date: "15.5.2026", status: "signed" },
      { name: "Hussein El Hadi", role: "TTRT member", date: "14.05.2026", status: "signed" },
      { name: "Surendra Sharma", role: "TTRT member", status: "pending" },
      { name: "HE. Hamad Alafeefi", role: "Executive Director", status: "pending" },
    ],
    timeline: [
      { label: "Project submission", owner: "PM", status: "done", sla: "21 May" },
      { label: "Initial screening", owner: "TTRT coordinator", status: "done", sla: "same day" },
      { label: "Technical review", owner: "TTRT members", status: "done", sla: "3 days" },
      { label: "Collect comments", owner: "Coordinator", status: "done", sla: "1 day" },
      { label: "Final recommendation", owner: "TTRT lead", status: "current", sla: "today" },
      { label: "ED approval", owner: "Executive Director", status: "next", sla: "2 days" },
    ],
    recommendation:
      "Approved with comments. Add explicit alignment to existing Abu Dhabi Mobility ITS platforms, enterprise architecture standards, cybersecurity framework, AI governance policies, and mobility data exchange protocols.",
    aiSummary:
      "The package is mostly complete. One document marker says technical evaluation is not attached. Comments are consolidated, but the conditional approval report should explicitly list four governance amendments before ED sign-off.",
    nextAction: "Prepare conditional approval report and request PM evidence for the technical evaluation attachment marker.",
    slaRemaining: "18h",
    bottleneck: "Final TTRT report and two signatures pending",
  },
  {
    id: "sub-v2x-corridor",
    code: "TTRT-2026-0145",
    name: "V2X Corridor Pilot for Airport Access Roads",
    sector: "ITS",
    division: "AI/V2X",
    manager: "Mariam Al Mansoori",
    managerEmail: "mariam.mansoori@itc.gov.ae",
    submittedOn: "20 May 2026",
    dueOn: "27 May 2026",
    round: "Initial Review",
    stage: "Technical review",
    priority: "Critical",
    decision: "Pending",
    duration: "8 months",
    estimateCost: "AED 18M",
    scope:
      "Pilot connected corridor use cases for airport access roads, including RSU deployment, vehicle-to-infrastructure messages, incident alerts, and integration with operational command systems.",
    submittedDocuments: ["Project brief", "Network diagram", "Cybersecurity checklist", "Vendor capability statement"],
    documents: [
      { name: "Project brief", state: "pass", note: "Submitted with clear objective and corridor boundaries." },
      { name: "Network diagram", state: "warning", note: "RSU locations visible, but backhaul ownership is unclear." },
      { name: "Cybersecurity checklist", state: "fail", note: "No evidence of certificate validity or penetration-test plan." },
      { name: "Vendor capability statement", state: "pass", note: "Submitted; requires conflict-of-interest review." },
    ],
    comments: [
      {
        reviewer: "Abdulkader Ahmed",
        role: "AI/V2X reviewer",
        date: "21.05.2026",
        state: "open",
        comment: "Clarify standards profile, RSU certificate authority, and message-set interoperability.",
      },
      {
        reviewer: "Hadi Jammal",
        role: "Traffic systems",
        date: "21.05.2026",
        state: "open",
        comment: "Need integration plan with operations center incident workflow.",
      },
    ],
    signatures: [
      { name: "Abdulqader Ahmed", role: "AI/V2X reviewer", status: "pending" },
      { name: "Hadi Jammal", role: "Traffic systems", status: "pending" },
      { name: "Ghassan Abazid", role: "Enterprise architecture", status: "pending" },
      { name: "HE. Hamad Alafeefi", role: "Executive Director", status: "pending" },
    ],
    timeline: [
      { label: "Project submission", owner: "PM", status: "done", sla: "20 May" },
      { label: "Initial screening", owner: "TTRT coordinator", status: "done", sla: "21 May" },
      { label: "Technical review", owner: "TTRT members", status: "current", sla: "today" },
      { label: "Collect comments", owner: "Coordinator", status: "next", sla: "1 day" },
      { label: "PM response", owner: "PM", status: "next", sla: "2 days" },
    ],
    recommendation: "Pending. Early signal indicates return to PM for cybersecurity evidence and interoperability clarification.",
    aiSummary:
      "High impact, but not ready for circulation closure. Missing cyber evidence is deterministic. The app can auto-draft a targeted return-to-PM request immediately.",
    nextAction: "Send clarification to PM for cyber certificate validity, penetration-test plan, and operations-center interface owner.",
    slaRemaining: "6h",
    bottleneck: "Cybersecurity evidence missing",
  },
  {
    id: "sub-smart-crossing",
    code: "TTRT-2026-0138",
    name: "Contactless Smart Pedestrian Crossing Phase 1",
    sector: "Road Safety",
    division: "ITS Deployment",
    manager: "Sara Al Ketbi",
    managerEmail: "sara.alketbi@itc.gov.ae",
    submittedOn: "17 May 2026",
    dueOn: "24 May 2026",
    round: "2nd Review",
    stage: "PM response",
    priority: "Normal",
    decision: "Conditional approval",
    duration: "10 months",
    estimateCost: "AED 34M",
    scope:
      "Deploy sensor-based contactless pedestrian crossing detection on selected Abu Dhabi Island corridors, with adaptive signal timing and safety-impact monitoring.",
    submittedDocuments: ["Revised scope", "Site list", "Safety impact note", "Implementation plan"],
    documents: [
      { name: "Revised scope", state: "pass", note: "Updated after first review." },
      { name: "Site list", state: "pass", note: "Includes 18 candidate intersections." },
      { name: "Safety impact note", state: "warning", note: "Target reduction stated, but baseline source should be referenced." },
      { name: "Implementation plan", state: "pass", note: "Sequencing is clear." },
    ],
    comments: [
      {
        reviewer: "Hasanul Banna",
        role: "Signal systems",
        date: "19.05.2026",
        state: "approved-with-comments",
        comment: "Require baseline reference for pedestrian conflict rates.",
      },
      {
        reviewer: "Nuha AlBusaeed",
        role: "Road safety",
        date: "19.05.2026",
        state: "open",
        comment: "Confirm school-zone prioritization criteria.",
      },
    ],
    signatures: [
      { name: "Hasanul Banna", role: "Signal systems", date: "19.05.2026", status: "signed" },
      { name: "Nuha AlBusaeed", role: "Road safety", status: "pending" },
      { name: "Mohamed Adnan", role: "Coordinator", date: "20.05.2026", status: "signed" },
    ],
    timeline: [
      { label: "Project submission", owner: "PM", status: "done", sla: "17 May" },
      { label: "Initial screening", owner: "TTRT coordinator", status: "done", sla: "18 May" },
      { label: "Technical review", owner: "TTRT members", status: "done", sla: "19 May" },
      { label: "PM response", owner: "PM", status: "current", sla: "today" },
      { label: "Review updated submission", owner: "TTRT lead", status: "next", sla: "1 day" },
    ],
    recommendation: "Conditional approval likely if PM resolves two safety-evidence comments.",
    aiSummary:
      "The second submission addresses most technical comments. Two comments remain open but are bounded and suitable for conditional approval if the PM provides evidence.",
    nextAction: "Nudge PM to provide safety baseline source and school-zone prioritization criteria.",
    slaRemaining: "2d",
    bottleneck: "PM response pending",
  },
  {
    id: "sub-communications",
    code: "TTRT-2026-0132",
    name: "ITS Communication Redundancy Enhancement Initiative",
    sector: "Operations",
    division: "Network Services",
    manager: "Omar Al Nuaimi",
    managerEmail: "omar.nuaimi@itc.gov.ae",
    submittedOn: "12 May 2026",
    dueOn: "19 May 2026",
    round: "Final Review",
    stage: "Released",
    priority: "Normal",
    decision: "Approve",
    duration: "6 months",
    estimateCost: "AED 1.2M",
    scope:
      "Upgrade communication redundancy for priority ITS assets to reduce outage risk and improve failover between field cabinets and the control center.",
    submittedDocuments: ["Gap analysis", "Asset list", "Implementation method", "Cost estimate"],
    documents: [
      { name: "Gap analysis", state: "pass", note: "Submitted." },
      { name: "Asset list", state: "pass", note: "Submitted." },
      { name: "Implementation method", state: "pass", note: "Submitted and accepted." },
      { name: "Cost estimate", state: "pass", note: "Submitted." },
    ],
    comments: [
      { reviewer: "Surendra Sharma", role: "Network services", date: "15.05.2026", state: "resolved", comment: "No further comments after update." },
    ],
    signatures: [
      { name: "Surendra Sharma", role: "Network services", date: "16.05.2026", status: "signed" },
      { name: "Rashid Al Naqbi", role: "TTRT lead", date: "17.05.2026", status: "signed" },
      { name: "HE. Hamad Alafeefi", role: "Executive Director", date: "19.05.2026", status: "signed" },
    ],
    timeline: [
      { label: "Project submission", owner: "PM", status: "done", sla: "12 May" },
      { label: "Technical review", owner: "TTRT members", status: "done", sla: "15 May" },
      { label: "Final recommendation", owner: "TTRT lead", status: "done", sla: "17 May" },
      { label: "ED approval", owner: "Executive Director", status: "done", sla: "19 May" },
      { label: "Released", owner: "Coordinator", status: "done", sla: "19 May" },
    ],
    recommendation: "Approved and released from TTRT.",
    aiSummary:
      "All mandatory documents, comments, signatures, and ED approval are complete. This submission is ready for archive.",
    nextAction: "Archive with final TTRT approved report.",
    slaRemaining: "closed",
    bottleneck: "None",
  },
];

export const rules: Rule[] = [
  {
    id: "screen-required-fields",
    service: "All project submissions",
    category: "Completeness",
    rule: "Project name, sector, contact person, scope, duration, cost, and document list must be present before circulation.",
    automation: "Auto-return to PM when deterministic fields are missing.",
    owner: "TTRT Coordinator",
    active: true,
  },
  {
    id: "screen-documents",
    service: "Initial screening",
    category: "Completeness",
    rule: "Submitted document list must match uploaded package; any marker like 'not attached' is a blocking issue.",
    automation: "Flag missing evidence and draft a return-to-PM email.",
    owner: "TTRT Coordinator",
    active: true,
  },
  {
    id: "circulation-members",
    service: "Technical review",
    category: "Circulation",
    rule: "Circulate to required TTRT members based on sector, technology domain, cybersecurity, enterprise architecture, and operations impact.",
    automation: "Suggest reviewers and send assignment alerts.",
    owner: "TTRT Lead",
    active: true,
  },
  {
    id: "comment-resolution",
    service: "PM response",
    category: "Comments",
    rule: "Every reviewer comment must be resolved, accepted with condition, or explicitly carried into final recommendation.",
    automation: "Block final report if open comments are not mapped.",
    owner: "TTRT Lead",
    active: true,
  },
  {
    id: "signature-chain",
    service: "Final recommendation",
    category: "Signatures",
    rule: "Final report requires TTRT lead signature and all mandatory technical reviewers before ED approval.",
    automation: "Escalate pending signatures at 70% SLA and again 24h before due date.",
    owner: "Executive Office",
    active: true,
  },
  {
    id: "conditional-approval",
    service: "Conditional approval",
    category: "Decision",
    rule: "Conditional approval must list numbered conditions, evidence owner, due date, verification owner, and closure status.",
    automation: "Create a conditions register and reminders until closure.",
    owner: "TTRT Coordinator",
    active: true,
  },
];

export const stageFlow: Array<{ label: string; tone: StageTone; helper: string }> = [
  { label: "Project Submission", tone: "blue", helper: "PM uploads TTRT sheet and evidence package" },
  { label: "Initial Screening", tone: "blue", helper: "AI checks mandatory fields, documents, and obvious gaps" },
  { label: "Technical Review", tone: "blue", helper: "Right reviewers receive assignments and deadlines" },
  { label: "Comment Consolidation", tone: "blue", helper: "Open comments are grouped by requirement and owner" },
  { label: "PM Response", tone: "amber", helper: "PM responds once, with missing evidence attached" },
  { label: "Final Recommendation", tone: "purple", helper: "Approve, conditional approval, or reject" },
  { label: "ED Approval", tone: "green", helper: "Signature pack and TTRT report ready" },
  { label: "Closure & Archive", tone: "green", helper: "Decision and evidence are locked" },
];

export function stageTone(stage: SubmissionStage): StageTone {
  if (stage === "Released") return "green";
  if (stage === "Rejected") return "red";
  if (stage === "Returned to PM" || stage === "PM response") return "amber";
  if (stage === "Final recommendation" || stage === "Executive approval") return "purple";
  return "blue";
}

export function requirementCounts(submission: Submission) {
  return {
    pass: submission.documents.filter((doc) => doc.state === "pass").length,
    warning: submission.documents.filter((doc) => doc.state === "warning").length,
    fail: submission.documents.filter((doc) => doc.state === "fail").length,
  };
}

export function signatureCounts(submission: Submission) {
  return {
    signed: submission.signatures.filter((signature) => signature.status === "signed").length,
    pending: submission.signatures.filter((signature) => signature.status === "pending").length,
    blocked: submission.signatures.filter((signature) => signature.status === "blocked").length,
  };
}
