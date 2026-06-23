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
  Languages,
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
  | "rules"
  | "users"
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
      { id: "rules", label: "Rules", icon: Library },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users", label: "User Management", icon: UsersRound },
    ],
  },
];

const pageLabels: Record<Page, { group: string; page: string }> = {
  dashboard: { group: "Project review", page: "Overview" },
  submissions: { group: "Project review", page: "Submissions" },
  rules: { group: "Project review", page: "Rules" },
  users: { group: "Admin", page: "User Management" },
  settings: { group: "Admin", page: "Settings" },
};

const initialUsers: TtrtUser[] = [
  { id: "u-mehdi", name: "Mehdi Sargeane", email: "mehdi.sargeane@origen.ae", role: "Platform admin", scope: "Configuration", status: "Active" },
  { id: "u-abdulqader", name: "Abdulqader Ahmed", email: "abdulqader.ahmed@itc.gov.ae", role: "TTRT lead", scope: "All submissions", status: "Active" },
  { id: "u-zain", name: "Zain Abdulnaser Al Zubaidi", email: "zain.alzubaidi@itc.gov.ae", role: "Project manager", scope: "Aviation submissions", status: "Active" },
  { id: "u-hussein", name: "Hussein Elhadi", email: "hussein.elhadi@itc.gov.ae", role: "Technical reviewer", scope: "Strategy and Governance", status: "Active" },
  { id: "u-mohammad-almasoud", name: "Mohammad Almasoud", email: "mohammad.almasoud@itc.gov.ae", role: "Technical reviewer", scope: "Procurement and finance", status: "Active" },
  { id: "u-rashid", name: "Rashid Al Naqbi", email: "rashid.alnaqbi@itc.gov.ae", role: "TTRT member", scope: "Final review", status: "Active" },
  { id: "u-mohammed-shalwani", name: "Mohammed Shalwani", email: "mohammed.shalwani@itc.gov.ae", role: "TTRT member", scope: "Final review", status: "Active" },
  { id: "u-mohamed-adnan", name: "Mohamed Adnan", email: "mohamed.adnan@itc.gov.ae", role: "Coordinator", scope: "Screening and circulation", status: "Active" },
  { id: "u-hadi", name: "Hadi Jammal", email: "hadi.jammal@itc.gov.ae", role: "Technical reviewer", scope: "Traffic systems", status: "Active" },
  { id: "u-ghassan", name: "Ghassan Abazid", email: "ghassan.abazid@itc.gov.ae", role: "Technical reviewer", scope: "Enterprise architecture", status: "Active" },
  { id: "u-hasanul", name: "Hasanul Banna", email: "hasanul.banna@itc.gov.ae", role: "Technical reviewer", scope: "Signal systems", status: "Active" },
  { id: "u-surendra", name: "Surendra Sharma", email: "surendra.sharma@itc.gov.ae", role: "Technical reviewer", scope: "Network services", status: "Active" },
  { id: "u-nuha", name: "Nuha AlBusaeed", email: "nuha.albussaeed@itc.gov.ae", role: "Technical reviewer", scope: "Road safety", status: "Active" },
  { id: "u-hamad", name: "HE. Hamad Alafeefi", email: "hamad.alafeefi@itc.gov.ae", role: "Executive approver", scope: "Executive Director approval", status: "Active" },
];

const isEmbedded = new URLSearchParams(window.location.search).get("embed") === "1";
const explicitAiEndpoint = (import.meta.env.VITE_TTRT_AI_ENDPOINT as string | undefined)?.trim();
const mobilityAiEndpoint = (import.meta.env.VITE_MOBILITY_AI_AGENT_ENDPOINT as string | undefined)?.trim();
const aiEndpoint = explicitAiEndpoint || mobilityAiEndpoint;
const aiProvider = ((import.meta.env.VITE_TTRT_AI_PROVIDER as string | undefined)?.trim() || "anthropic") as "anthropic" | "openai";

const storageKeys = {
  submissions: "ttrt.submissions.v2",
  files: "ttrt.files.v2",
  users: "ttrt.users.v2",
  notifications: "ttrt.notifications.v2",
  rules: "ttrt.rules.v2",
  currentUser: "ttrt.currentUser.v1",
  language: "ttrt.language.v1",
};

type TtrtLanguage = "en" | "ar";

const ttrtOriginalText = new WeakMap<Text, string>();
const i18nAttributes = ["aria-label", "title", "placeholder", "alt"] as const;

const ar: Record<string, string> = {
  "Project review": "مراجعة المشاريع",
  Overview: "نظرة عامة",
  Submissions: "الطلبات",
  Rules: "القواعد",
  Admin: "الإدارة",
  "User Management": "إدارة المستخدمين",
  Settings: "الإعدادات",
  "Open overview": "فتح النظرة العامة",
  "Collapse sidebar": "طي القائمة الجانبية",
  "Open TTRT navigation": "فتح قائمة TTRT",
  "Hide TTRT navigation": "إخفاء قائمة TTRT",
  "Ask TTRT...": "اسأل TTRT...",
  "Ctrl K": "Ctrl K",
  "Search submissions, reviewers, sectors...": "ابحث في الطلبات والمراجعين والقطاعات...",
  "Mobility AI": "Mobility AI",
  "View TTRT as": "عرض TTRT باسم",
  Notifications: "الإشعارات",
  Arabic: "العربية",
  English: "الإنجليزية",
  "Switch to Arabic": "التبديل إلى العربية",
  "Switch to English": "التبديل إلى الإنجليزية",
  "Sign out": "تسجيل الخروج",
  Close: "إغلاق",
  "Close ask panel": "إغلاق لوحة السؤال",
  "Submit project": "إرسال مشروع",
  "New TTRT project submission": "طلب مشروع TTRT جديد",
  "Project name": "اسم المشروع",
  "Project type": "نوع المشروع",
  "Manager email": "بريد المدير الإلكتروني",
  Sector: "القطاع",
  "Division / section": "الإدارة / القسم",
  Division: "الإدارة",
  Budget: "الميزانية",
  "Start date": "تاريخ البدء",
  "End date": "تاريخ الانتهاء",
  "Scope of work": "نطاق العمل",
  "Development of...": "تطوير...",
  Name: "الاسم",
  "name@itc.gov.ae": "name@itc.gov.ae",
  "Aviation, ITS, Road Safety...": "الطيران، أنظمة النقل الذكية، السلامة المرورية...",
  "Development of the Abu Dhabi Civil Aviation Strategy (2027 to 2031)": "تطوير استراتيجية الطيران المدني لإمارة أبوظبي (2027 إلى 2031)",
  "Civil Aviation Strategy": "استراتيجية الطيران المدني",
  "Strategy and Governance": "الاستراتيجية والحوكمة",
  "50M": "50 مليون",
  "Briefly describe the project objective, scope, and expected outputs.": "اكتب بإيجاز هدف المشروع ونطاقه والمخرجات المتوقعة.",
  "Upload TTRT sheet and supporting package": "تحميل نموذج TTRT وحزمة المستندات الداعمة",
  "DOCX, PDF, Excel, DWG, or ZIP. Files are attached to the submitted project record.": "DOCX أو PDF أو Excel أو DWG أو ZIP. يتم ربط الملفات بسجل المشروع المقدم.",
  Cancel: "إلغاء",
  "Ask TTRT": "اسأل TTRT",
  "TTRT - Ask anything": "TTRT - اسأل أي شيء",
  "Ask across submissions, evidence gaps, signatures, comments, SLA, and next actions.": "اسأل عن الطلبات، فجوات الأدلة، التوقيعات، التعليقات، اتفاقيات مستوى الخدمة، والخطوات التالية.",
  "Ask about late submissions, missing files, pending signatures...": "اسأل عن الطلبات المتأخرة، الملفات الناقصة، التوقيعات المعلقة...",
  "Thinking...": "جار التفكير...",
  Ask: "اسأل",
  "What needs follow-up today?": "ما الذي يحتاج إلى متابعة اليوم؟",
  "Which submissions have missing evidence?": "ما الطلبات التي لديها أدلة ناقصة؟",
  "Who still needs to sign?": "من لا يزال بحاجة إلى التوقيع؟",
  "Summarize the active TTRT projects": "لخص مشاريع TTRT النشطة",
  "TTRT answer": "إجابة TTRT",
  "Open related submission": "فتح الطلب المرتبط",
  "Project alerts": "تنبيهات المشروع",
  "No notifications yet": "لا توجد إشعارات بعد",
  "Submit a project to generate the first stakeholder alert.": "أرسل مشروعاً لإنشاء أول تنبيه لأصحاب المصلحة.",
  Recipients: "المستلمون",
  "Sign in": "تسجيل الدخول",
  "TTRT Review Cockpit": "لوحة مراجعة TTRT",
  Email: "البريد الإلكتروني",
  Password: "كلمة المرور",
  Tenant: "المستأجر",
  "Built by Origen for ITC": "تم بناؤه بواسطة Origen لصالح ITC",
  "TTRT overview": "نظرة عامة على TTRT",
  "Project review without circulation delays": "مراجعة المشاريع دون تأخير في التعميم",
  "Track submitted projects, see exactly where each package sits in the process, and surface only the actions owned by the logged-in role.": "تتبع المشاريع المقدمة، واعرف موقع كل حزمة في العملية، واعرض فقط الإجراءات الخاصة بدور المستخدم الحالي.",
  "Open submissions": "فتح الطلبات",
  "Latest TTRT submissions": "أحدث طلبات TTRT",
  "Review health": "مؤشرات صحة المراجعة",
  "Active submissions": "الطلبات النشطة",
  "My action queue": "قائمة إجراءاتي",
  "Due / evidence risk": "مخاطر الموعد / الأدلة",
  "Pending signatures": "التوقيعات المعلقة",
  "ED / TTRT signatures before release": "توقيعات المدير التنفيذي / TTRT قبل الإصدار",
  "Committee decision split": "توزيع قرارات اللجنة",
  "Decision mix": "مزيج القرارات",
  items: "عناصر",
  Approved: "معتمد",
  "Approved with comments": "معتمد مع تعليقات",
  "Pending / waiting": "معلق / قيد الانتظار",
  Rejected: "مرفوض",
  "Reviewer action queue": "قائمة إجراءات المراجع",
  "Where your action is required": "أين يلزم تدخلك",
  "View all": "عرض الكل",
  "No assigned action right now": "لا يوجد إجراء مسند حالياً",
  "Your action": "إجراء مطلوب منك",
  Queue: "القائمة",
  All: "الكل",
  "for": "لـ",
  submissions: "طلبات",
  "Submission decision workspace": "مساحة قرار الطلب",
  "Select a project package and see the executive decision brief first. Operational evidence remains available when needed.": "اختر حزمة مشروع واطلع أولاً على ملخص القرار التنفيذي. تبقى الأدلة التشغيلية متاحة عند الحاجة.",
  "Close edit": "إغلاق التعديل",
  "Modify project": "تعديل المشروع",
  "Operational package details": "تفاصيل الحزمة التشغيلية",
  "Form, scope, comments, documents, signatures, and input checks": "النموذج، النطاق، التعليقات، المستندات، التوقيعات، وفحوصات الإدخال",
  "Sector / division": "القطاع / الإدارة",
  Duration: "المدة",
  Bottleneck: "العائق",
  "Project comments": "تعليقات المشروع",
  "Comments stay attached to this project package and feed the consolidated recommendation.": "تبقى التعليقات مرتبطة بحزمة المشروع وتغذي التوصية الموحدة.",
  "Leave a comment, clarification, reviewer note, or condition for this project...": "اترك تعليقاً أو توضيحاً أو ملاحظة مراجع أو شرطاً لهذا المشروع...",
  "Add comment": "إضافة تعليق",
  "No comments yet": "لا توجد تعليقات بعد",
  "Add the first project comment from here. It will stay attached to this project history.": "أضف أول تعليق للمشروع من هنا. سيبقى مرتبطاً بسجل هذا المشروع.",
  Resolve: "حل",
  "Carry condition": "ترحيل الشرط",
  "Signature chain": "سلسلة التوقيعات",
  "Signatures stay attached to the selected project package and drive final release.": "تبقى التوقيعات مرتبطة بحزمة المشروع المختارة وتدعم الإصدار النهائي.",
  "Input checks": "فحوصات الإدخال",
  "AI recommendation": "توصية الذكاء الاصطناعي",
  "AI recommendation for All TTRT divisions": "توصية الذكاء الاصطناعي لجميع إدارات TTRT",
  "All TTRT divisions review required": "مراجعة جميع إدارات TTRT مطلوبة",
  "All TTRT divisions": "جميع إدارات TTRT",
  "Review this package from the All TTRT divisions perspective. The AI found 1 evidence gap, 2 pending signatures, and no uploaded files yet.": "راجع هذه الحزمة من منظور جميع إدارات TTRT. وجد الذكاء الاصطناعي فجوة أدلة واحدة وتوقيعين معلقين ولا توجد ملفات مرفوعة حتى الآن.",
  Evidence: "الأدلة",
  Signatures: "التوقيعات",
  "Reviewer input": "إدخال المراجع",
  "At this stage, this role records its division review. Final approval or rejection stays with the authorized decision roles.": "في هذه المرحلة، يسجل هذا الدور مراجعة إدارته. يبقى الاعتماد النهائي أو الرفض لدى الأدوار المخولة.",
  "AI pick": "اختيار الذكاء الاصطناعي",
  "Approve recommendation": "اعتماد التوصية",
  "Conditional approval": "اعتماد مشروط",
  "Return to PM": "إرجاع إلى مدير المشروع",
  "Missing or weak evidence should be corrected before consuming more reviewer time.": "ينبغي تصحيح الأدلة الناقصة أو الضعيفة قبل استهلاك المزيد من وقت المراجعين.",
  Approve: "اعتماد",
  Reject: "رفض",
  "Project details updated from the project workspace.": "تم تحديث تفاصيل المشروع من مساحة عمل المشروع.",
  "Project manager": "مدير المشروع",
  "Submitted on": "تاريخ التقديم",
  "Due on": "تاريخ الاستحقاق",
  "Budget / estimate": "الميزانية / التقدير",
  Priority: "الأولوية",
  "Review round": "جولة المراجعة",
  Stage: "المرحلة",
  Decision: "القرار",
  "Next action": "الإجراء التالي",
  "Save changes": "حفظ التغييرات",
  Documents: "المستندات",
  "Upload and download TTRT project packages": "تحميل وتنزيل حزم مشاريع TTRT",
  "Keep the original sheet, supporting evidence, revised submissions, and final TTRT report attached to the project record.": "احتفظ بالنموذج الأصلي والأدلة الداعمة والطلبات المعدلة وتقرير TTRT النهائي ضمن سجل المشروع.",
  "Project packages": "حزم المشاريع",
  "Document package": "حزمة المستندات",
  "Submitted documents": "المستندات المقدمة",
  Upload: "تحميل",
  "Expected in package": "المتوقع في الحزمة",
  "Uploaded files": "الملفات المحملة",
  "No files uploaded yet": "لم يتم تحميل ملفات بعد",
  "Upload the TTRT sheet or supporting files, then reviewers can download them from this panel.": "حمّل نموذج TTRT أو الملفات الداعمة، وبعدها يمكن للمراجعين تنزيلها من هذه اللوحة.",
  Download: "تنزيل",
  Remove: "إزالة",
  "Review Board": "لوحة المراجعة",
  "Technical comments are consolidated before PM response": "يتم توحيد التعليقات الفنية قبل رد مدير المشروع",
  "The coordinator sees who commented, what remains open, and whether each comment is resolved or carried into conditions.": "يرى المنسق من علّق، وما لا يزال مفتوحاً، وما إذا كان كل تعليق قد حُل أو تم ترحيله كشرط.",
  "Projects in review": "مشاريع قيد المراجعة",
  "Consolidated recommendation": "التوصية الموحدة",
  "Signature chain and ED release tracker": "سلسلة التوقيع وتتبع إصدار المدير التنفيذي",
  "The app shows who must sign, who is late, and which package is ready for Executive Director approval.": "يعرض التطبيق من يجب أن يوقع، ومن تأخر، وأي حزمة جاهزة لاعتماد المدير التنفيذي.",
  Packages: "الحزم",
  "Submission timeline": "الجدول الزمني للطلب",
  "Business requirements that drive checks and alerts": "متطلبات الأعمال التي تقود الفحوصات والتنبيهات",
  "Rules stay readable for coordinators: each one says what must be true, what the app should automate, and who owns it.": "تبقى القواعد واضحة للمنسقين: كل قاعدة توضح ما يجب تحققه، وما ينبغي أتمتته، ومن يملكها.",
  "Save rules": "حفظ القواعد",
  Requirement: "المتطلب",
  Automation: "الأتمتة",
  Owner: "المالك",
  Active: "نشط",
  Paused: "متوقف مؤقتاً",
  Reports: "التقارير",
  "Generate the right document from the selected project": "إنشاء المستند المناسب من المشروع المختار",
  "Outputs stay controlled: internal report, PM clarification, signature reminder, and weekly latency view.": "تبقى المخرجات مضبوطة: تقرير داخلي، توضيح لمدير المشروع، تذكير بالتوقيع، وعرض أسبوعي للتأخير.",
  Generate: "إنشاء",
  "Selected submission": "الطلب المحدد",
  "Open project": "فتح المشروع",
  "User management": "إدارة المستخدمين",
  "Control who can access TTRT reviews": "التحكم بمن يستطيع الوصول إلى مراجعات TTRT",
  "Manage coordinators, technical reviewers, supervisors, and read-only users without exposing the technical platform layer.": "إدارة المنسقين والمراجعين الفنيين والمشرفين ومستخدمي القراءة فقط دون كشف طبقة المنصة التقنية.",
  "Add user": "إضافة مستخدم",
  User: "المستخدم",
  Role: "الدور",
  "Division / lens": "الإدارة / منظور المراجعة",
  Status: "الحالة",
  "Division / review lens": "الإدارة / منظور المراجعة",
  "Profile and notifications": "الملف الشخصي والإشعارات",
  "Notification defaults for TTRT coordinators, reviewers, PMs, and supervisors.": "إعدادات الإشعارات الافتراضية لمنسقي TTRT والمراجعين ومديري المشاريع والمشرفين.",
  "Notification mode": "وضع الإشعارات",
  "Email + in-app": "البريد الإلكتروني + داخل التطبيق",
  "Default landing": "صفحة الدخول الافتراضية",
  "Business review workspace": "مساحة مراجعة الأعمال",
  "Stage load": "توزيع المراحل",
  "Where work sits now": "أين يوجد العمل الآن",
  "Monthly pace": "الإيقاع الشهري",
  "Submission pace trend": "اتجاه وتيرة الطلبات",
  "this month": "هذا الشهر",
  "average target window": "متوسط نافذة الهدف",
  "New Tender": "مناقصة جديدة",
  "Tender Renewal": "تجديد مناقصة",
  Variation: "تغيير",
  "Direct Awarding": "إسناد مباشر",
  Other: "أخرى",
  Normal: "عادي",
  High: "مرتفع",
  Critical: "حرج",
  Pending: "معلق",
  "Initial Review": "المراجعة الأولية",
  "2nd Review": "المراجعة الثانية",
  "Final Review": "المراجعة النهائية",
  "Initial screening": "الفحص الأولي",
  "Project Submission": "تقديم المشروع",
  "Initial Screening": "الفحص الأولي",
  "Returned to PM": "أعيد إلى مدير المشروع",
  "Technical review": "المراجعة الفنية",
  "Technical Review": "المراجعة الفنية",
  "Comment Consolidation": "توحيد التعليقات",
  "PM response": "رد مدير المشروع",
  "PM Response": "رد مدير المشروع",
  Response: "الرد",
  "Final recommendation": "التوصية النهائية",
  "Final Recommendation": "التوصية النهائية",
  "Executive approval": "اعتماد المدير التنفيذي",
  "ED Approval": "اعتماد المدير التنفيذي",
  "Closure & Archive": "الإغلاق والأرشفة",
  Released: "تم الإصدار",
  signed: "موقع",
  pending: "معلق",
  blocked: "محظور",
  awaiting: "بانتظار",
  resolved: "محلول",
  open: "مفتوح",
  approvedWithComments: "معتمد مع تعليقات",
  pass: "ناجح",
  warning: "تحذير",
  fail: "فشل",
  "Project submission": "تقديم المشروع",
  "Collect comments": "جمع التعليقات",
  "ED approval": "اعتماد المدير التنفيذي",
  "Review updated submission": "مراجعة الطلب المحدث",
  "TTRT lead": "قائد TTRT",
  "TTRT member": "عضو TTRT",
  Coordinator: "منسق",
  "Technical reviewer": "مراجع فني",
  "Executive approver": "معتمد تنفيذي",
  "Read-only viewer": "مستخدم قراءة فقط",
  "Platform admin": "مسؤول المنصة",
  "AI/V2X reviewer": "مراجع AI/V2X",
  "Traffic systems": "أنظمة المرور",
  "Enterprise architecture": "البنية المؤسسية",
  "Signal systems": "أنظمة الإشارات",
  "Network services": "خدمات الشبكة",
  "Road safety": "السلامة المرورية",
  "Executive Director": "المدير التنفيذي",
  Aviation: "الطيران",
  ITS: "أنظمة النقل الذكية",
  "Road Safety": "السلامة المرورية",
  "AI/V2X": "AI/V2X",
  "ITS Deployment": "نشر أنظمة النقل الذكية",
  "All submissions": "كل الطلبات",
  "Aviation submissions": "طلبات الطيران",
  "checks passed": "فحوصات ناجحة",
  "gaps or warnings": "فجوات أو تحذيرات",
  Configuration: "الإعداد",
  "Assigned division": "الإدارة المسندة",
  "Final review": "المراجعة النهائية",
  "Screening and circulation": "الفحص والتعميم",
  "Procurement and finance": "المشتريات والمالية",
  "Executive Director approval": "اعتماد المدير التنفيذي",
  "TTRT reviewer": "مراجع TTRT",
  "PM": "مدير المشروع",
  "TTRT coordinator": "منسق TTRT",
  "TTRT members": "أعضاء TTRT",
  today: "اليوم",
  "same day": "نفس اليوم",
  done: "منجز",
  current: "حالي",
  next: "التالي",
  closed: "مغلق",
  "awaiting PM": "بانتظار مدير المشروع",
  "N/A": "غير متاح",
  None: "لا يوجد",
};

const arReplacements: Array<[RegExp, string | ((...args: string[]) => string)]> = [
  [/^Required for (.+)$/u, (_match, type) => `مطلوب لـ ${translateTtrtCore(type)}`],
  [/^AI recommendation for (.+)$/u, (_match, lens) => `توصية الذكاء الاصطناعي لـ ${translateTtrtCore(lens)}`],
  [/^(.+) review required$/u, (_match, lens) => `مراجعة ${translateTtrtCore(lens)} مطلوبة`],
  [
    /^Review this package from the (.+) perspective\. The AI found (\d+) evidence gap, (\d+) pending signatures, and no uploaded files yet\.$/u,
    (_match, lens, gaps, signatures) =>
      `راجع هذه الحزمة من منظور ${translateTtrtCore(lens)}. وجد الذكاء الاصطناعي ${gaps} فجوات أدلة و${signatures} توقيعات معلقة ولا توجد ملفات مرفوعة حتى الآن.`,
  ],
  [
    /^Review this package from the (.+) perspective\. The AI found (\d+) evidence gaps, (\d+) pending signatures, and no uploaded files yet\.$/u,
    (_match, lens, gaps, signatures) =>
      `راجع هذه الحزمة من منظور ${translateTtrtCore(lens)}. وجد الذكاء الاصطناعي ${gaps} فجوات أدلة و${signatures} توقيعات معلقة ولا توجد ملفات مرفوعة حتى الآن.`,
  ],
  [/^(\d+) unread$/u, (_match, count) => `${count} غير مقروءة`],
  [/^(\d+) submission$/u, (_match, count) => (count === "1" ? "طلب واحد" : `${count} طلب`)],
  [/^(\d+) submissions$/u, (_match, count) => (count === "1" ? "طلب واحد" : `${count} طلبات`)],
  [/^(\d+) total packages$/u, (_match, count) => `${count} حزم إجمالية`],
  [/^(\d+) packages visible in the queue$/u, (_match, count) => `${count} حزم ظاهرة في القائمة`],
  [/^(\d+) overdue, (\d+) evidence gaps$/u, (_match, overdue, gaps) => `${overdue} متأخرة، ${gaps} فجوات أدلة`],
  [/^(\d+)\/(\d+) checks passed$/u, (_match, pass, total) => `${pass}/${total} فحوصات ناجحة`],
  [/^(\d+) checks passed$/u, (_match, count) => `${count} فحوصات ناجحة`],
  [/^(\d+) gaps or warnings$/u, (_match, count) => (count === "1" ? "فجوة أو تحذير واحد" : `${count} فجوات أو تحذيرات`)],
  [/^(\d+) pending$/u, (_match, count) => `${count} معلقة`],
  [/^(\d+) signed$/u, (_match, count) => `${count} موقعة`],
  [/^(\d+) needs attention$/u, (_match, count) => `${count} يحتاج إلى انتباه`],
  [/^(\d+) comments$/u, (_match, count) => `${count} تعليقات`],
  [/^(\d+) files$/u, (_match, count) => `${count} ملفات`],
  [/^(\d+)% complete$/u, (_match, percent) => `${percent}% مكتمل`],
  [/^(\d+) this month$/u, (_match, count) => `${count} هذا الشهر`],
  [/^(\d+)d average target window$/u, (_match, days) => `${days} أيام متوسط نافذة الهدف`],
  [/^Due (.+)$/u, (_match, due) => `مستحق ${due}`],
  [/^Write (.+) comment\.\.\.$/u, (_match, lens) => `اكتب تعليق ${translateTtrtCore(lens)}...`],
  [/^Recipients: (.+)$/u, (_match, recipients) => `المستلمون: ${recipients}`],
];

function translateTtrtCore(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return value;
  if (ar[compact]) return ar[compact];
  for (const [pattern, replacement] of arReplacements) {
    const match = compact.match(pattern);
    if (match) {
      return typeof replacement === "function"
        ? replacement(...match)
        : compact.replace(pattern, replacement);
    }
  }
  let translated = compact;
  Object.entries(ar)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([english, arabic]) => {
      const source = escapeRegExp(english);
      const pattern = english.length <= 3 && /^[A-Za-z]+$/u.test(english)
        ? new RegExp(`\\b${source}\\b`, "g")
        : new RegExp(source, "g");
      translated = translated.replace(pattern, arabic);
    });
  return translated;
}

function translateTtrtText(value: string, lang: TtrtLanguage): string {
  if (lang === "en") return value;
  const leading = value.match(/^\s*/u)?.[0] ?? "";
  const trailing = value.match(/\s*$/u)?.[0] ?? "";
  const body = value.trim();
  if (!body) return value;
  return `${leading}${translateTtrtCore(body)}${trailing}`;
}

function applyTtrtLanguage(lang: TtrtLanguage) {
  const root = document.getElementById("root");
  if (!root) return;
  const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) return window.NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-i18n-skip]")) return window.NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(parent.tagName)) return window.NodeFilter.FILTER_REJECT;
      return window.NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  textNodes.forEach((node) => {
    const original = ttrtOriginalText.get(node) ?? node.nodeValue ?? "";
    if (!ttrtOriginalText.has(node)) ttrtOriginalText.set(node, original);
    const next = translateTtrtText(original, lang);
    if (node.nodeValue !== next) node.nodeValue = next;
  });

  root.querySelectorAll<HTMLElement>(i18nAttributes.map((attr) => `[${attr}]`).join(",")).forEach((element) => {
    i18nAttributes.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) return;
      const originalAttr = `data-i18n-original-${attr}`;
      const original = element.getAttribute(originalAttr) ?? value;
      if (!element.hasAttribute(originalAttr)) element.setAttribute(originalAttr, original);
      element.setAttribute(attr, translateTtrtText(original, lang));
    });
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function divisionReviewLens(user: TtrtUser) {
  if (user.role === "Platform admin" || user.role === "TTRT lead") return "All TTRT divisions";
  if (user.role === "Executive approver") return "Executive decision";
  return user.scope || user.role;
}

function divisionKeywords(value: string) {
  return normalizeForMatch(value)
    .split(" ")
    .filter((token) => token.length > 2 && !["and", "the", "for", "all", "its", "ttrt", "review", "reviews", "submissions"].includes(token));
}

function userMatchesName(user: TtrtUser, name: string) {
  const userName = normalizeName(user.name);
  const target = normalizeName(name);
  return userName === target || userName.includes(target) || target.includes(userName);
}

function userRoleIs(user: TtrtUser, roles: string[]) {
  return roles.includes(user.role);
}

function userOwnsProject(user: TtrtUser, submission: Submission) {
  return user.role === "Project manager" && userMatchesName(user, submission.manager);
}

function submissionSearchText(submission: Submission) {
  return normalizeForMatch([
    submission.name,
    submission.sector,
    submission.division,
    submission.scope,
    submission.submittedDocuments.join(" "),
    submission.documents.map((document) => `${document.name} ${document.note}`).join(" "),
    submission.comments.map((comment) => `${comment.role} ${comment.comment}`).join(" "),
    submission.signatures.map((signature) => signature.role).join(" "),
  ].join(" "));
}

function userDivisionMatchesSubmission(user: TtrtUser, submission: Submission) {
  if (userRoleIs(user, ["Platform admin", "TTRT lead", "Coordinator"])) return true;
  if (userOwnsProject(user, submission)) return true;
  if (submission.signatures.some((signature) => signature.status === "pending" && userMatchesName(user, signature.name))) return true;
  if (submission.comments.some((comment) => comment.state !== "resolved" && userMatchesName(user, comment.reviewer))) return true;
  if (!userRoleIs(user, ["Technical reviewer", "TTRT member"])) return false;

  const keywords = divisionKeywords(divisionReviewLens(user));
  if (!keywords.length) return false;
  const haystack = submissionSearchText(submission);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function divisionAiRecommendation(submission: Submission, user: TtrtUser, files: ProjectFile[]) {
  const lens = divisionReviewLens(user);
  const lowerLens = normalizeForMatch(lens);
  const evidence = requirementCounts(submission);
  const signatures = signatureCounts(submission);
  const gaps = evidence.fail + evidence.warning;
  const filePhrase = files.length ? `${files.length} uploaded file${files.length === 1 ? "" : "s"}` : "no uploaded files yet";

  if (userOwnsProject(user, submission)) {
    return {
      title: gaps > 0 ? "PM correction package required" : "PM response is ready to submit",
      summary: gaps > 0
        ? `From the project manager view, close ${gaps} evidence gap${gaps === 1 ? "" : "s"} and attach the corrected package before returning it to TTRT. The current record has ${filePhrase}.`
        : `From the project manager view, the evidence package is clean enough to resubmit. Keep the response focused on TTRT comments and uploaded evidence.`,
      focus: "PM response and evidence closure",
      recommendedAction: gaps > 0 ? "Return corrected evidence" : "Resubmit to TTRT",
    };
  }

  if (user.role === "Coordinator") {
    return {
      title: gaps > 0 ? "Coordinate return or targeted circulation" : "Ready for division circulation",
      summary: gaps > 0
        ? `The coordinator should decide whether the ${gaps} evidence gap${gaps === 1 ? "" : "s"} can be clarified during circulation or should be returned before consuming reviewer time.`
        : `The package can be circulated to the relevant divisions. Track comments by owner and consolidate them into one PM-facing response.`,
      focus: "Completeness, routing, and consolidation",
      recommendedAction: gaps > 0 ? "Screen before circulation" : "Circulate to reviewers",
    };
  }

  if (user.role === "Executive approver") {
    return {
      title: signatures.pending > 0 ? "Not ready for executive signature" : "Executive decision package is ready",
      summary: signatures.pending > 0
        ? `The executive view should wait for ${signatures.pending} pending signature${signatures.pending === 1 ? "" : "s"} before final approval. Focus only on decision, conditions, and residual risk.`
        : `The signature chain is complete enough for executive decision. Review the recommendation, residual conditions, and audit trail before release.`,
      focus: "Decision readiness",
      recommendedAction: signatures.pending > 0 ? "Wait for signatures" : submission.decision,
    };
  }

  if (lowerLens.includes("network")) {
    return {
      title: "Network services review required",
      summary: `Review resilience, backhaul ownership, redundancy, cybersecurity connectivity, and operational support. For ${submission.code}, the AI recommends confirming network ownership before approval.`,
      focus: "Connectivity, redundancy, operations support",
      recommendedAction: "Approve with network conditions",
    };
  }

  if (lowerLens.includes("signal")) {
    return {
      title: "Signal systems review required",
      summary: `Check signal controller interfaces, phasing impact, pedestrian timing, loop/cabinet conflicts, and integration with existing signal assets before clearing this package.`,
      focus: "Signal compatibility and safety",
      recommendedAction: "Approve with signal comments",
    };
  }

  if (lowerLens.includes("road") || lowerLens.includes("safety")) {
    return {
      title: "Road safety review required",
      summary: `Evaluate conflict points, user safety, construction staging, operational disruption, and whether proposed mitigation is measurable before the recommendation is finalized.`,
      focus: "Safety risk and mitigation evidence",
      recommendedAction: "Carry safety conditions",
    };
  }

  if (lowerLens.includes("architecture") || lowerLens.includes("enterprise")) {
    return {
      title: "Architecture review required",
      summary: `Validate system interfaces, data ownership, integration pattern, cyber controls, and whether the proposal fits the Abu Dhabi Mobility enterprise architecture. Current package has ${filePhrase}.`,
      focus: "Architecture fit and integration controls",
      recommendedAction: "Approve with architecture conditions",
    };
  }

  if (lowerLens.includes("finance") || lowerLens.includes("procurement")) {
    return {
      title: "Finance and procurement review required",
      summary: `Review procurement route, cost justification, budget availability, contract implications, and whether the proposed decision path is defensible for audit.`,
      focus: "Budget, procurement, commercial risk",
      recommendedAction: "Validate commercial justification",
    };
  }

  if (lowerLens.includes("strategy") || lowerLens.includes("governance")) {
    return {
      title: "Strategy and governance review required",
      summary: `Check alignment with ITC strategic objectives, governance ownership, policy dependencies, and whether the recommendation is explicit enough for executive sign-off.`,
      focus: "Strategic alignment and governance",
      recommendedAction: submission.decision === "Pending" ? "Approve with governance comments" : submission.decision,
    };
  }

  if (lowerLens.includes("v2x") || lowerLens.includes("traffic") || lowerLens.includes("operations")) {
    return {
      title: "Operational ITS review required",
      summary: `Assess operational impact, standards fit, handover readiness, traffic-network dependencies, and whether reviewer comments can be consolidated without another PM loop.`,
      focus: "ITS operations and technical readiness",
      recommendedAction: gaps > 0 ? "Return targeted comments" : "Approve with technical comments",
    };
  }

  return {
    title: `${lens} review required`,
    summary: `Review this package from the ${lens} perspective. The AI found ${gaps} evidence gap${gaps === 1 ? "" : "s"}, ${signatures.pending} pending signature${signatures.pending === 1 ? "" : "s"}, and ${filePhrase}.`,
    focus: lens,
    recommendedAction: submission.decision === "Pending" ? selectedRecommendedAction(submission, gaps) : submission.decision,
  };
}

function selectedRecommendedAction(submission: Submission, gaps: number) {
  if (gaps > 0) return "Return to PM";
  if (submission.priority === "Critical") return "Approve with conditions";
  return "Approve";
}

type TtrtDecisionAction = "approve" | "conditional" | "return" | "reject";

type TtrtAiPick = {
  kind: TtrtDecisionAction | "comment";
  label: string;
  helper: string;
};

function canRecordTtrtDecision(user: TtrtUser) {
  return userRoleIs(user, ["Platform admin", "TTRT lead", "Coordinator", "Executive approver"]);
}

function canRejectSubmission(user: TtrtUser) {
  return user.role === "Executive approver";
}

function ttrtAiPick(
  submission: Submission,
  user: TtrtUser,
  requirementSummary: ReturnType<typeof requirementCounts>,
  signatureSummary: ReturnType<typeof signatureCounts>,
  openComments: number,
): TtrtAiPick {
  const evidenceIssues = requirementSummary.fail + requirementSummary.warning;

  if (!canRecordTtrtDecision(user)) {
    return {
      kind: "comment",
      label: "Add division comment",
      helper: `Capture the ${divisionReviewLens(user)} review input for consolidation.`,
    };
  }

  if (user.role === "Executive approver") {
    if (signatureSummary.pending > 0 || openComments > 0) {
      return {
        kind: "conditional",
        label: "Conditional approval",
        helper: "Executive can approve with explicit conditions while residual items are closed.",
      };
    }
    return {
      kind: "approve",
      label: "Approve",
      helper: "The package is ready for executive decision and release.",
    };
  }

  if (evidenceIssues > 0) {
    return {
      kind: "return",
      label: "Return to PM",
      helper: "Missing or weak evidence should be corrected before consuming more reviewer time.",
    };
  }

  return {
    kind: submission.priority === "Critical" ? "conditional" : "approve",
    label: submission.priority === "Critical" ? "Conditional approval" : "Approve",
    helper: "Record the TTRT recommendation and move the package toward executive approval.",
  };
}

function stageRecipientsLabel(submission: Submission, users: TtrtUser[]) {
  const recipients = recipientsForStage(submission, users);
  if (!recipients.length) return "the responsible TTRT users";
  if (recipients.length <= 2) return recipients.join(" and ");
  return `${recipients.slice(0, 2).join(", ")} and ${recipients.length - 2} others`;
}

const defaultDivisionByUserId: Record<string, string> = {
  "u-hussein": "Strategy and Governance",
  "u-mohammad-almasoud": "Procurement and finance",
  "u-hadi": "Traffic systems",
  "u-ghassan": "Enterprise architecture",
  "u-hasanul": "Signal systems",
  "u-surendra": "Network services",
  "u-nuha": "Road safety",
  "u-abdulqader": "All submissions",
};

function migrateUsersToDivisionLens(storedUsers: TtrtUser[]) {
  return storedUsers.map((user) => {
    const migratedScope = defaultDivisionByUserId[user.id];
    if (!migratedScope) return user;
    if (user.scope === "TTRT comments" || user.scope === "Operations and ITS" || user.scope === "Assigned submissions") {
      return { ...user, scope: migratedScope };
    }
    return user;
  });
}

function activeUsers(users: TtrtUser[]) {
  return users.filter((user) => user.status === "Active");
}

function recipientsForStage(submission: Submission, users: TtrtUser[]) {
  const active = activeUsers(users);
  const byRole = (roles: string[]) => active.filter((user) => roles.includes(user.role)).map((user) => user.name);
  const byPerson = active.filter((user) =>
    userMatchesName(user, submission.manager) ||
    submission.signatures.some((signature) => signature.status === "pending" && userMatchesName(user, signature.name)) ||
    submission.comments.some((comment) => comment.state !== "resolved" && userMatchesName(user, comment.reviewer)),
  ).map((user) => user.name);

  const recipients =
    submission.stage === "Initial screening"
      ? byRole(["Coordinator", "TTRT lead", "Platform admin"])
      : submission.stage === "Returned to PM" || submission.stage === "PM response"
        ? [...byPerson, ...byRole(["Coordinator", "TTRT lead"])]
        : submission.stage === "Technical review"
          ? [...byPerson, ...byRole(["Technical reviewer", "TTRT member", "Coordinator", "TTRT lead"])]
          : submission.stage === "Final recommendation"
            ? [...byPerson, ...byRole(["Coordinator", "TTRT lead", "TTRT member"])]
            : submission.stage === "Executive approval"
              ? [...byPerson, ...byRole(["Executive approver", "TTRT lead"])]
              : byRole(["Coordinator", "TTRT lead", "Platform admin"]);

  return Array.from(new Set(recipients)).filter(Boolean);
}

function isSubmissionClosed(submission: Submission) {
  return submission.stage === "Released" || submission.stage === "Rejected";
}

function actionReasonForUser(submission: Submission, user: TtrtUser) {
  const role = user.role;
  const pendingSignature = submission.signatures.find((signature) => signature.status === "pending" && userMatchesName(user, signature.name));
  const openComment = submission.comments.find((comment) => comment.state !== "resolved" && userMatchesName(user, comment.reviewer));
  const evidenceGaps = requirementCounts(submission).fail + requirementCounts(submission).warning;

  if (pendingSignature) return `Signature required as ${pendingSignature.role}.`;
  if (openComment) return "Resolve or confirm your review comment before consolidation.";
  if (submission.stage === "Initial screening" && userRoleIs(user, ["Coordinator", "TTRT lead", "Platform admin"])) {
    return evidenceGaps > 0 ? "Screen package completeness and decide whether to return to PM." : "Screen package and circulate to TTRT members.";
  }
  if (submission.stage === "Returned to PM" && userOwnsProject(user, submission)) {
    return "Upload corrected evidence and resubmit the package.";
  }
  if (submission.stage === "PM response" && userOwnsProject(user, submission)) {
    return "Respond to TTRT comments and upload the corrected package.";
  }
  if (submission.stage === "PM response" && userRoleIs(user, ["Coordinator", "TTRT lead", "Platform admin"])) {
    return "Review PM response and decide whether comments are addressed.";
  }
  if (submission.stage === "Technical review" && userDivisionMatchesSubmission(user, submission) && userRoleIs(user, ["Technical reviewer", "TTRT member"])) {
    return `Review from the ${divisionReviewLens(user)} division lens and record your recommendation.`;
  }
  if (submission.stage === "Technical review" && userRoleIs(user, ["Coordinator", "TTRT lead", "Platform admin"])) {
    return "Monitor reviewer inputs and consolidate open technical comments.";
  }
  if (submission.stage === "Final recommendation" && userRoleIs(user, ["Coordinator", "TTRT lead", "Platform admin"])) {
    return "Prepare the final recommendation and clear remaining signatures.";
  }
  if (submission.stage === "Executive approval" && userRoleIs(user, ["Executive approver", "TTRT lead", "Platform admin"])) {
    return "Review the recommendation and record the executive decision.";
  }
  if (role === "Platform admin" || role === "TTRT lead") return submission.nextAction;
  return "";
}

function isActionRequiredForUser(submission: Submission, user: TtrtUser) {
  if (isSubmissionClosed(submission)) return false;
  return Boolean(actionReasonForUser(submission, user));
}

function actionPriority(submission: Submission) {
  if (submission.priority === "Critical") return 0;
  if (signatureCounts(submission).pending > 0) return 1;
  if (requirementCounts(submission).fail > 0) return 2;
  if (submission.priority === "High") return 3;
  return 4;
}

export default function App() {
  const [signedIn, setSignedIn] = useState(isEmbedded);
  const [page, setPage] = useState<Page>("dashboard");
  const [submissionRecords, setSubmissionRecords] = useState<Submission[]>(() =>
    loadStored(storageKeys.submissions, submissions.slice(0, 1)),
  );
  const [selectedId, setSelectedId] = useState(() => submissionRecords[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!isEmbedded);
  const [foldedGroups, setFoldedGroups] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<Rule[]>(() => loadStored(storageKeys.rules, initialRules));
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => loadStored(storageKeys.files, []));
  const [users, setUsers] = useState<TtrtUser[]>(() => migrateUsersToDivisionLens(loadStored(storageKeys.users, initialUsers)));
  const [currentUserId, setCurrentUserId] = useState(() => loadStored(storageKeys.currentUser, "u-abdulqader"));
  const [notifications, setNotifications] = useState<TtrtNotification[]>(() =>
    loadStored(storageKeys.notifications, []),
  );
  const [submitOpen, setSubmitOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [lang, setLang] = useState<TtrtLanguage>(() => (window.localStorage.getItem(storageKeys.language) === "ar" ? "ar" : "en"));

  useEffect(() => saveStored(storageKeys.submissions, submissionRecords), [submissionRecords]);
  useEffect(() => saveStored(storageKeys.files, projectFiles), [projectFiles]);
  useEffect(() => saveStored(storageKeys.users, users), [users]);
  useEffect(() => saveStored(storageKeys.currentUser, currentUserId), [currentUserId]);
  useEffect(() => saveStored(storageKeys.notifications, notifications), [notifications]);
  useEffect(() => saveStored(storageKeys.rules, rules), [rules]);
  useEffect(() => {
    window.localStorage.setItem(storageKeys.language, lang);
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("ttrt-rtl", lang === "ar");
    document.body.classList.toggle("ttrt-ltr", lang === "en");

    applyTtrtLanguage(lang);
    let frame = window.requestAnimationFrame(() => applyTtrtLanguage(lang));
    const root = document.getElementById("root");
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyTtrtLanguage(lang));
    });
    if (root) observer.observe(root, { attributes: true, childList: true, subtree: true, characterData: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [askOpen, currentUserId, lang, notificationOpen, page, selectedId, signedIn, submitOpen]);
  useEffect(() => {
    if (isEmbedded) setSidebarOpen(false);
  }, [isEmbedded]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAskOpen(true);
        setNotificationOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const selected = submissionRecords.find((item) => item.id === selectedId) ?? submissionRecords[0];
  const currentUser = users.find((user) => user.id === currentUserId) ?? users.find((user) => user.status === "Active") ?? initialUsers[0];
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
      uploadedBy: currentUser.name,
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
        scope: "Assigned division",
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
        body: `${payload.manager} submitted ${payload.name}. Initial screening is ready for ${stageRecipientsLabel(created, users)}.`,
        createdAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        recipients: recipientsForStage(created, users),
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
    setNotificationOpen(false);
    setSelectedId(notification.submissionId);
    setPage("submissions");
  }

  function pushNotification(submissionId: string, title: string, body: string, recipients?: string[]) {
    const target = submissionRecords.find((submission) => submission.id === submissionId);
    setNotifications((current) => [
      {
        id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        submissionId,
        title,
        body,
        createdAt: nowStamp(),
        recipients: recipients ?? (target ? recipientsForStage(target, users) : activeUsers(users).map((user) => user.name)),
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
          reviewer: currentUser.name,
          role: currentUser.role,
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
    if (action === "reject" && !canRejectSubmission(currentUser)) {
      pushNotification(id, "Reject action blocked", "Only the Executive Director role can reject a TTRT submission.", [currentUser.name]);
      return;
    }

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
    const nextSubmissionForNotification: Submission = {
      ...current,
      stage: actionConfig.stage,
      decision: actionConfig.decision,
      nextAction: actionConfig.nextAction,
      bottleneck: actionConfig.bottleneck,
    };

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
          reviewer: currentUser.name,
          role: currentUser.role,
          date: todayStamp(),
          state: action === "return" ? "open" : "resolved",
          comment: actionConfig.comment,
        },
        ...submission.comments,
      ],
    }));
    const recipients = recipientsForStage(nextSubmissionForNotification, users);
    pushNotification(
      id,
      actionConfig.notificationTitle,
      `${actionConfig.notificationBody} Alert sent to ${stageRecipientsLabel(nextSubmissionForNotification, users)}.`,
      recipients,
    );
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
      "Reviewer comment added from the project workspace. Coordinator must consolidate it before final recommendation.",
      "open",
    );
    pushNotification(submissionId, "Reviewer comment added", "A new TTRT review comment was added and requires consolidation.");
  }

  function addProjectComment(submissionId: string, comment: string) {
    const clean = comment.trim();
    if (!clean) return;
    addSubmissionComment(submissionId, clean, "open");
    const target = submissionRecords.find((submission) => submission.id === submissionId);
    pushNotification(
      submissionId,
      `${divisionReviewLens(currentUser)} comment added`,
      `${currentUser.name} added a review comment. Coordinator must consolidate it before the next stage.`,
      target ? recipientsForStage(target, users) : undefined,
    );
  }

  function updateSubmissionDetails(submissionId: string, payload: ProjectUpdatePayload) {
    const current = submissionRecords.find((submission) => submission.id === submissionId);
    if (!current) return;
    const nextSubmissionForNotification: Submission = { ...current, ...payload };
    const stageChanged = payload.stage !== current.stage;

    patchSubmission(submissionId, (submission) => ({
      ...submission,
      ...payload,
      timeline: payload.stage !== submission.stage ? updateTimelineForStage(submission.timeline, payload.stage) : submission.timeline,
      comments: [
        {
          reviewer: currentUser.name,
          role: currentUser.role,
          date: todayStamp(),
          state: "resolved",
          comment: "Project details updated from the project workspace.",
        },
        ...submission.comments,
      ],
    }));
    pushNotification(
      submissionId,
      stageChanged ? `${current.code} moved to ${payload.stage}` : `${current.code} updated`,
      stageChanged
        ? `${payload.name} is now with ${stageRecipientsLabel(nextSubmissionForNotification, users)}.`
        : `${payload.name} project details were updated.`,
      stageChanged ? recipientsForStage(nextSubmissionForNotification, users) : undefined,
    );
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

  if (!signedIn) return <Login lang={lang} onLanguageChange={setLang} onSubmit={() => setSignedIn(true)} />;

  return (
    <div className={`${isEmbedded ? `app-shell embedded-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}` : "app-shell"} ${lang === "ar" ? "ttrt-rtl-shell" : "ttrt-ltr-shell"}`}>
      {(!isEmbedded || sidebarOpen) && <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <button className="brand-home" type="button" onClick={() => setPage("dashboard")} aria-label="Open overview">
            <img src={admLogo} alt="Abu Dhabi Mobility" className="brand-logo" />
          </button>
          <p>TTRT</p>
          <button className="sidebar-close" type="button" aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)}>
            <PanelLeftClose size={18} />
          </button>
        </div>
        <button className="ask-button" type="button" onClick={() => { setAskOpen(true); setNotificationOpen(false); }}>
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
      </aside>}

      <div
        className={`main ${sidebarOpen ? "" : "expanded"}`}
        style={isEmbedded ? {
          width: sidebarOpen ? "calc(100% - 240px)" : "100%",
          marginLeft: 0,
          transform: sidebarOpen ? (lang === "ar" ? "translateX(-240px)" : "translateX(240px)") : "none",
        } : undefined}
      >
        <header className="topbar">
          {(isEmbedded || !sidebarOpen) && (
            <button
              className="app-context-button"
              type="button"
              aria-label={sidebarOpen ? "Hide TTRT navigation" : "Open TTRT navigation"}
              onClick={() => setSidebarOpen((current) => !current)}
            >
              {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
              <strong>TTRT</strong>
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
            {isEmbedded && (
              <a className="mobility-return-button" href={getMobilityAiReturnUrl()} target="_top">
                <LayoutDashboard size={15} />
                <span>Mobility AI</span>
              </a>
            )}
            <button
              className="language-toggle"
              type="button"
              title={lang === "ar" ? "Switch to English" : "Switch to Arabic"}
              aria-label={lang === "ar" ? "Switch to English" : "Switch to Arabic"}
              onClick={() => setLang((current) => (current === "ar" ? "en" : "ar"))}
            >
              <Languages size={16} />
              <span data-i18n-skip>{lang === "ar" ? "EN" : "عربي"}</span>
            </button>
            <span className="clock">18:42 / Asia Dubai</span>
            <label className="role-switcher" aria-label="View TTRT as">
              <UsersRound size={15} />
              <select value={currentUser.id} onChange={(event) => setCurrentUserId(event.target.value)}>
                {activeUsers(users).map((user) => (
                  <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
                ))}
              </select>
            </label>
            <div className="notification-anchor">
              <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setNotificationOpen((current) => !current)}>
                <Bell size={17} />
                {notifications.some((item) => !item.read) && <span className="dot" />}
              </button>
              {notificationOpen && (
                <NotificationPopover notifications={notifications} onOpen={openNotification} />
              )}
            </div>
            <button className="icon-button" type="button" aria-label="Settings" onClick={() => { setNotificationOpen(false); setPage("settings"); }}><Settings size={17} /></button>
            <button className="icon-button" type="button" aria-label="Sign out" onClick={() => setSignedIn(false)}><LogOut size={17} /></button>
          </div>
        </header>

        <main className="content">
          {page === "dashboard" && (
            <Dashboard
              submissions={submissionRecords}
              currentUser={currentUser}
              setPage={setPage}
              setSelectedId={setSelectedId}
              onOpenSubmit={() => setSubmitOpen(true)}
            />
          )}
          {page === "submissions" && (
            <SubmissionsPage
              submissions={filtered}
              selected={selected}
              currentUser={currentUser}
              setSelectedId={setSelectedId}
              projectFiles={projectFiles}
              onUpload={uploadProjectFiles}
              onRemoveFile={removeProjectFile}
              onOpenSubmit={() => setSubmitOpen(true)}
              onDecision={applySubmissionAction}
              onAddComment={addProjectComment}
              onCommentState={updateCommentState}
              onUpdateSubmission={updateSubmissionDetails}
              onSign={signSubmission}
              onRemindSignature={remindSignature}
            />
          )}
          {page === "rules" && <RulesPage rules={rules} setRules={setRules} onSave={saveRules} />}
          {page === "users" && <UsersPage users={users} addUser={addUser} patchUser={patchUser} />}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
      {submitOpen && <SubmitProjectModal onClose={() => setSubmitOpen(false)} onSubmit={createSubmission} />}
      {askOpen && (
        <TtrtAskModal
          submissions={submissionRecords}
          projectFiles={projectFiles}
          currentUser={currentUser}
          onClose={() => setAskOpen(false)}
          onOpenSubmission={(submissionId) => {
            setSelectedId(submissionId);
            setPage("submissions");
            setAskOpen(false);
          }}
        />
      )}
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

function TtrtAskModal({
  submissions: visibleSubmissions,
  projectFiles,
  currentUser,
  onClose,
  onOpenSubmission,
}: {
  submissions: Submission[];
  projectFiles: ProjectFile[];
  currentUser: TtrtUser;
  onClose: () => void;
  onOpenSubmission: (submissionId: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const suggestions = [
    "What needs follow-up today?",
    "Which submissions have missing evidence?",
    "Who still needs to sign?",
    "Summarize the active TTRT projects",
  ];

  async function ask(value = question) {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setQuestion(trimmed);
    setBusy(true);
    const response = await askTtrtAi(trimmed, visibleSubmissions, projectFiles, currentUser);
    setAnswer(response);
    setTargetId(resolveTtrtTarget(trimmed, response, visibleSubmissions)?.id ?? null);
    setBusy(false);
  }

  return (
    <div className="modal-backdrop ask-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="ask-modal" role="dialog" aria-modal="true" aria-label="Ask TTRT" onMouseDown={(event) => event.stopPropagation()}>
        <header className="ask-modal-header">
          <div className="ask-brand">
            <span><Sparkles size={24} /></span>
            <div>
              <h2>TTRT - Ask anything</h2>
              <p>Ask across submissions, evidence gaps, signatures, comments, SLA, and next actions.</p>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="Close ask panel" onClick={onClose}>
            <XCircle size={18} />
          </button>
        </header>

        <form
          className="ask-form"
          onSubmit={(event) => {
            event.preventDefault();
            void ask();
          }}
        >
          <Sparkles size={18} />
          <input
            autoFocus
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about late submissions, missing files, pending signatures..."
          />
          <button className="primary-button compact" type="submit" disabled={busy}>
            {busy ? "Thinking..." : "Ask"} <ArrowRight size={15} />
          </button>
        </form>

        {!answer && (
          <div className="ask-suggestions">
            {suggestions.map((item) => (
              <button key={item} type="button" onClick={() => void ask(item)}>
                {item}
              </button>
            ))}
          </div>
        )}

        {answer && (
          <article className="ask-answer">
            <p className="eyebrow">TTRT answer</p>
            <p>{answer}</p>
            {targetId && (
              <button className="text-button" type="button" onClick={() => onOpenSubmission(targetId)}>
                Open related submission <ArrowRight size={15} />
              </button>
            )}
          </article>
        )}
      </section>
    </div>
  );
}

function NotificationPopover({
  notifications,
  onOpen,
}: {
  notifications: TtrtNotification[];
  onOpen: (notification: TtrtNotification) => void;
}) {
  return (
    <div className="notification-popover" role="dialog" aria-label="TTRT notifications">
      <div className="notification-popover-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <strong>Project alerts</strong>
        </div>
        <Pill label={`${notifications.filter((item) => !item.read).length} unread`} tone={notifications.some((item) => !item.read) ? "amber" : "green"} />
      </div>
      <div className="notification-list compact-notification-list">
        {notifications.length === 0 ? (
          <div className="empty-upload-state compact-empty">
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
      </div>
    </div>
  );
}

function Login({
  lang,
  onLanguageChange,
  onSubmit,
}: {
  lang: TtrtLanguage;
  onLanguageChange: (language: TtrtLanguage) => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-toolbar">
          <button
            className="language-toggle"
            type="button"
            title={lang === "ar" ? "Switch to English" : "Switch to Arabic"}
            aria-label={lang === "ar" ? "Switch to English" : "Switch to Arabic"}
            onClick={() => onLanguageChange(lang === "ar" ? "en" : "ar")}
          >
            <Languages size={16} />
            <span data-i18n-skip>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>
        </div>
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
  submissions: visibleSubmissions,
  currentUser,
  setPage,
  setSelectedId,
  onOpenSubmit,
}: {
  submissions: Submission[];
  currentUser: TtrtUser;
  setPage: (page: Page) => void;
  setSelectedId: (id: string) => void;
  onOpenSubmit: () => void;
}) {
  const activeSubmissions = visibleSubmissions.filter((item) => !isSubmissionClosed(item));
  const myActionItems = activeSubmissions
    .filter((item) => isActionRequiredForUser(item, currentUser))
    .sort((left, right) => actionPriority(left) - actionPriority(right));
  const watchedItems = activeSubmissions
    .filter((item) => !isActionRequiredForUser(item, currentUser))
    .slice(0, Math.max(0, 7 - myActionItems.length));
  const actionItems = [...myActionItems, ...watchedItems].slice(0, 7);
  const waitingSignatures = visibleSubmissions.reduce((total, item) => total + signatureCounts(item).pending, 0);
  const missingEvidence = visibleSubmissions.reduce((total, item) => total + requirementCounts(item).fail + requirementCounts(item).warning, 0);
  const overdueSubmissions = activeSubmissions.filter((item) => {
    const due = parseDisplayDate(item.dueOn);
    return due ? due.getTime() < Date.now() : false;
  });
  const releasedSubmissions = visibleSubmissions.filter((item) => item.stage === "Released");
  const completion = visibleSubmissions.length
    ? Math.round((releasedSubmissions.length / visibleSubmissions.length) * 100)
    : 0;
  const riskCount = overdueSubmissions.length + missingEvidence;
  const decisionSplit = [
    { label: "Approved", count: visibleSubmissions.filter((item) => item.decision === "Approve").length, color: "#64b77d" },
    { label: "Approved with comments", count: visibleSubmissions.filter((item) => item.decision === "Conditional approval").length, color: "#2f6ea8" },
    { label: "Pending / waiting", count: visibleSubmissions.filter((item) => item.decision === "Pending").length, color: "#e8b64f" },
    { label: "Rejected", count: visibleSubmissions.filter((item) => item.decision === "Reject").length, color: "#c8574f" },
  ];
  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="TTRT overview"
        title="Project review without circulation delays"
        subtitle="Track submitted projects, see exactly where each package sits in the process, and surface only the actions owned by the logged-in role."
        actions={
          <>
            <button className="primary-button compact" type="button" onClick={onOpenSubmit}><Plus size={16} />Submit project</button>
            <button className="secondary-button compact" type="button" onClick={() => setPage("submissions")}><Inbox size={16} />Open submissions</button>
          </>
        }
      />

      <section className="ttrt-overview-dashboard">
        <div className="overview-kpi-panel">
          <div className="section-heading tight">
            <div>
              <p className="eyebrow">Latest TTRT submissions</p>
              <h2>Review health</h2>
            </div>
            <Pill label={`${completion}% complete`} tone={completion >= 70 ? "green" : completion >= 40 ? "amber" : "blue"} />
          </div>
          <div className="metric-grid overview-metric-grid">
            <MetricCard icon={Inbox} label="Active submissions" value={String(activeSubmissions.length)} helper={`${visibleSubmissions.length} total packages`} tone="blue" progress={Math.max(8, Math.min(100, activeSubmissions.length * 18))} />
            <MetricCard icon={UserPlus} label="My action queue" value={String(myActionItems.length)} helper={`${actionItems.length} packages visible in the queue`} tone={myActionItems.length > 0 ? "amber" : "green"} progress={Math.max(8, Math.min(100, myActionItems.length * 24))} />
            <MetricCard icon={AlertTriangle} label="Due / evidence risk" value={String(riskCount)} helper={`${overdueSubmissions.length} overdue, ${missingEvidence} evidence gaps`} tone={riskCount > 0 ? "red" : "green"} progress={Math.max(4, Math.min(100, riskCount * 16))} />
            <MetricCard icon={Signature} label="Pending signatures" value={String(waitingSignatures)} helper="ED / TTRT signatures before release" tone={waitingSignatures > 0 ? "amber" : "green"} progress={Math.max(8, Math.min(100, waitingSignatures * 18))} />
          </div>
        </div>

        <DecisionSplitCard split={decisionSplit} total={Math.max(1, visibleSubmissions.length)} />
      </section>

      <div className="dashboard-grid overview-action-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reviewer action queue</p>
              <h2>Where your action is required</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setPage("submissions")}>View all <ArrowRight size={15} /></button>
          </div>
          <div className="action-list">
            {actionItems.length === 0 ? (
              <div className="empty-upload-state compact-empty">
                <CheckCircle2 size={18} />
                <strong>No assigned action right now</strong>
                <p>When a package reaches a step owned by {currentUser.role.toLowerCase()}, it will appear here first.</p>
              </div>
            ) : actionItems.map((item) => {
              const assignedToMe = isActionRequiredForUser(item, currentUser);
              return (
                <button
                  className={`action-row ${assignedToMe ? "assigned" : ""}`}
                  type="button"
                  key={`${item.id}-${item.code}`}
                  onClick={() => {
                    setSelectedId(item.id);
                    setPage("submissions");
                  }}
                >
                  <div>
                    <strong>{item.code}</strong>
                    <p>{assignedToMe ? actionReasonForUser(item, currentUser) : item.nextAction}</p>
                  </div>
                  <div className="row-meta">
                    {assignedToMe && <Pill label="Your action" tone="amber" />}
                    <Pill label={item.stage} tone={stageTone(item.stage)} />
                    <span>{item.slaRemaining}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

    </div>
  );
}

function SubmissionsPage({
  submissions: visibleSubmissions,
  selected,
  currentUser,
  setSelectedId,
  projectFiles,
  onUpload,
  onRemoveFile,
  onOpenSubmit,
  onDecision,
  onAddComment,
  onCommentState,
  onUpdateSubmission,
  onSign,
  onRemindSignature,
}: {
  submissions: Submission[];
  selected: Submission;
  currentUser: TtrtUser;
  setSelectedId: (id: string) => void;
  projectFiles: ProjectFile[];
  onUpload: (submissionId: string, files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  onOpenSubmit: () => void;
  onDecision: (submissionId: string, action: "approve" | "conditional" | "return" | "reject") => void;
  onAddComment: (submissionId: string, comment: string) => void;
  onCommentState: (submissionId: string, index: number, state: CommentState) => void;
  onUpdateSubmission: (submissionId: string, payload: ProjectUpdatePayload) => void;
  onSign: (submissionId: string, signatureKey: string) => void;
  onRemindSignature: (submissionId: string, signature: SignatureRecord) => void;
}) {
  const selectedFiles = projectFiles.filter((file) => file.submissionId === selected.id);
  const [filterMode, setFilterMode] = useState<"all" | "active" | "needsAttention" | "closed">("all");
  const [editing, setEditing] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const selectedRequirements = requirementCounts(selected);
  const selectedSignatures = signatureCounts(selected);
  const selectedOpenComments = selected.comments.filter((comment) => comment.state === "open" || comment.state === "approvedWithComments");
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
        title="Submission decision workspace"
        subtitle="Select a project package and see the executive decision brief first. Operational evidence remains available when needed."
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
              <h2>{queue.length === 1 ? "1 submission" : `${queue.length} submissions`}</h2>
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
                  {isActionRequiredForUser(item, currentUser) && <Pill label="Your action" tone="amber" />}
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
          <ExecutiveDecisionBrief
            selected={selected}
            files={selectedFiles}
            currentUser={currentUser}
            requirementSummary={selectedRequirements}
            signatureSummary={selectedSignatures}
            openComments={selectedOpenComments.length}
            onDecision={onDecision}
            onAddComment={onAddComment}
          />
          <details className="operational-details">
            <summary>
              <span>Operational package details</span>
              <small>Form, scope, comments, documents, signatures, and input checks</small>
            </summary>
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
                <div>
                  <h3>Signature chain</h3>
                  <p className="muted-line">Signatures stay attached to the selected project package and drive final release.</p>
                </div>
                <Pill label={`${selectedSignatures.signed}/${selected.signatures.length} signed`} tone={selectedSignatures.pending > 0 ? "amber" : "green"} />
              </div>
              <div className="signature-grid project-signature-grid">
                {selected.signatures.map((signature) => (
                  <SignatureCard
                    key={`${signature.name}-${signature.role}`}
                    signature={signature}
                    onSign={() => onSign(selected.id, `${signature.name}-${signature.role}`)}
                    onRemind={() => onRemindSignature(selected.id, signature)}
                  />
                ))}
              </div>
            </section>
            <section className="subsection">
              <div className="section-heading tight">
                <h3>Input checks</h3>
                <Pill label={`${selectedRequirements.fail + selectedRequirements.warning} needs attention`} tone={selectedRequirements.fail > 0 ? "red" : selectedRequirements.warning > 0 ? "amber" : "green"} />
              </div>
              <div className="check-grid">
                {selected.documents.map((doc) => <DocumentCheckCard key={doc.name} doc={doc} />)}
              </div>
            </section>
          </details>
        </section>
      </div>
    </div>
  );
}

function ExecutiveDecisionBrief({
  selected,
  files,
  currentUser,
  requirementSummary,
  signatureSummary,
  openComments,
  onDecision,
  onAddComment,
}: {
  selected: Submission;
  files: ProjectFile[];
  currentUser: TtrtUser;
  requirementSummary: ReturnType<typeof requirementCounts>;
  signatureSummary: ReturnType<typeof signatureCounts>;
  openComments: number;
  onDecision: (submissionId: string, action: "approve" | "conditional" | "return" | "reject") => void;
  onAddComment: (submissionId: string, comment: string) => void;
}) {
  const [reviewComment, setReviewComment] = useState("");
  const aiRecommendation = divisionAiRecommendation(selected, currentUser, files);
  const aiPick = ttrtAiPick(selected, currentUser, requirementSummary, signatureSummary, openComments);
  const canDecide = canRecordTtrtDecision(currentUser);
  const isExecutive = currentUser.role === "Executive approver";
  const actionRequired = isActionRequiredForUser(selected, currentUser);
  const decisionActions: Array<{ action: TtrtDecisionAction; label: string; icon: LucideIcon; className: string }> = canDecide
    ? isExecutive
      ? [
          { action: "approve", label: "Approve", icon: CheckCircle2, className: "primary-button" },
          { action: "conditional", label: "Conditional approval", icon: PenLine, className: "secondary-button amber" },
          { action: "reject", label: "Reject", icon: XCircle, className: "secondary-button danger" },
        ]
      : [
          { action: "approve", label: "Approve recommendation", icon: CheckCircle2, className: "primary-button" },
          { action: "conditional", label: "Conditional approval", icon: PenLine, className: "secondary-button amber" },
          { action: "return", label: "Return to PM", icon: Mail, className: "secondary-button" },
        ]
    : [];

  function submitAiComment() {
    const clean = reviewComment.trim();
    onAddComment(
      selected.id,
      clean || `${divisionReviewLens(currentUser)} review comment: ${aiRecommendation.recommendedAction}. ${aiRecommendation.summary}`,
    );
    setReviewComment("");
  }

  return (
    <section className="executive-decision-brief">
      <div className="ai-reco-header">
        <div className="executive-brief-main">
          <p className="eyebrow">AI recommendation for {divisionReviewLens(currentUser)}</p>
          <h3>{aiRecommendation.title}</h3>
          <p>{aiRecommendation.summary}</p>
        </div>
        <div className="ai-reco-status">
          <Pill label={actionRequired ? "Your action" : "Watching"} tone={actionRequired ? "amber" : "green"} />
          <span>{selected.stage}</span>
        </div>
      </div>

      <div className="ai-reco-summary-row">
        <InfoBlock label="AI recommendation" value={aiRecommendation.recommendedAction} helper={aiRecommendation.focus} />
        <InfoBlock label="Evidence" value={`${requirementSummary.pass}/${selected.documents.length} checks passed`} helper={`${requirementSummary.fail + requirementSummary.warning} gaps or warnings`} />
        <InfoBlock label="Signatures" value={`${signatureSummary.signed}/${selected.signatures.length} signed`} helper={`${signatureSummary.pending} pending`} />
      </div>

      {!canDecide && (
        <div className="review-comment-inline">
          <div>
            <p className="eyebrow">Reviewer input</p>
            <h4>{divisionReviewLens(currentUser)} comment</h4>
            <p>At this stage, this role records its division review. Final approval or rejection stays with the authorized decision roles.</p>
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder={`Write ${divisionReviewLens(currentUser)} comment...`}
          />
        </div>
      )}

      <div className="decision-actions executive-actions simplified-actions">
        {!canDecide ? (
          <button className="primary-button ai-picked-button" type="button" onClick={submitAiComment}>
            <span className="ai-pick-badge">AI pick</span>
            <PenLine size={16} />
            {aiPick.label}
          </button>
        ) : (
          decisionActions.map(({ action, label, icon: Icon, className }) => {
            const picked = aiPick.kind === action;
            return (
              <button
                key={action}
                className={`${className} ${picked ? "ai-picked-button" : ""}`}
                type="button"
                onClick={() => onDecision(selected.id, action)}
              >
                {picked && <span className="ai-pick-badge">AI pick</span>}
                <Icon size={16} />
                {label}
              </button>
            );
          })
        )}
        <p className="ai-pick-helper">{aiPick.helper}</p>
      </div>
    </section>
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
            <p>Add the first project comment from here. It will stay attached to this project history.</p>
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
          <span>Division / lens</span>
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
              <span>Division / review lens</span>
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

async function askTtrtAi(question: string, visibleSubmissions: Submission[], projectFiles: ProjectFile[], currentUser: TtrtUser): Promise<string> {
  if (aiEndpoint) {
    try {
      const prompt = buildTtrtAiPrompt(question, visibleSubmissions, projectFiles, currentUser);
      const payload = aiEndpoint.includes("/api/agents/ask")
        ? { prompt, provider: aiProvider, locale: "en" }
        : { app: "ttrt", question, prompt, context: ttrtAiContext(visibleSubmissions, projectFiles, currentUser) };
      const response = await fetch(aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
      const answer = extractAiAnswer(await response.json());
      if (answer) return answer;
    } catch {
      // Keep the demo useful even if the external AI service is unavailable.
    }
  }

  return localTtrtAnswer(question, visibleSubmissions, projectFiles, currentUser);
}

function buildTtrtAiPrompt(question: string, visibleSubmissions: Submission[], projectFiles: ProjectFile[], currentUser: TtrtUser): string {
  return [
    "You are the TTRT Review Cockpit assistant for Abu Dhabi Mobility / ITC.",
    "Answer using only the provided TTRT context. Be concrete, concise, and operational.",
    "If a project or person is relevant, cite the submission code and the next action.",
    `The logged-in user is ${currentUser.name}, role ${currentUser.role}, division/review lens ${divisionReviewLens(currentUser)}.`,
    "Tailor recommendations to that user's division lens. Do not give every reviewer the same generic recommendation.",
    "Do not invent project records, documents, or approvals.",
    "",
    `Question: ${question}`,
    "",
    "TTRT context:",
    ttrtAiContext(visibleSubmissions, projectFiles, currentUser),
  ].join("\n");
}

function ttrtAiContext(visibleSubmissions: Submission[], projectFiles: ProjectFile[], currentUser?: TtrtUser): string {
  return visibleSubmissions.map((submission) => {
    const docCounts = requirementCounts(submission);
    const signatureSummary = signatureCounts(submission);
    const files = projectFiles.filter((file) => file.submissionId === submission.id);
    const openComments = submission.comments.filter((comment) => comment.state === "open");
    const divisionRecommendation = currentUser ? divisionAiRecommendation(submission, currentUser, files) : null;
    return [
      `- ${submission.code}: ${submission.name}`,
      `  Stage: ${submission.stage}; decision: ${submission.decision}; priority: ${submission.priority}; SLA: ${submission.slaRemaining}`,
      `  PM: ${submission.manager}; sector: ${submission.sector}; division: ${submission.division}`,
      `  Evidence checks: ${docCounts.pass} pass, ${docCounts.warning} warning, ${docCounts.fail} fail`,
      `  Signatures: ${signatureSummary.signed} signed, ${signatureSummary.pending} pending, ${signatureSummary.blocked} blocked`,
      `  Open comments: ${openComments.length}`,
      `  Uploaded files: ${files.length ? files.map((file) => file.name).join(", ") : "none"}`,
      `  Bottleneck: ${submission.bottleneck}`,
      `  Next action: ${submission.nextAction}`,
      divisionRecommendation ? `  Division-specific recommendation for ${divisionReviewLens(currentUser!)}: ${divisionRecommendation.title}; ${divisionRecommendation.summary}` : "",
    ].join("\n");
  }).join("\n");
}

function extractAiAnswer(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const direct = record.answer ?? record.message ?? record.text ?? record.response ?? record.output;
  if (typeof direct === "string") return direct.trim();
  if (record.result && typeof record.result === "object") {
    const result = record.result as Record<string, unknown>;
    const nested = result.answer ?? result.message ?? result.text ?? result.output;
    if (typeof nested === "string") return nested.trim();
  }
  return "";
}

function localTtrtAnswer(question: string, visibleSubmissions: Submission[], projectFiles: ProjectFile[], currentUser: TtrtUser): string {
  const normalized = question.toLowerCase();
  const active = visibleSubmissions.filter((submission) => submission.stage !== "Released" && submission.stage !== "Rejected");

  if (normalized.includes("my") || normalized.includes("division") || normalized.includes("assigned") || normalized.includes("follow")) {
    const queue = active
      .filter((submission) => isActionRequiredForUser(submission, currentUser))
      .sort((a, b) => actionPriority(a) - actionPriority(b))
      .slice(0, 5);
    if (!queue.length) return `${currentUser.name} has no active TTRT action right now for the ${divisionReviewLens(currentUser)} review lens.`;
    return queue.map((submission, index) => {
      const recommendation = divisionAiRecommendation(submission, currentUser, projectFiles.filter((file) => file.submissionId === submission.id));
      return `${index + 1}. ${submission.code}: ${actionReasonForUser(submission, currentUser)} AI recommendation: ${recommendation.recommendedAction} (${recommendation.focus}).`;
    }).join("\n");
  }

  if (normalized.includes("sign")) {
    const pending = visibleSubmissions
      .map((submission) => ({
        submission,
        names: submission.signatures.filter((signature) => signature.status === "pending").map((signature) => signature.name),
      }))
      .filter((item) => item.names.length > 0);
    if (!pending.length) return "All visible TTRT submissions have their signature chain completed.";
    return pending.map(({ submission, names }) => `${submission.code}: pending signatures from ${names.join(", ")}. Next action: ${submission.nextAction}`).join("\n");
  }

  if (normalized.includes("evidence") || normalized.includes("document") || normalized.includes("missing") || normalized.includes("file")) {
    const gaps = visibleSubmissions
      .map((submission) => ({
        submission,
        checks: submission.documents.filter((document) => document.state === "fail" || document.state === "warning"),
        files: projectFiles.filter((file) => file.submissionId === submission.id),
      }))
      .filter((item) => item.checks.length > 0 || item.files.length === 0);
    if (!gaps.length) return "No evidence gaps are currently visible in the loaded TTRT submissions.";
    return gaps.map(({ submission, checks, files }) => {
      const issues = checks.length ? checks.map((check) => `${check.name}: ${check.note}`).join("; ") : "No uploaded files attached to this record.";
      return `${submission.code}: ${issues} Uploaded files: ${files.length}.`;
    }).join("\n");
  }

  if (normalized.includes("late") || normalized.includes("sla") || normalized.includes("due") || normalized.includes("follow")) {
    const queue = active
      .filter((submission) => userDivisionMatchesSubmission(currentUser, submission))
      .map((submission) => ({ submission, due: parseDisplayDate(submission.dueOn)?.getTime() ?? Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.due - b.due)
      .slice(0, 5);
    if (!queue.length) return `There are no active TTRT submissions requiring SLA follow-up for ${currentUser.name}'s ${divisionReviewLens(currentUser)} lens.`;
    return queue.map(({ submission }, index) =>
      `${index + 1}. ${submission.code} (${submission.stage}) - SLA ${submission.slaRemaining}; bottleneck: ${submission.bottleneck}. Next action: ${submission.nextAction}`,
    ).join("\n");
  }

  if (normalized.includes("comment") || normalized.includes("reviewer")) {
    const rows = visibleSubmissions
      .map((submission) => ({
        submission,
        comments: submission.comments.filter((comment) => comment.state === "open" || comment.state === "approvedWithComments"),
      }))
      .filter((item) => item.comments.length > 0);
    if (!rows.length) return "There are no open or approved-with-comments reviewer comments in the current TTRT view.";
    return rows.map(({ submission, comments }) =>
      `${submission.code}: ${comments.length} reviewer comment(s) need traceability. ${comments.map((comment) => `${comment.reviewer}: ${comment.comment}`).join(" ")}`,
    ).join("\n");
  }

  if (normalized.includes("active") || normalized.includes("status") || normalized.includes("stage") || normalized.includes("summarize")) {
    if (!visibleSubmissions.length) return "No TTRT submissions are loaded.";
    return visibleSubmissions.map((submission) =>
      `${submission.code}: ${submission.name} is at ${submission.stage}, decision ${submission.decision}, priority ${submission.priority}. Next action: ${submission.nextAction}`,
    ).join("\n");
  }

  const activeCount = active.length;
  const evidenceGaps = visibleSubmissions.reduce((total, submission) => {
    const counts = requirementCounts(submission);
    return total + counts.warning + counts.fail;
  }, 0);
  const pendingSignatures = visibleSubmissions.reduce((total, submission) => total + signatureCounts(submission).pending, 0);
  const myActions = active.filter((submission) => isActionRequiredForUser(submission, currentUser)).length;
  return `TTRT currently shows ${visibleSubmissions.length} submission(s), ${activeCount} active review(s), ${evidenceGaps} evidence gap(s), and ${pendingSignatures} pending signature(s). For ${currentUser.name}'s ${divisionReviewLens(currentUser)} lens, ${myActions} package(s) need action.`;
}

function resolveTtrtTarget(question: string, answer: string, visibleSubmissions: Submission[]): Submission | undefined {
  const text = `${question} ${answer}`.toLowerCase();
  return visibleSubmissions.find((submission) => text.includes(submission.code.toLowerCase()))
    ?? visibleSubmissions.find((submission) => text.includes(submission.name.toLowerCase()))
    ?? visibleSubmissions.find((submission) => submission.stage !== "Released" && submission.stage !== "Rejected");
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

function getMobilityAiReturnUrl() {
  const explicit = new URLSearchParams(window.location.search).get("returnTo");
  if (explicit) return explicit;

  try {
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== window.location.origin) return `${referrer.origin}/overview`;
    }
  } catch {
    // Ignore malformed referrers and use the local-development fallback below.
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `${window.location.protocol}//${window.location.hostname}:8280/overview`;
  }

  return "/overview";
}
