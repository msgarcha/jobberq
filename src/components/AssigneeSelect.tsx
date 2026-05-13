import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useTeam";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const UNASSIGNED = "__unassigned__";

export function initialsFromName(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export function useAssignees() {
  const { team } = useAuth();
  const { data: members } = useTeamMembers(team.teamId || undefined);
  return (members || []).map((m: any) => ({
    user_id: m.user_id as string,
    display_name: (m.profiles?.display_name as string | null) || "Member",
    avatar_url: (m.profiles?.avatar_url as string | null) || null,
    role: m.role as string,
  }));
}

interface AssigneeAvatarProps {
  userId?: string | null;
  className?: string;
  showName?: boolean;
}

export function AssigneeAvatar({ userId, className, showName }: AssigneeAvatarProps) {
  const assignees = useAssignees();
  const member = assignees.find((a) => a.user_id === userId);

  if (!userId || !member) {
    return (
      <div className={cn("flex items-center gap-1.5 text-muted-foreground", className)}>
        <UserCircle2 className="h-4 w-4" strokeDasharray="2 2" />
        {showName && <span className="text-xs">Unassigned</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Avatar className="h-5 w-5">
        {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.display_name} />}
        <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
          {initialsFromName(member.display_name)}
        </AvatarFallback>
      </Avatar>
      {showName && <span className="text-xs truncate">{member.display_name.split(" ")[0]}</span>}
    </div>
  );
}

interface AssigneeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export function AssigneeSelect({ value, onChange, placeholder = "Unassigned" }: AssigneeSelectProps) {
  const assignees = useAssignees();
  return (
    <Select
      value={value || UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? null : v)}
    >
      <SelectTrigger className="md:h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {assignees.map((a) => (
          <SelectItem key={a.user_id} value={a.user_id}>
            {a.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface AssigneeFilterProps {
  value: string; // 'all' | 'me' | 'unassigned' | user_id
  onChange: (value: string) => void;
}

export function AssigneeFilter({ value, onChange }: AssigneeFilterProps) {
  const assignees = useAssignees();
  const { user } = useAuth();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[180px] text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All assignees</SelectItem>
        {user && <SelectItem value="me">Assigned to me</SelectItem>}
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {assignees.map((a) => (
          <SelectItem key={a.user_id} value={a.user_id}>
            {a.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function matchesAssigneeFilter(jobAssignedTo: string | null | undefined, filter: string, currentUserId?: string | null) {
  if (filter === "all") return true;
  if (filter === "unassigned") return !jobAssignedTo;
  if (filter === "me") return jobAssignedTo === currentUserId;
  return jobAssignedTo === filter;
}
