# Surguuli

The school's public website: home, news, classes, virtual tour and the
feedback form. It has no sign-in — visitors, students and parents all see
the same pages (student/parent login was removed on 2026-10-08; see git
history before that date if it is ever needed again).

Teachers and staff use a separate website — admin panels, signatures, the
late-arrival log — in [dogzit/Surguuli-staff](https://github.com/dogzit/Surguuli-staff).
Locally it lives in `staff/`, which has its own git repo and is ignored
here. Both apps use the **same database**.

## Database schema

`prisma/schema.prisma` is a copy. Schema changes are made and pushed from the
staff repo; then copy its `prisma/schema.prisma` here unchanged.

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Same Postgres database as the staff site |
| `NEXT_PUBLIC_SITE_URL` | This site's URL |
| `NEXT_PUBLIC_STAFF_SITE_URL` | Staff site's URL (sidebar link, old staff URLs redirect there) |
| `REVALIDATE_SECRET` | Shared with the staff site; lets it refresh cached pages after edits |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional: email notifications |

## Development

```bash
npm install
npm run dev
```
