import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import {
  CheckSquare, Plus, Search, Clock, AlertTriangle, CheckCircle2,
  Circle, ChevronRight, MoreHorizontal, Pencil, Trash2, CalendarDays,
  User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useNavigate } from "react-router-dom";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { PRIORITY_COLORS } from "@/lib/constants.ts";
import { cn } from "@/lib/utils.ts";

type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-muted text-muted-foreground",
};

const TASK_STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  open: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: AlertTriangle,
};

type EditForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedUserId: string;
};

export default function TasksPage() {
  const navigate = useNavigate();
  const taskStats = useQuery(api.tasks.getStats, {});
  const users = useQuery(api.users.listUsers);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tasks = useQuery(api.tasks.listAll, {
    paginationOpts: { numItems: 200, cursor: null },
    status: statusFilter !== "all" ? statusFilter : undefined,
    assignedUserId: assigneeFilter !== "all" ? (assigneeFilter as Id<"users">) : undefined,
  });

  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const profiles = useQuery(api.businessProfiles.list, {
    paginationOpts: { numItems: 500, cursor: null },
  });

  const profileMap = new Map(profiles?.page?.map((p) => [p._id, p]) ?? []);
  const userMap = new Map(users?.map((u) => [u._id, u]) ?? []);

  const filtered = (tasks?.page ?? []).filter((t) => {
    const profile = profileMap.get(t.businessProfileId);
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (profile?.businessName ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const isOverdue = (t: { dueDate?: string; status: string }) =>
    t.dueDate && t.status !== "completed" && t.status !== "cancelled" && new Date(t.dueDate) < new Date();

  const handleEdit = (task: { _id: Id<"tasks">; title: string; description?: string; priority: TaskPriority; status: TaskStatus; dueDate?: string; assignedUserId?: Id<"users"> }) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ?? "",
      assignedUserId: task.assignedUserId ?? "none",
    });
  };

  const handleSave = async () => {
    if (!editingTask || !editForm) return;
    if (!editForm.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      await updateTask({
        id: editingTask as Id<"tasks">,
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate || undefined,
        assignedUserId: editForm.assignedUserId !== "none" ? (editForm.assignedUserId as Id<"users">) : undefined,
      });
      toast.success("Task updated");
      setEditingTask(null);
      setEditForm(null);
    } catch {
      toast.error("Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    try {
      await removeTask({ id });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (id: Id<"tasks">, status: TaskStatus) => {
    try {
      await updateTask({ id, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-5">
      {taskStats === undefined ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: "Total Tasks", value: taskStats.total, icon: CheckSquare, color: "text-primary" },
            { label: "Open", value: taskStats.open, icon: Circle, color: "text-blue-500" },
            { label: "In Progress", value: taskStats.inProgress, icon: Clock, color: "text-amber-500" },
            { label: "Overdue", value: taskStats.overdue, icon: AlertTriangle, color: "text-destructive" },
          ] as const).map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks or profiles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Assignees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {users?.map((u) => (<SelectItem key={u._id} value={u._id}>{u.name ?? u.email}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {tasks === undefined ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><CheckSquare /></EmptyMedia><EmptyTitle>No tasks found</EmptyTitle><EmptyDescription>Tasks are created from individual business profile pages</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((task) => {
                const profile = profileMap.get(task.businessProfileId);
                const assignedUser = task.assignedUserId ? userMap.get(task.assignedUserId) : undefined;
                const overdue = isOverdue(task);
                const StatusIcon = TASK_STATUS_ICONS[task.status];
                return (
                  <div key={task._id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <button className="mt-0.5 cursor-pointer flex-shrink-0" onClick={() => { const next: Record<TaskStatus, TaskStatus> = { open: "in_progress", in_progress: "completed", completed: "open", cancelled: "open" }; void handleStatusChange(task._id, next[task.status]); }} title="Cycle status">
                      <StatusIcon className={cn("w-4 h-4", { "text-blue-500": task.status === "open", "text-amber-500": task.status === "in_progress", "text-green-500": task.status === "completed", "text-muted-foreground": task.status === "cancelled" })} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</span>
                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium", TASK_STATUS_COLORS[task.status])}>{TASK_STATUS_LABELS[task.status]}</span>
                        {overdue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-auto">Overdue</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {profile && <button className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" onClick={() => navigate(`/business-profiles/${profile._id}`)}><ChevronRight className="w-3 h-3" />{profile.businessName}</button>}
                        {assignedUser && <span className="flex items-center gap-1"><User className="w-3 h-3" />{assignedUser.name ?? assignedUser.email}</span>}
                        {task.dueDate && <span className={cn("flex items-center gap-1", overdue && "text-destructive")}><CalendarDays className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(task)} className="cursor-pointer gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                        {profile && <DropdownMenuItem onClick={() => navigate(`/business-profiles/${profile._id}`)} className="cursor-pointer gap-2"><ChevronRight className="w-3.5 h-3.5" /> View Profile</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([s, l]) => s !== task.status && <DropdownMenuItem key={s} onClick={() => handleStatusChange(task._id, s)} className="cursor-pointer gap-2 text-xs">Set → {l}</DropdownMenuItem>)}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(task._id)} className="cursor-pointer gap-2 text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingTask} onOpenChange={(o) => { if (!o) { setEditingTask(null); setEditForm(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Status</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as TaskStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TASK_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Priority</Label><Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v as TaskPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Assigned To</Label><Select value={editForm.assignedUserId} onValueChange={(v) => setEditForm({ ...editForm, assignedUserId: v })}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{users?.map((u) => <SelectItem key={u._id} value={u._id}>{u.name ?? u.email}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditingTask(null); setEditForm(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
