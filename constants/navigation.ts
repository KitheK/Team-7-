export interface NavItem {
  title: string;
  href: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const dashboardSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", href: "/(dashboard)", icon: "home" },
      { title: "Subscriptions", href: "/(dashboard)/subscriptions", icon: "credit-card" },
      { title: "AI Insights", href: "/(dashboard)/ai-insights", icon: "cpu" },
    ],
  },
  {
    title: "Savings",
    items: [
      { title: "Savings", href: "/(dashboard)/savings", icon: "piggy-bank" },
      { title: "Price Creep", href: "/(dashboard)/price-creep", icon: "trending-up" },
      { title: "Spend Categories", href: "/(dashboard)/spend-categories", icon: "pie-chart" },
    ],
  },
  {
    title: "Vendors",
    items: [
      { title: "Vendor Analytics", href: "/(dashboard)/vendor-analytics", icon: "bar-chart-2" },
      { title: "Vendor Negotiations", href: "/(dashboard)/vendor-negotiations", icon: "message-square" },
      { title: "Vendor Directory", href: "/(dashboard)/vendor-directory", icon: "book" },
    ],
  },
  {
    title: "Automation",
    items: [
      { title: "Automated Cancellation", href: "/(dashboard)/automated-cancellation", icon: "x-circle" },
      { title: "AI Recommendations", href: "/(dashboard)/ai-recommendations", icon: "zap" },
      { title: "Email Automation", href: "/(dashboard)/email-automation", icon: "mail" },
      { title: "AI Call Settings", href: "/(dashboard)/ai-call-settings", icon: "phone" },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "ROI Tracker", href: "/(dashboard)/roi-tracker", icon: "target" },
      { title: "Savings Timeline", href: "/(dashboard)/savings-timeline", icon: "clock" },
      { title: "Impact Reports", href: "/(dashboard)/impact-reports", icon: "file-text" },
    ],
  },
  {
    title: "Billing",
    items: [
      { title: "Billing Overview", href: "/(dashboard)/billing-overview", icon: "dollar-sign" },
      { title: "Contracts", href: "/(dashboard)/contracts", icon: "file" },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Integrations", href: "/(dashboard)/integrations", icon: "link" },
      { title: "Team Members", href: "/(dashboard)/team-members", icon: "users" },
      { title: "Security", href: "/(dashboard)/security", icon: "shield" },
      { title: "Notifications", href: "/(dashboard)/notifications", icon: "bell" },
    ],
  },
];
