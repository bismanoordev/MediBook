import { BellRing } from "lucide-react"

export type NotificationItem = {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function formatDate(createdAt: string) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt))
}

export function NotificationsList({
  notifications,
  error,
  admin = false,
}: {
  notifications: NotificationItem[] | null
  error: boolean
  admin?: boolean
}) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-[#0F766E]">
          <BellRing className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">{admin ? "Clinic alerts" : "Care updates"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-2 text-slate-600">{admin ? "Keep up with new appointment requests and clinic activity." : "Stay up to date with changes to your appointments."}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load notifications right now. Please refresh and try again.</div>
      ) : notifications?.length ? (
        <ul className="mt-8 grid gap-3" aria-label="Notifications">
          {notifications.map((notification) => (
            <li key={notification.id} className={`rounded-2xl border p-5 shadow-sm ${notification.is_read ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{notification.message}</p>
                </div>
                {!notification.is_read ? <span className="rounded-full bg-[#0F766E] px-2.5 py-1 text-xs font-semibold text-white">New</span> : null}
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">{formatDate(notification.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BellRing className="mx-auto size-7 text-[#0F766E]" />
          <h2 className="mt-4 font-semibold text-slate-900">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-slate-500">New updates will appear here as soon as they arrive.</p>
        </div>
      )}
    </>
  )
}
