import { NextResponse } from "next/server";
import crypto from "crypto";
import { readSheet, appendRowByFields, getNextSeq, generateId } from "@/lib/sheets";

// One-time seed endpoint. Hit with POST /api/admin/seed-users?secret=seed2026
// Idempotent — skips users whose email already exists.

const SEED_SECRET = "seed2026";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const PASSWORD = "Crystal@123";

const SEED_USERS = [
  // ── Additional manager ───────────────────────────────────────────────
  {
    name: "Anjali Rao",
    email: "anjali@crystalgroup.in",
    mobile: "9000000010",
    department: "Sales",
    role: "manager",
    employeeType: "white_collar",
    managerId: "EMP-0002", // reports to MD
  },
  // ── White-collar employees ───────────────────────────────────────────
  {
    name: "Priya Sharma",
    email: "priya@crystalgroup.in",
    mobile: "9000000011",
    department: "Apps",
    role: "employee",
    employeeType: "white_collar",
    managerId: "EMP-0003", // under existing manager rohit
  },
  {
    name: "Rahul Verma",
    email: "rahul@crystalgroup.in",
    mobile: "9000000012",
    department: "Apps",
    role: "employee",
    employeeType: "white_collar",
    managerId: "EMP-0003",
  },
  {
    name: "Meena Patel",
    email: "meena@crystalgroup.in",
    mobile: "9000000013",
    department: "Apps",
    role: "employee",
    employeeType: "white_collar",
    managerId: "EMP-0003",
  },
  // ── Blue-collar employees ────────────────────────────────────────────
  {
    name: "Deepa Nair",
    email: "deepa@crystalgroup.in",
    mobile: "9000000014",
    department: "Sales",
    role: "employee",
    employeeType: "blue_collar",
    managerId: "", // will be set to Anjali's ID after she's created
  },
  {
    name: "Vikram Singh",
    email: "vikram@crystalgroup.in",
    mobile: "9000000015",
    department: "Sales",
    role: "employee",
    employeeType: "blue_collar",
    managerId: "", // same
  },
  {
    name: "Suresh Kumar",
    email: "suresh@crystalgroup.in",
    mobile: "9000000016",
    department: "Sales",
    role: "employee",
    employeeType: "blue_collar",
    managerId: "", // same
  },
  // ── Additional managers ──────────────────────────────────────────────────
  {
    name: "Joyeeta Ghosh Dastidar",
    email: "joyeeta.dastidar@crystalgroup.in",
    mobile: "9000000017",
    department: "HR",
    role: "manager",
    employeeType: "white_collar",
    managerId: "EMP-0002", // reports to yatish/md
  },
  {
    name: "Ankita Jain",
    email: "ankita.jain@crystalgroup.in",
    mobile: "9000000018",
    department: "Projects",
    role: "manager",
    employeeType: "white_collar",
    managerId: "EMP-0002", // reports to yatish/md
  },
];

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await readSheet("Employees") as { Email: string; Employee_ID: string; Name: string }[];
  const existingEmails = new Set(existing.map(e => e.Email?.toLowerCase()));

  const created: string[] = [];
  const skipped: string[] = [];
  let anjaliId = "";

  for (const u of SEED_USERS) {
    if (existingEmails.has(u.email.toLowerCase())) {
      skipped.push(`${u.name} (${u.email}) — already exists`);
      // If Anjali already exists, grab her ID for Sales employees
      if (u.email === "anjali@crystalgroup.in") {
        anjaliId = existing.find(e => e.Email?.toLowerCase() === u.email)?.Employee_ID ?? "";
      }
      continue;
    }

    const seq = await getNextSeq("Employees");
    const employeeId = generateId("EMP", seq);

    if (u.email === "anjali@crystalgroup.in") {
      anjaliId = employeeId;
    }

    // Assign Sales employees to Anjali once her ID is known
    const managerId =
      u.managerId === "" && anjaliId
        ? anjaliId
        : u.managerId;

    await appendRowByFields("Employees", {
      Employee_ID: employeeId,
      Name: u.name,
      Email: u.email,
      Password_Hash: hashPassword(PASSWORD),
      Mobile: u.mobile,
      Department: u.department,
      Role: u.role,
      Employee_Type: u.employeeType,
      Manager_ID: managerId,
      Join_Date: new Date().toISOString().split("T")[0],
      Status: "active",
      First_Login_Done: "false",
      Reset_Token: "",
      Reset_Token_Expiry: "",
    });

    existingEmails.add(u.email.toLowerCase());
    created.push(`${u.name} (${employeeId}) — ${u.role} / ${u.employeeType}`);
  }

  return NextResponse.json({
    created,
    skipped,
    summary: `${created.length} users created, ${skipped.length} skipped`,
    password: PASSWORD,
  });
}
