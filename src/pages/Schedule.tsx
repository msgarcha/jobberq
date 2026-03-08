import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, List, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const days = ["S", "M", "T", "W", "T", "F", "S"];
const dates = [12, 13, 14, 15, 16, 17, 18];
const today = 16;

const timeSlots = [
  { time: "9:00 AM", title: "Lawn Maintenance", client: "Green Valley HOA", duration: "2h" },
  { time: "11:30 AM", title: "Site Assessment", client: "Smith Residence", duration: "1h" },
  { time: "1:00 PM", title: "HVAC Inspection", client: "Acme Corp", duration: "2h" },
  { time: "3:30 PM", title: "Window Cleaning", client: "Metro Properties", duration: "1.5h" },
];

const views = [
  { label: "Day", icon: Calendar },
  { label: "List", icon: List },
  { label: "Map", icon: Map },
];

const Schedule = () => {
  const [activeView, setActiveView] = useState("Day");

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">Thursday, January 16, 2024</p>
          </div>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {views.map((v) => (
              <Button
                key={v.label}
                variant={activeView === v.label ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 rounded-md text-xs"
                onClick={() => setActiveView(v.label)}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <Card className="shadow-warm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">Jan 12 – 18, 2024</span>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <button
                  key={i}
                  className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                    dates[i] === today
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <span className="font-medium">{day}</span>
                  <span className="text-base font-display font-bold mt-0.5">{dates[i]}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-2">
          {timeSlots.map((slot, i) => (
            <Card key={i} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-right w-16 shrink-0">
                  <p className="text-sm font-medium">{slot.time}</p>
                  <p className="text-[10px] text-muted-foreground">{slot.duration}</p>
                </div>
                <div className="w-1 self-stretch rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{slot.title}</p>
                  <p className="text-xs text-muted-foreground">{slot.client}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
