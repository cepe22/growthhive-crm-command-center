export type ProjectStatus = "Backlog" | "Scheduled" | "In Progress" | "Review" | "Done";

export type ProjectPriority = "High" | "Medium" | "Low";

export type TeamRole =
  | "PIC / Owner / Founder"
  | "Project Manager"
  | "Social Media Specialist / Ads Specialist"
  | "Graphic Designer"
  | "Graphic Designer Intern";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar: string;
  color: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  project: string;
  client: string;
  status: ProjectStatus;
  assigneeId: string;
  assignedById: string;
  watcherId: string;
  startDate?: string;
  dueDate: string;
  priority: ProjectPriority;
  description?: string;
  progressUpdates?: TaskProgressUpdate[];
  comments?: TaskComment[];
  notificationLog?: string[];
};

export type TaskProgressUpdate = {
  id: string;
  authorId: string;
  date: string;
  note: string;
};

export type TaskComment = {
  id: string;
  authorId: string;
  date: string;
  note: string;
};

export type TaskNotificationKind = "assigned" | "reminder";

export type TaskNotification = {
  id: string;
  taskId: string;
  recipientId: string;
  recipientEmail: string;
  kind: TaskNotificationKind;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  emailSent?: boolean;
  emailError?: string;
};

export type WorkPlanStatus = "Focus" | "Review" | "Blocked" | "Done";

export type DailyWorkPlan = {
  id: string;
  userId: string;
  date: string;
  focus: string;
  tasks: string;
  blocker?: string;
  status: WorkPlanStatus;
};

export type EventResponse = "Pending" | "Accepted" | "Declined";

export type AppCalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  ownerId: string;
  attendeeIds: string[];
  meetLink?: string;
  responses: Record<string, EventResponse>;
};

export const projectStatuses: ProjectStatus[] = ["Backlog", "Scheduled", "In Progress", "Review", "Done"];

export const teamRoles: TeamRole[] = [
  "Project Manager",
  "Social Media Specialist / Ads Specialist",
  "Graphic Designer",
  "Graphic Designer Intern",
  "PIC / Owner / Founder",
];

export const zooAvatars = ["Lion", "Panda", "Koala", "Tiger", "Giraffe", "Penguin", "Fox", "Elephant", "Zebra", "Otter"];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-christopher",
    name: "Christopher",
    email: "growthiveofficial@gmail.com",
    role: "PIC / Owner / Founder",
    avatar: "Lion",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "tm-joshua",
    name: "Joshua",
    email: "joshua.ramadhan@gmail.com",
    role: "Social Media Specialist / Ads Specialist",
    avatar: "Panda",
    color: "bg-sky-100 text-sky-800",
  },
  {
    id: "tm-inaya",
    name: "Inaya",
    email: "bariahinayatul@gmail.com",
    role: "Project Manager",
    avatar: "Koala",
    color: "bg-rose-100 text-rose-800",
  },
  {
    id: "tm-sellina",
    name: "Sellina",
    email: "sellinaukrida2020@gmail.com",
    role: "Social Media Specialist / Ads Specialist",
    avatar: "Tiger",
    color: "bg-violet-100 text-violet-800",
  },
  {
    id: "tm-xiu",
    name: "Xiu",
    email: "margareth13105@gmail.com",
    role: "Graphic Designer Intern",
    avatar: "Giraffe",
    color: "bg-emerald-100 text-emerald-800",
  },
];

export const projectTasks: ProjectTask[] = [];

export const dailyWorkPlans: DailyWorkPlan[] = [];

export const appCalendarEvents: AppCalendarEvent[] = [];

export type ContractStatus = "Aktif" | "Bulanan" | "Perlu diperbarui" | "Periode belum diisi";

export type ClientProject = {
  scope: string;
  monthlyFee?: number;
  feeNote?: string;
};

export type ManagedClient = {
  brand: string;
  projects: ClientProject[];
  contractPeriod?: string;
  status: ContractStatus;
  notes?: string;
};

export const clientContractSource = "";
export const managedClients: ManagedClient[] = [];
export const knownMonthlyFee = 0;
export const activeProjectCount = 0;
