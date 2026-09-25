LOAN_FORM_EXTRACTION_PROMPT = """
Extract the filled values from this GOLD PICSAVER loan application form.
Return ONLY valid JSON.
Rules:
- Extract only information visible in the image.
- Never guess, infer, calculate, or invent.
- Blank or unreadable fields must be null.
- Preserve names, addresses, IDs, phone numbers, emails, and dates as written.
- Return numeric values as numbers when clearly readable.
- Ignore printed labels, form instructions, lines, stains, folds, shadows, and background content.
- Set applicant_signature_present to true only when a visible applicant signature exists.
- Set needs_review to true when any important field is missing, unclear, or uncertain.
- extraction_confidence must be between 0.0 and 1.0.
- Keep the JSON keys exactly as provided because the result will populate an editable form.
Return:
{
  "document_type": "loan_application_form",
  "personal_information": {
    "full_name": null,
    "date_of_birth": null,
    "gender": null,
    "marital_status": null,
    "email_address": null,
    "phone_number": null,
    "residential_address": null,
    "id_type": null,
    "id_number": null
  },
  "employment_financial_details": {
    "current_employer": null,
    "job_title": null,
    "monthly_net_income": null,
    "other_income_source": null,
    "work_address": null
  },
  "loan_request_details": {
    "requested_amount": null,
    "loan_tenure_months": null,
    "purpose_of_loan": null,
    "bank_name": null,
    "account_number": null
  },
  "declaration_signature": {
    "applicant_signature_present": false,
    "application_date": null
  },
  "extraction_confidence": 0.0,
  "needs_review": true
}
"""