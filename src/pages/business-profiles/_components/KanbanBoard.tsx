import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { cn } from "@/lib/utils.ts";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, type BusinessStatus } from "@/lib/constants.ts";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useNavigate } from "react-router-dom";

type Profile = {
  _id: Id<"businessProfiles">;
  _creationTime: number;
  businessName: string;
  status: BusinessStatus;
  priority: "low" | "medium" | "high" | "urgent";
  city?: string;
  country?: string;
  category?: string;
  assignedUserId?: Id<"users">;
};

type User = {
  _id: Id<"users">;
  name?: string;
  email?: string;
};

type Props = {
  profiles: Profile[];
  users?: User[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onDelete: (id: Id<"businessProfiles">) => void;
};

const KANBAN_COLUMNS: BusinessStatus[] = [
  "new", "pending_review", "assigned", "in_progress",
  "waiting_verification", "verification_submitted", "verified", "completed",
];

export default function KanbanBoard({ profiles, users, selectedIds, onSelectToggle, onDelete }: Props) {
  const navigate = useNavigate();
  const updateProfile = useMutation(api.businessProfiles.update);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDrop = async (status: BusinessStatus) => {
    if (!draggingId) return;
    setDragOverCol(null);
    setDraggingId(null);
    const profile = profiles.find((p) => p._id === draggingId);
    if (!profile || profile.status === status) return;
    try {
      await updateProfile({ id: profile._id, status });
      toast.success(`Moved to "${STATUS_LABELS[status]}"`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const userMap = new Map(users?.map((u) => [u._id, u]) ?? []);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
      {KANBAN_COLUMNS.map((col) => {
        const colProfiles = profiles.filter((p) => p.status === col);
        const isOver = dragOverCol === col;
        return (
          <div
            key={col}
            className={cn("flex-shrink-0 w-64 flex flex-col rounded-xl border border-border bg-muted/30 transition-colors", isOver && "border-primary bg-primary/5")}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col)}
          >
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[col].includes("green") ? "bg-green-500" : STATUS_COLORS[col].includes("blue") ? "bg-blue-500" : STATUS_COLORS[col].includes("amber") ? "bg-amber-500" : STATUS_COLORS[col].includes("purple") ? "bg-purple-500" : STATUS_COLORS[col].includes("red") ? "bg-red-500" : "bg-muted-foreground")} />
                <span className="text-xs font-semibold text-foreground">{STATUS_LABELS[col]}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 min-w-[18px] flex items-center justify-center">{colProfiles.length}</Badge>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[80px]">
              {colProfiles.map((profile) => {
                const assignedUser = profile.assignedUserId ? userMap.get(profile.assignedUserId) : undefined;
                const isSelected = selectedIds.has(profile._id);
                return (
                  <div
                    key={profile._id}
                    draggable
                    onDragStart={() => setDraggingId(profile._id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    className={cn("bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group", draggingId === profile._id && "opacity-50", isSelected && "ring-2 ring-primary")}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-start gap-1.5">
                        <input type="checkbox" checked={isSelected} onChange={() => onSelectToggle(profile._id)} className="mt-0.5 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <p className="text-xs font-medium leading-snug cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/business-profiles/${profile._id}`)}>{profile.businessName}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-3 h-3" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/business-profiles/${profile._id}`)} className="cursor-pointer gap-2 text-xs"><Eye className="w-3 h-3" /> View</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(profile._id)} className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"><Trash2 className="w-3 h-3" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium capitalize", PRIORITY_COLORS[profile.priority])}>{profile.priority}</span>
                      {profile.category && <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{profile.category}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {profile.city || profile.country ? <span className="text-[10px] text-muted-foreground truncate">{[profile.city, profile.country].filter(Boolean).join(", ")}</span> : <span />}
                      {assignedUser && <div className="flex items-center gap-1" title={assignedUser.name ?? assignedUser.email}><div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-[8px] font-bold text-primary">{(assignedUser.name ?? assignedUser.email ?? "U").charAt(0).toUpperCase()}</span></div></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
