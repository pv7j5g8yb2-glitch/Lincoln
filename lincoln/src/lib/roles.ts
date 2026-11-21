// Job titles in a US immigration firm. Admin is not one of them: it is a permission an admin gives or takes.
export const ROLES = ["Managing partner", "Partner", "Attorney", "Associate attorney", "Of counsel", "Paralegal", "Legal assistant", "Case manager", "Office manager", "Receptionist", "Law clerk", "Billing and accounting", "IT staff"];

/** Approvals that are legal sign off: only a lawyer may give them (the attorney signs the filing). */
export const FILING_APPROVALS = ["packet", "draft_review", "decisions"];

/** Roles that can be the responsible attorney on a case ("Administrator" is an older title some accounts still have). */
export const isLawyerRole = (role: string) => /partner|attorney|counsel|administrator/i.test(role);
