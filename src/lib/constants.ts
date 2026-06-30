// Shared constants for business profile statuses and priorities

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  pending_review: "Pending Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_verification: "Waiting Verification",
  verification_submitted: "Submitted",
  verified: "Verified",
  rejected: "Rejected",
  completed: "Completed",
  archived: "Archived",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  pending_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  waiting_verification: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  verification_submitted: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  verified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const GOOGLE_ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export type BusinessStatus =
  | "new" | "pending_review" | "assigned" | "in_progress"
  | "waiting_verification" | "verification_submitted"
  | "verified" | "rejected" | "completed" | "archived";

export type BusinessPriority = "low" | "medium" | "high" | "urgent";
export type GoogleAccountStatus = "active" | "suspended" | "pending" | "inactive";
