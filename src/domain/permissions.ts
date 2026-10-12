export type Role = "business_admin" | "branch_admin" | "employee" | "driver" | "customer";

export type Actor = {
  id: string;
  role: Role;
  branchIds: string[];
  disabled: boolean;
};

export function isStaff(role: Role): boolean {
  return role === "business_admin" || role === "branch_admin" || role === "employee" || role === "driver";
}

export function canManageBusiness(actor: Actor): boolean {
  return actor.role === "business_admin" && !actor.disabled;
}

export function canAccessBranch(actor: Actor, branchId: string): boolean {
  if (actor.disabled) return false;
  if (actor.role === "business_admin") return true;
  if (actor.role === "customer") return false;
  return actor.branchIds.includes(branchId);
}

export function canProcessOrders(actor: Actor, branchId: string): boolean {
  if (!canAccessBranch(actor, branchId)) return false;
  return actor.role === "business_admin" || actor.role === "branch_admin" || actor.role === "employee";
}

export function canManageMenu(actor: Actor, branchId: string): boolean {
  if (!canAccessBranch(actor, branchId)) return false;
  return actor.role === "business_admin" || actor.role === "branch_admin";
}

export function canManageStaff(actor: Actor, branchId: string | null): boolean {
  if (actor.disabled) return false;
  if (actor.role === "business_admin") return true;
  if (actor.role === "branch_admin" && branchId) return actor.branchIds.includes(branchId);
  return false;
}

export function canViewReports(actor: Actor, branchId: string | null): boolean {
  if (actor.disabled) return false;
  if (actor.role === "business_admin") return true;
  if ((actor.role === "branch_admin" || actor.role === "employee") && branchId) {
    return actor.branchIds.includes(branchId);
  }
  if ((actor.role === "branch_admin" || actor.role === "employee") && branchId == null) {
    return false;
  }
  return false;
}

export function canDrive(actor: Actor, branchId: string): boolean {
  if (actor.disabled || actor.role !== "driver") return false;
  return actor.branchIds.includes(branchId);
}

export function ownsCustomerResource(actor: Actor, userId: string | null): boolean {
  return actor.role === "customer" && !actor.disabled && actor.id === userId;
}
