# Surguuli

The school's public website: home, news, classes, virtual tour, feedback,
and the student and parent dashboards.

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
| `SESSION_SECRET` | Signs student/parent session cookies (≥16 chars) |
| `NEXT_PUBLIC_SITE_URL` | This site's URL |
| `NEXT_PUBLIC_STAFF_SITE_URL` | Staff site's URL (login link, old staff URLs redirect there) |
| `REVALIDATE_SECRET` | Shared with the staff site; lets it refresh cached pages after edits |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional: email notifications |

## Development

```bash
npm install
npm run dev
```
