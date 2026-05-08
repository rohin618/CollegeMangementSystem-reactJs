import { MAIL_DRAFT_TYPE } from "../../../../../../../common/constant";


export const MAIL_DRAFT_TEMPLATES: Record<number, string> = {
    [MAIL_DRAFT_TYPE.PRIVATE_PERMANENT]: `
<p>Hi <strong>(Billing Person’s Name)</strong>,</p>

<p>
  I hope this message finds you well.<br />
  We are pleased to welcome <strong>Mr./Mrs./Ms. (Resident Name)</strong> to
  <strong>(Trading name)</strong>, effective
  <strong>(Date of Admission / Permanent Stay)</strong>.
</p>

<p>
  Please find attached the <strong>Welcome Letter</strong>,
  <strong>Resident Contract</strong>, and
  <strong>Deposit and Current Month Invoice</strong> for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p><strong>Weekly rate:</strong> £(amount), excluding FNC.</p>

<p>
  <strong>Monthly rate:</strong> £(amount)<br />
  <em>
    (Weekly price multiplied by 52 weeks and divided by 12 months or 
Weekly price divided by 7 days, multiplied by 365 days and divided by 12 months)

  </em>
</p>

<p>
  <strong>Payment details</strong><br />
  We would appreciate payment being made within <strong>5 days</strong>
  to the following account:
</p>

<ul>
  <li><strong>Account Name:</strong></li>
  <li><strong>Account Number:</strong></li>
  <li><strong>Sort Code:</strong></li>
</ul>

<p>
  From <strong>(next month)</strong>, the ongoing monthly fee will be
  <strong>£(amount)</strong>.
  To ensure timely payments, we recommend setting up a standing order
  for payment by the <strong>5th of each month</strong>.
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,

    [MAIL_DRAFT_TYPE.PRIVATE_RESPITE]: `
<p>Hi <strong>(Billing Person’s Name)</strong>,</p>

<p>
  I hope this message finds you well.<br />
  We are pleased to welcome <strong>Mr./Mrs./Ms. (Resident Name)</strong> to
  <strong>(Trading name)</strong>, effective
  <strong>(Start Date of Respite)</strong>.
</p>

<p>
  Please find attached the <strong>Welcome Letter</strong>,
  <strong>Resident Contract</strong>, and
  <strong>Respite Invoice</strong> for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p><strong>Admission Details:</strong></p>

<p>
  <strong>Mr./Mrs./Ms. (Resident Name)</strong> was admitted for a
  four-week respite stay.
  Charges apply for <strong>28 days</strong>, covering the period from
  <strong>15/01/2026</strong> to <strong>11/02/2026</strong>.
  <em>(Start and end date of Respite)</em>
</p>

<p><strong>Weekly rate:</strong> £(amount), excluding FNC.</p>

<p>
  We would appreciate payment being made within <strong>5 days</strong>
  to the following account:
</p>

<ul>
  <li><strong>Account Name:</strong></li>
  <li><strong>Account Number:</strong></li>
  <li><strong>Sort Code:</strong></li>
</ul>

<p>Please confirm once payment has been completed.</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,

    [MAIL_DRAFT_TYPE.LA_ICB_PERMANENT]: `
<p>Hi <strong>(NOK’s Name)</strong>,</p>

<p>
  I hope this message finds you well.<br />
  We are pleased to welcome
  <strong>Mr./Mrs./Ms. (Resident Name)</strong> to
  <strong>(Trading name)</strong>, effective
  <strong>(Date of Admission / Permanent Stay)</strong>.
</p>

<p>
  Please find attached the <strong>Welcome Letter</strong> and
  <strong>Resident Contract</strong> for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,

    [MAIL_DRAFT_TYPE.LA_ICB_RESPITE]: `
<p>Hi <strong>(NOK’s Name)</strong>,</p>

<p>
  I hope this message finds you well.<br />
  We are pleased to welcome
  <strong>Mr./Mrs./Ms. (Resident Name)</strong> to
  <strong>(Trading name)</strong>, effective
  <strong>(Date of Admission / Permanent Stay)</strong>.
</p>

<p>
  Please find attached the <strong>Welcome Letter</strong> and
  <strong>Resident Contract</strong> for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p><strong>Admission Details:</strong></p>

<p>
  <strong>Mr./Mrs./Ms. (Resident Name)</strong> was admitted for a
  four-week respite stay.
  Charges apply for <strong>28 days</strong>, covering the period from
  <strong>15/01/2026</strong> to <strong>11/02/2026</strong>.
  <em>(Start and end date of Respite)</em>
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,

    [MAIL_DRAFT_TYPE.RESPITE_TO_PERMANENT_PVT]: `
<p>Hi <strong>(Billing Person’s Name)</strong>,</p>

<p>
  I hope this message finds you well.
</p>

<p>
  Please find attached the <strong>Resident Contract (Permanent stay)</strong>
  and <strong>Deposit and Current Month Invoice</strong>
  <em>(From Start date of Extended with Permanent stay or Start date of Private funding)</em>
  for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p>
  <strong>Weekly rate:</strong> £(amount), excluding FNC, from date.
</p>

<p>
  <strong>Monthly rate:</strong> £(amount)<br />
  <em>
    (Weekly price × 52 ÷ 12 or Weekly price ÷ 7 × 365 ÷ 12)
  </em>
</p>

<p>
  We would appreciate payment being made within <strong>5 days</strong>
  to the following account:
</p>

<ul>
  <li><strong>Account Name:</strong></li>
  <li><strong>Account Number:</strong></li>
  <li><strong>Sort Code:</strong></li>
</ul>

<p>Please confirm once payment has been completed.</p>

<p>
  From <strong>(next month)</strong>, the ongoing monthly fee will be
  <strong>£(amount)</strong>.
  To ensure timely payments, we recommend setting up a standing order
  for payment by the <strong>5th of each month</strong>.
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,
    [MAIL_DRAFT_TYPE.RESPITE_TO_PERMANENT_LA_ICB]: `
<p>Hi <strong>(NOK’s Name)</strong>,</p>

<p>
  I hope this message finds you well.
</p>

<p>
  Please find attached the <strong>Resident Contract (Permanent stay)</strong>
  <em>(From Start date of Extended with Permanent stay or Start date of LA/ICB funding)</em>
  for your review.
  Kindly arrange for the contract to be signed and returned at your earliest convenience.
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,

    [MAIL_DRAFT_TYPE.ANNUAL_FEE_INCREMENT_LETTER]: `
<p>Hi <strong>(NOK’s Name)</strong>,</p>

<p>
  I hope this message finds you well.
</p>

<p>
  Please find attached the <strong>Annual Fee Increase Letter</strong> for your review.
</p>

<p><strong>Effective from:</strong> (date)</p>

<p><strong>New weekly fee:</strong> £</p>

<p><strong>New monthly fee:</strong> £</p>

<p>
  Kindly change the <strong>Standing Order</strong> to reflect the new rate
  with the bank accordingly.
</p>

<p>
  Should you have any questions or require further clarification,
  please do not hesitate to contact me.
  I look forward to receiving the signed contract.
</p>

<p>
  Best regards,<br />
  <strong>Name of the Sender</strong><br />
  Role<br />
  Trade name<br />
  Telephone number
</p>
`,
};