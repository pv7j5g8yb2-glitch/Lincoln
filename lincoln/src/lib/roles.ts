// The roles people hold in a US immigration firm. Admin rights follow the role, so the two admin roles are only
// offered to people who are already admins, and the rest only to people who are not.
export const ADMIN_ROLES = ["Administrator", "Managing partner"];
export const STAFF_ROLES = ["Partner", "Attorney", "Associate attorney", "Of counsel", "Paralegal", "Legal assistant", "Case manager", "Office manager", "Receptionist", "Law clerk", "Billing and accounting", "IT staff"];

/** Roles that can be the responsible attorney on a case. */
export const isLawyerRole = (role: string) => /partner|attorney|counsel|administrator/i.test(role);
