import nodemailer from "nodemailer";

type AppliedEmail = {
  type: "applied";
  jobTitle?: string;
  idApply?: string;
};

type InterviewEmail = {
  type: "interview";
  jobTitle: string;
  date: Date | string;
  time?: Date | string;
  online?: boolean;
  meetingLink?: string;
  location?: string;
  interviewerName?: string;
};

type RecruitmentEmailOptions = AppliedEmail | InterviewEmail;

type DirectorSignatureEmailPayload = {
  to: string;
  candidateName: string;
  jobTitle: string;
  contractUrl: string;
  notes?: string;
  linkUrl?: string;
};

type PasswordResetEmailPayload = {
  to: string;
  name?: string;
  resetUrl: string;
  expiresInMinutes?: number;
};

function fmtDate(d: Date | string, locale = "en-US") {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function fmtTime(t?: Date | string, locale = "en-US") {
  if (!t) return "";
  const date = typeof t === "string" ? new Date(t) : t;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function baseWrapper(innerHTML: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #ffffff; border: 1px solid #ddd;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://onestepsolutionbali.com/wp-content/uploads/2022/10/Logo-OSS_Gold-3-2-300x263.png" alt="OSS Bali" style="max-width: 150px;">
    </div>
    ${innerHTML}
    <hr style="border: 1px solid #ddd; margin: 20px 0;">
    <div style="text-align: center; font-size: 12px; color: #888;">
      <p>&copy; ${new Date().getFullYear()} One Step Solution (OSS) Bali. All Rights Reserved.</p>
      <p><a href="https://onestepsolutionbali.com" style="color: #2d89e5; text-decoration: none;">Visit Our Website</a></p>
    </div>
  </div>`;
}

function buildPasswordResetHTML(payload: PasswordResetEmailPayload) {
  const { name, resetUrl, expiresInMinutes = 60 } = payload;
  const greeting = name ? `Hello ${name},` : "Hello,";
  const content = `
    <h2 style="color: #2d89e5; text-align: center;">Reset your password</h2>
    <p style="font-size: 16px; color: #555;">${greeting}</p>
    <p style="font-size: 16px; color: #555;">
      We received a request to reset your password. Click the button below to set a new one.
    </p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; padding: 12px 20px; background: #2d89e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Reset Password
      </a>
    </p>
    <p style="font-size: 14px; color: #777;">
      This link expires in ${expiresInMinutes} minutes. If you didn't request a password reset, you can ignore this email.
    </p>
  `;
  return baseWrapper(content);
}

/* ================================
   Applied Email
================================ */
function buildAppliedHTML(name: string, opt: AppliedEmail) {
  const { jobTitle, idApply } = opt;
  const content = `
    <h2 style="color: #2d89e5; text-align: center;">Thank You for Applying at OSS Bali</h2>
    <p style="font-size: 16px; color: #555;">Dear ${name},</p>
    <p style="font-size: 16px; color: #555;">
      Thank you for applying for the
      ${jobTitle ? `<strong>${jobTitle}</strong>` : "available position"}
      ${idApply ? ` with application ID <strong>${idApply}</strong>` : ""} at
      <strong>One Step Solution (OSS) Bali</strong>.
    </p>
    <p style="font-size: 16px; color: #555;">
      Our recruitment team will carefully review your application. If your profile matches our requirements,
      we will contact you for the next steps of the recruitment process.
    </p>
    <p style="font-size: 14px; color: #777;">
      We truly appreciate your interest in becoming part of OSS Bali.
    </p>
  `;
  return baseWrapper(content);
}

/* ================================
   Interview Email (Online & Offline)
================================ */
function buildInterviewHTML(name: string, opt: InterviewEmail) {
  const {
    jobTitle,
    date,
    time,
    online = false,
    meetingLink,
    location,
    interviewerName,
  } = opt;

  if (online && !meetingLink) {
    throw new Error("meetingLink is required for an online interview.");
  }
  if (!online && !location) {
    throw new Error("location is required for an offline interview.");
  }

  const dateStr = fmtDate(date);
  const timeStr = fmtTime(time);
  const lineTime = timeStr ? ` at <strong>${timeStr}</strong>` : "";

  const content = `
    <h2 style="color: #2d89e5; text-align: center;">Interview Invitation - OSS Bali</h2>
    <p style="font-size: 16px; color: #555;">Dear ${name},</p>
    <p style="font-size: 16px; color: #555;">
      We are pleased to invite you to attend an interview for the position of
      <strong>${jobTitle}</strong> on <strong>${dateStr}</strong>${lineTime}.
    </p>

    ${
      online
        ? `
      <div style="background:#F6FFED; border:1px solid #B7EB8F; padding:12px 14px; border-radius:8px; margin:14px 0;">
        <div style="font-weight:600; color:#389E0D;">Online Interview</div>
        <div>Meeting Link: <a href="${meetingLink}" style="color:#2d89e5;">${meetingLink}</a></div>
      </div>`
        : `
      <div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:12px 14px; border-radius:8px; margin:14px 0;">
        <div style="font-weight:600; color:#1D4ED8;">On-site Interview</div>
        <div>Location: <strong>${location}</strong></div>
      </div>`
    }

    ${
      interviewerName
        ? `<p style="font-size: 16px; color: #555;">Interviewer: <strong>${interviewerName}</strong></p>`
        : ""
    }

    <p style="font-size: 14px; color: #777;">
      If this schedule does not work for you, please reply to this email to arrange a reschedule.
    </p>
  `;
  return baseWrapper(content);
}

/* ================================
   Send Email Function
================================ */
export async function sendRecruitmentEmail(
  email: string,
  name: string,
  options: RecruitmentEmailOptions
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let subject = "";
  let html = "";

  switch (options.type) {
    case "applied":
      subject = "Thank You for Applying at OSS Bali";
      html = buildAppliedHTML(name, options);
      break;
    case "interview":
      subject = `Interview Invitation - ${options.jobTitle} | OSS Bali`;
      html = buildInterviewHTML(name, options);
      break;
    default:
      // @ts-expect-error exhaustive check
      throw new Error(`Unknown email type: ${options.type}`);
  }

  await transporter.sendMail({
    from: `"One Step Solution (OSS) Bali" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject,
    html,
  });
}

export async function sendDirectorSignatureEmail(
  payload: DirectorSignatureEmailPayload
) {
  const { to, candidateName, jobTitle, contractUrl, notes, linkUrl } = payload;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const subject = `Signature Request: ${candidateName} – ${jobTitle}`;

  const content = `
    <h2 style="color:#2d89e5; text-align:left;">Director Signature Request</h2>
    <p style="font-size:15px; color:#555;">Dear Director,</p>
    <p style="font-size:15px; color:#555;">
      Please review and sign the offer contract for <strong>${candidateName}</strong>
      (position: <strong>${jobTitle}</strong>).
    </p>
    <p style="font-size:15px; color:#555;">
      You can download the document via the link below:
    </p>
    <p style="text-align:center; margin:24px 0;">
      <a href="${contractUrl}"
         style="display:inline-block; padding:12px 20px; background:#2d89e5; color:white; text-decoration:none; border-radius:8px; font-weight:600;">
        View Contract
      </a>
    </p>
    ${
      notes
        ? `<div style="background:#F6F9FF; border-left:4px solid #2d89e5; padding:14px 16px; margin:16px 0;">
            <div style="font-weight:600; margin-bottom:6px;">Additional Notes</div>
            <div style="color:#555; white-space:pre-wrap;">${notes}</div>
          </div>`
        : ""
    }
    <p style="font-size:15px; color:#555;">
      After signing, please upload the signed document back to the link below: <a href="${linkUrl}">${linkUrl}</a>
    </p>
    <p style="font-size:15px; color:#555;">
      Thank you for your attention.
    </p>
  `;

  await transporter.sendMail({
    from: `"One Step Solution (OSS) Bali" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html: baseWrapper(content),
  });
}

export async function sendPasswordResetEmail(
  payload: PasswordResetEmailPayload
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const subject = "Reset your password - Nur Cahaya Tunggal Recruitment";

  await transporter.sendMail({
    from: `"One Step Solution (OSS) Bali" <${process.env.EMAIL_USERNAME}>`,
    to: payload.to,
    subject,
    html: buildPasswordResetHTML(payload),
  });
}
