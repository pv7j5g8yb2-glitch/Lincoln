// The roles people hold in a US immigration firm. Admin rights follow the role: only an admin can give or take
// them, for anyone at the firm, and a firm always keeps at least one admin.
export const ADMIN_ROLES = ["Administrator", "Managing partner"];
export const STAFF_ROLES = ["Partner", "Attorney", "Associate attorney", "Of counsel", "Paralegal", "Legal assistant", "Case manager", "Office manager", "Receptionist", "Law clerk", "Billing and accounting", "IT staff"];

/** Roles that can be the responsible attorney on a case. */
export const isLawyerRole = (role: string) => /partner|attorney|counsel|administrator/i.test(role);

export const ROLES = [...ADMIN_ROLES, ...STAFF_ROLES];
