/**
 * POST /api/auth/forgot-password
 *
 * Body: { email: string }
 *
 * 1. Looks up employee by Email in Employees sheet
 * 2. Generates a 32-byte hex reset token with 1-hour TTL
 * 3. Writes Reset_Token + Reset_Token_Expiry to Employees row
 * 4. Sends reset link via SMTP (nodemailer)
 *    In development: also returns the link in the response for testing
 *
 * Always returns generic success (prevents email enumeration).
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import { generateResetToken, resetTokenExpiry } from "@/lib/auth";
import type { Employee } from "@/lib/types";

const GENERIC_SUCCESS = {
  success: true,
  message: "If that email exists in our system, a reset link has been sent.",
};

async function sendResetEmail(email: string, resetLink: string, name: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ""), // strip spaces from Gmail app password
    },
  });

  await transporter.sendMail({
    from: `"Crystal People" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Reset — Crystal People",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:32px;height:32px;background:#00b4b4;border-radius:4px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#1a2744;font-weight:900;font-size:11px;">CP</span>
          </div>
          <span style="font-weight:700;color:#1a2744;font-size:14px;">Crystal People</span>
        </div>
        <h2 style="color:#1a2744;margin-top:0;">Password Reset Request</h2>
        <p style="color:#374151;">Hi ${name},</p>
        <p style="color:#374151;">We received a request to reset your password for the Crystal People Performance Management Platform.</p>
        <p style="color:#374151;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#1a2744;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px;">If the button doesn't work, copy and paste this link:</p>
        <p style="color:#6b7280;font-size:12px;word-break:break-all;">${resetLink}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:11px;">If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color:#9ca3af;font-size:11px;">— Crystal Group HR</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email) return NextResponse.json(GENERIC_SUCCESS);

  try {
    const employees = await readSheet("Employees") as unknown as Employee[];
    const employee = employees.find(
      e => e.Email?.toLowerCase() === email.toLowerCase()
    );

    if (!employee || employee.Status !== "active") {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const token = generateResetToken();
    const expiry = resetTokenExpiry();

    await updateRowWhere("Employees", "Employee_ID", employee.Employee_ID, {
      Reset_Token: token,
      Reset_Token_Expiry: expiry,
    });
    invalidateCache("Employees");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    const isDev = process.env.NODE_ENV !== "production";
    let smtpError: string | undefined;

    try {
      await sendResetEmail(email, resetLink, employee.Name ?? "there");
    } catch (emailErr) {
      console.warn("[forgot-password] Email send failed:", emailErr);
      if (isDev) smtpError = String(emailErr);
    }

    return NextResponse.json({
      ...GENERIC_SUCCESS,
      ...(isDev ? { dev_reset_link: resetLink, smtp_error: smtpError } : {}),
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(GENERIC_SUCCESS);
  }
}
