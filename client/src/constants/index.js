import {
  FolderOpenIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  CheckSquareIcon,
  CoinsIcon,
  Zap,
  Users,
  Calendar,
  Clock,
  Shield,
  BarChart3,
  BriefcaseBusiness,
  Folder,
  ListChecks,
  CreditCard,
} from "lucide-react";

export const adminMenuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    end: true,
  },
  {
    name: "Workspaces",
    href: "/admin/workspaces",
    icon: BriefcaseBusiness,
    end: false,
  },
  {
    name: "Teams",
    href: "/admin/teams",
    icon: Users,
    end: false,
  },
  {
    name: "Projects",
    href: "/admin/projects",
    icon: Folder,
    end: false,
  },
  {
    name: "Tasks",
    href: "/admin/tasks",
    icon: ListChecks,
    end: false,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    end: true,
  },
  {
    name: "Settings",
    href: "/admin/setting",
    icon: SettingsIcon,
    end: true,
  },
];

export const allMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    end: true,
  },
  { name: "Team", href: "/dashboard/team", icon: UsersIcon, end: false },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpenIcon,
    end: false,
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquareIcon,
    end: false,
  },
  {
    name: "Payment",
    href: "/dashboard/payment",
    icon: CoinsIcon,
    end: true,
    restrictedTo: ["globalAdmin"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    end: true,
    restrictedTo: ["workspaceAdmin"],
  },
];

export const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance for seamless project management",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration with your entire team",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Detailed insights into project progress and team performance",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "Visualize your projects with an intuitive calendar",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Monitor time spent on tasks and projects",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Enterprise-grade security for your peace of mind",
  },
];

export const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for Trial",
    features: ["1 Workspace", "Up to 3 Team Members", "1 Project", "3 Tasks"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Perfect for small teams",
    features: [
      "5 Workspace",
      "Up to 10 Team Members",
      "10 Projects",
      "10 Tasks",
    ],
    highlighted: false,
  },
  {
    name: "Ultimate",
    price: "$49",
    period: "/month",
    description: "For growing teams",
    features: [
      "Unlimited Workspace",
      "Unlimited Team Members",
      "Unlimited Projects",
      "Unlimited Tasks",
    ],
    highlighted: true,
  },
];


