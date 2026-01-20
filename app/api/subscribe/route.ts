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
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Send email via Mailgun
    const emailText = `New Newsletter Subscription

Email: ${email}`;

    const emailHtml = `
      <h2>New Newsletter Subscription</h2>
      <p><strong>Email:</strong> ${email}</p>
    `;

    const data = await mg.messages.create("cabipro.com", {
      from: "CabiPro Newsletter <postmaster@cabipro.com>",
      to: ["shubhkakadia@gmail.com"],
      subject: `New Newsletter Subscription: ${email}`,
      text: emailText,
      html: emailHtml,
      "h:Reply-To": email,
    });

    return NextResponse.json(
      { success: true, message: "Email sent successfully", data },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send email", details: errorMessage },
      { status: 500 },
    );
  }
}
