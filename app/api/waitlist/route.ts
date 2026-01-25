import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.mailgun_sending_key || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send email via Mailgun
    const emailText = `New Waitlist Signup

Name: ${name}
Email: ${email}`;

    const emailHtml = `
      <h2>New Waitlist Signup</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;

    const data = await mg.messages.create("cabipro.com", {
      from: "CabiPro Waitlist <postmaster@cabipro.com>",
      to: ["cabipro16@gmail.com"],
      subject: `New Waitlist Signup: ${name}`,
      text: emailText,
      html: emailHtml,
      "h:Reply-To": email,
    });

    return NextResponse.json(
      { success: true, message: "Email sent successfully", data },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send email", details: errorMessage },
      { status: 500 }
    );
  }
}

