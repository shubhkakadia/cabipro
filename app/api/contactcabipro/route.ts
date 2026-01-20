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
    const { name, email, company, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Send email via Mailgun
    const emailText = `New Contact Form Submission
    Name: ${name}
    Email: ${email}
    Company: ${company || "Not provided"}
    Message:
    ${message}`;

    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    const data = await mg.messages.create("cabipro.com", {
      from: "CabiPro Contact Form <postmaster@cabipro.com>",
      to: ["shubhkakadia@gmail.com"],
      subject: `New Contact Form Submission from ${name}`,
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
