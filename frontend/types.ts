export interface SourceFile {
  id: string;
  name: string;
  type: string;
  content: string; // base64
  mimeType: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface HandoverData {
  overview: {
    transferor: { name: string; position: string; contact: string };
    transferee: {
      name: string;
      position: string;
      contact: string;
      startDate?: string;
    };
    reason?: string;
    background?: string;
    period?: string;
    schedule?: { date: string; activity: string }[];
  };
  jobStatus?: {
    title: string;
    responsibilities: string[];
    authority?: string;
    reportingLine?: string;
    teamMission?: string;
    teamGoals?: string[];
  };
  jobResponsibilities?: {
    position?: string;
    mainDuties?: string[];
    reportingLine?: string;
  };
  priorities?: {
    rank?: number;
    title?: string;
    status?: string;
    solution?: string;
    deadline?: string;
  }[];
  priorityTasks?: {
    urgent?: string[];
    keyStakeholders?: string[];
    teamMembers?: string[];
  };
  stakeholders?: {
    manager?: string;
    internal?: { name: string; role: string }[];
    external?: { name: string; role: string }[];
  };
  teamMembers?: {
    name: string;
    position: string;
    role: string;
    notes?: string;
  }[];
  ongoingProjects?: {
    name?: string;
    owner?: string;
    status?: string;
    progress?: number;
    deadline?: string;
    description?: string;
    activeProjects?: string[];
    pendingIssues?: string[];
    futurePlans?: string[];
  };
  risks?: {
    issues: string;
    risks: string;
  };
  roadmap?: {
    shortTerm: string;
    longTerm: string;
  };
  keyResources?: {
    docs?: { category?: string; name?: string; location?: string }[];
    systems?: { name?: string; usage?: string; contact?: string }[];
    contacts?: {
      category?: string;
      name?: string;
      position?: string;
      contact?: string;
    }[];
    documents?: string[];
    systemAccess?: string[];
  };
  resources?: {
    docs?: { category: string; name: string; location: string }[];
    systems?: { name: string; usage: string; contact: string }[];
    contacts?: {
      category: string;
      name: string;
      position: string;
      contact: string;
    }[];
  };
  checklist?: { text: string; completed: boolean }[];
  rawContent?: string;
}

export enum ViewMode {
  CHAT = "CHAT",
  CHAT_HISTORY = "CHAT_HISTORY",
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
