// All user-supplied strings (nickname, association names typed by users,
// etc.) get interpolated into raw HTML email bodies -- escape them so a
// nickname like `<img src=x onerror=...>` can't inject markup or fake links
// into an email that's meant to look like it came from WASP.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface AssociationNotFoundEmailParams {
  nickname: string;
  submittedAssociation: string;
  dataCollectionUrl: string;
}

export function associationNotFoundEmail({
  nickname,
  submittedAssociation,
  dataCollectionUrl,
}: AssociationNotFoundEmailParams) {
  const safeName = escapeHtml(nickname);
  const safeAssociation = escapeHtml(submittedAssociation);
  return {
    subject: "Action Required: Help us add your association",
    html: `
<p>Hi ${safeName},</p>

<p>Thank you for trying to register for your Digital Membership Card.</p>

<p>We couldn't find <strong>"${safeAssociation}"</strong> in our official database yet. We want to make sure your association is included so you can get your card!</p>

<p>Could you please provide us with a few more details so our team can verify and add them to our system?</p>

<p><strong>What we need:</strong></p>
<ul>
  <li>Official Full Name of the Association</li>
  <li>City and Country of operation</li>
  <li>Website or official Social Media page (if available)</li>
</ul>

<p style="margin: 25px 0;">
  <a href="${dataCollectionUrl}" style="background:#FF5A5F; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">SUBMIT ASSOCIATION DETAILS</a>
</p>

<p>Once our team reviews the information and updates the database, we will send you an invite link to complete your card registration.</p>

<p>Best regards,<br>The Membership Team</p>
`,
  };
}

interface AssociationNotFoundDeclineEmailParams {
  nickname: string;
  directSignupUrl: string;
}

export function associationNotFoundDeclineEmail({
  nickname,
  directSignupUrl,
}: AssociationNotFoundDeclineEmailParams) {
  const safeName = escapeHtml(nickname);
  return {
    subject: "Update on your WASP Card request",
    html: `
<p>Hi ${safeName},</p>

<p>Thank you for your patience. Unfortunately, we weren't able to verify the association you mentioned, so we can't issue your card through that path.</p>

<p>Good news: you can still get your WASP Card by signing up directly with us instead &mdash; no existing association needed.</p>

<p style="margin: 25px 0;">
  <a href="${directSignupUrl}" style="background:#111; color:#FFD400; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">SIGN UP DIRECTLY</a>
</p>

<p>Best regards,<br>The WASP Membership Team</p>
`,
  };
}

interface VerifyEmailParams {
  nickname: string;
  verificationUrl: string;
}

export function verifyEmail({ nickname, verificationUrl }: VerifyEmailParams) {
  const safeName = escapeHtml(nickname);
  return {
    subject: "Verify your email to get your WASP Card",
    html: `
<p>Hi ${safeName},</p>

<p>You're almost there. Click below to verify your email and get your WASP Card right away.</p>

<p style="margin: 25px 0;">
  <a href="${verificationUrl}" style="background:#111; color:#FFD400; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">VERIFY MY EMAIL</a>
</p>

<p style="background:#FFF3CD; border:1px solid #FFE69C; padding:12px 16px; border-radius:6px; font-size:14px;">
  &#9888;&#65039; <strong>Mobile Only:</strong> Please open this link directly on your smartphone (iPhone or Android) to successfully add the card to your digital wallet.
</p>

<p>Once verified, you'll get your card immediately, marked as <strong>"Temporary"</strong> &mdash; we'll also email your association to confirm your membership, but it goes faster if you reach out to them directly too. This link expires in 7 days &mdash; if it does, just request a new one from the registration page.</p>

<p>Best regards,<br>The Membership Team</p>
`,
  };
}

interface VipWelcomeEmailParams {
  nickname: string;
  membershipCode: string;
}

export function vipWelcomeEmail({ nickname, membershipCode }: VipWelcomeEmailParams) {
  const safeName = escapeHtml(nickname);
  const safeCode = escapeHtml(membershipCode);
  return {
    subject: "Your WASP VIP Card is ready",
    html: `
<p>Hi ${safeName},</p>

<p>As an honorary member of the animal rights movement, your WASP Card has been issued and is <strong>already active</strong> &mdash; no further steps needed on your end.</p>

<p style="font-size:16px; font-weight:bold; margin:20px 0;">Membership code: ${safeCode}</p>

<p>Thank you for everything you do for animals.</p>

<p>Best regards,<br>The WASP Membership Team</p>
`,
  };
}

interface AssociationConfirmationEmailParams {
  memberEmail: string;
  associationName: string;
  yesUrl: string;
  noUrl: string;
}

export function associationConfirmationEmail({
  memberEmail,
  associationName,
  yesUrl,
  noUrl,
}: AssociationConfirmationEmailParams) {
  const safeEmail = escapeHtml(memberEmail);
  const safeAssociationName = escapeHtml(associationName);
  return {
    subject: "Quick confirmation needed: WASP membership card request",
    html: `
<p>Hello ${safeAssociationName},</p>

<p>Someone has requested a WASP Digital Membership Card, claiming to be a member, volunteer, or activist of your organization. We're only asking you to confirm whether the following email address belongs to someone in your records:</p>

<p style="font-size:16px; font-weight:bold; margin:20px 0;">${safeEmail}</p>

<p style="margin: 25px 0;">
  <a href="${yesUrl}" style="background:#1a7f37; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block; margin-right:12px;">YES, I recognize this</a>
  <a href="${noUrl}" style="background:#b91c1c; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">NO, I don't</a>
</p>

<p>Or, if you prefer, just reply to this email with a simple <strong>YES</strong> or <strong>NO</strong> instead. Once we hear back, our team will update their card accordingly.</p>

<p>Thank you for helping us keep the WASP community verified and trustworthy!</p>

<p>Best regards,<br>The WASP Membership Team</p>
`,
  };
}
