export type ProjectStatus = "Backlog" | "Scheduled" | "In Progress" | "Review" | "Done";

export type ProjectPriority = "High" | "Medium" | "Low";

export type TeamRole =
  | "Project Manager"
  | "Social Media Specialist"
  | "Content Creator"
  | "Ads Specialist"
  | "Designer"
  | "Account Executive";

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
  role: TeamRole;
  startDate: string;
  dueDate: string;
  priority: ProjectPriority;
  description?: string;
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
  "Social Media Specialist",
  "Content Creator",
  "Ads Specialist",
  "Designer",
  "Account Executive",
];

export const zooAvatars = ["Lion", "Panda", "Koala", "Tiger", "Giraffe", "Penguin", "Fox", "Elephant", "Zebra", "Otter"];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-christopher",
    name: "Christopher",
    email: "christopher@growthhive.id",
    role: "Project Manager",
    avatar: "Lion",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "tm-social",
    name: "Social Team",
    email: "social@growthhive.id",
    role: "Social Media Specialist",
    avatar: "Panda",
    color: "bg-rose-100 text-rose-800",
  },
  {
    id: "tm-creative",
    name: "Creative Team",
    email: "creative@growthhive.id",
    role: "Content Creator",
    avatar: "Koala",
    color: "bg-sky-100 text-sky-800",
  },
  {
    id: "tm-performance",
    name: "Performance Team",
    email: "performance@growthhive.id",
    role: "Ads Specialist",
    avatar: "Tiger",
    color: "bg-violet-100 text-violet-800",
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
