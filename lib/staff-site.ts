// Teachers and staff use a separate website (github.com/dogzit/Surguuli-staff)
// on the same database. This site only links to it.
export const STAFF_SITE_URL = (process.env.NEXT_PUBLIC_STAFF_SITE_URL ?? "").replace(/\/$/, "");
