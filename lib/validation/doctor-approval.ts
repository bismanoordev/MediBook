import * as yup from "yup"

export type ApprovalDocumentType = "cnic" | "pmdc_license" | "degree"
export type ApprovalDocumentStatus = "missing" | "pending" | "verified" | "needs_action"
export type ApprovalDocument = { doc_type: ApprovalDocumentType; status: Exclude<ApprovalDocumentStatus, "missing"> }
export type RequiredDocumentStatuses = { cnic: ApprovalDocumentStatus; pmdc_license: ApprovalDocumentStatus }

const requiredDocumentLabels = { cnic: "CNIC", pmdc_license: "PMDC license" } as const

function issueFor(label: string, status: ApprovalDocumentStatus) {
  if (status === "missing") return `${label} is not uploaded.`
  if (status === "pending") return `${label} is still pending.`
  return `${label} needs action.`
}

function verifiedDocument(label: string) {
  return yup.mixed<ApprovalDocumentStatus>().test("verified", issueFor(label, "missing"), function (value) {
    return value === "verified" || this.createError({ message: issueFor(label, value ?? "missing") })
  })
}

export const doctorApprovalDocumentsSchema = yup.object({
  cnic: verifiedDocument(requiredDocumentLabels.cnic),
  pmdc_license: verifiedDocument(requiredDocumentLabels.pmdc_license),
})

export function requiredDocumentStatuses(documents: ReadonlyArray<ApprovalDocument>): RequiredDocumentStatuses {
  const statusFor = (type: keyof RequiredDocumentStatuses): ApprovalDocumentStatus => {
    const document = documents.find((item) => item.doc_type === type)
    return document?.status ?? "missing"
  }

  return { cnic: statusFor("cnic"), pmdc_license: statusFor("pmdc_license") }
}

export function doctorApprovalDocumentError(documents: ReadonlyArray<ApprovalDocument>) {
  try {
    doctorApprovalDocumentsSchema.validateSync(requiredDocumentStatuses(documents), { abortEarly: false })
    return null
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) return "You can't approve this doctor yet. Verify the CNIC and the PMDC license first."
    const issues = [...new Set((error.inner.length ? error.inner : [error]).map((issue) => issue.message))]
    return `You can't approve this doctor yet. Verify the CNIC and the PMDC license first. ${issues.join(" ")}`
  }
}
