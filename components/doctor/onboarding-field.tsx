import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"

type Props = { label: string; htmlFor?: string; required?: boolean; helper?: string; error?: string; className?: string; children: ReactNode }

export function OnboardingField({ label, htmlFor, required, helper, error, className, children }: Props) {
  const helperId = helper && htmlFor ? `${htmlFor}-helper` : undefined
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined
  return <div className={`min-w-0 ${className ?? ""}`}><label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required ? <><span aria-hidden="true" className="ml-1 text-red-600">*</span><span className="sr-only"> required</span></> : null}</label><div aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}>{children}</div>{helper ? <p id={helperId} className="mt-1.5 text-xs text-slate-500">{helper}</p> : null}{error ? <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p> : null}</div>
}
