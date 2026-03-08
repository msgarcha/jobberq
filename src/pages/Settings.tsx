import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Receipt,
  CreditCard,
  Users,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const settingsGroups = [
  {
    label: "Business",
    items: [
      { title: "Company Details", desc: "Business name, address, and logo", icon: Building2 },
      { title: "Invoicing", desc: "Numbering, tax rates, payment terms", icon: Receipt },
      { title: "Payment Methods", desc: "Stripe, ACH, and card setup", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Team Members", desc: "Invite and manage your team", icon: Users },
      { title: "Notifications", desc: "Email and push preferences", icon: Bell },
      { title: "Appearance", desc: "Theme, colors, and display", icon: Palette },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Security", desc: "Password, two-factor auth", icon: Shield },
      { title: "Help & Support", desc: "Documentation and contact", icon: HelpCircle },
    ],
  },
];

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and business settings.</p>
        </div>

        {settingsGroups.map((group, gi) => (
          <div key={group.label} className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">{group.label}</h2>
            <Card className="shadow-warm">
              <CardContent className="p-0">
                {group.items.map((item, i) => (
                  <div key={item.title}>
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </button>
                    {i < group.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
