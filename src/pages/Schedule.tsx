import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, List, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useJobsByDate } from "@/hooks/useJobs";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

const views = [
  { label: "Day", icon: Calendar },
  { label: "List", icon: List },
  { label: "Map", icon: Map },
];

const Schedule = () => {
  const [activeView, setActiveView] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart.toISOString()]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: jobs, isLoading } = useJobsByDate(dateStr);

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekDays[0], "MMM d")} – {format(weekDays[6], "d, yyyy")}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="font-medium">{format(day, "EEEEE")}</span>
                  <span className="text-base font-display font-bold mt-0.5">{format(day, "d")}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : !jobs?.length ? (
            <Card className="shadow-warm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No jobs scheduled for this day</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => {
              const client = (job as any).clients;
              const clientName = client ? `${client.first_name} ${client.last_name}` : "";
              const startTime = job.scheduled_start ? format(new Date(job.scheduled_start), "h:mm a") : "";
              const duration = job.scheduled_start && job.scheduled_end
                ? `${((new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime()) / 3600000).toFixed(1)}h`
                : "";

              return (
                <Card key={job.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer" onClick={() => window.location.href = `/jobs/${job.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-right w-16 shrink-0">
                      <p className="text-sm font-medium">{startTime}</p>
                      {duration && <p className="text-[10px] text-muted-foreground">{duration}</p>}
                    </div>
                    <div className="w-1 self-stretch rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{clientName || job.job_number}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
