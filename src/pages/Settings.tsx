import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your company and account settings.</p>
        </div>

        <Tabs defaultValue="company">
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">Company Information</CardTitle>
                <CardDescription>Your business details shown on quotes and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input placeholder="Your Company Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="(555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="info@company.com" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input placeholder="https://company.com" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoicing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">Invoice Settings</CardTitle>
                <CardDescription>Customize invoice numbering and default terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input placeholder="INV-" defaultValue="INV-" />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Invoice Number</Label>
                    <Input placeholder="1043" defaultValue="1043" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Quote Prefix</Label>
                    <Input placeholder="Q-" defaultValue="Q-" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Tax Rate (%)</Label>
                    <Input placeholder="13" defaultValue="13" type="number" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">Integrations</CardTitle>
                <CardDescription>Connect payment processors and accounting software.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-xs text-muted-foreground">Accept credit cards and ACH payments</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">QuickBooks Online</p>
                    <p className="text-xs text-muted-foreground">Sync invoices and payments</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Xero</p>
                    <p className="text-xs text-muted-foreground">Sync invoices and payments</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
