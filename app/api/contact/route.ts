import { NextResponse } from "next/server";

type ContactRequestBody = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

type ContactForm7Response = {
  status?: string;
  message?: string;
  invalid_fields?: {
    field?: string;
    message?: string;
  }[];
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getContactFormConfig() {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const formId = process.env.CONTACT_FORM_7_FORM_ID;

  if (!siteUrl) {
    throw new Error("WordPress site URL is not configured.");
  }

  if (!formId) {
    throw new Error("Contact Form 7 form ID is not configured.");
  }

  if (!/^\d+$/.test(formId)) {
    throw new Error("Contact Form 7 REST submissions require the numeric form ID, not the shortcode hash.");
  }

  return { siteUrl, formId };
}

export async function POST(request: Request) {
  try {
    const { siteUrl, formId } = getContactFormConfig();
    const body = (await request.json()) as ContactRequestBody;
    const name = cleanString(body.name);
    const email = cleanString(body.email).toLowerCase();
    const phone = cleanString(body.phone);
    const message = cleanString(body.message);

    if (name.length < 2) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (message.length < 5) {
      return NextResponse.json({ error: "Enter a message." }, { status: 400 });
    }

    const endpoint = new URL(`/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`, siteUrl);
    const formData = new FormData();
    const subject = `Website contact from ${name}`;
    const fullMessage = [message, "", phone ? `Phone: ${phone}` : ""].filter(Boolean).join("\n");

    formData.set("_wpcf7", formId);
    formData.set("_wpcf7_version", "6.0");
    formData.set("_wpcf7_locale", "en_US");
    formData.set("_wpcf7_unit_tag", `wpcf7-f${formId}-o1`);
    formData.set("_wpcf7_container_post", "0");
    formData.set("_wpcf7_posted_data_hash", "");
    formData.set("your-name", name);
    formData.set("your-email", email);
    formData.set("your-subject", subject);
    formData.set("your-message", fullMessage);
    formData.set("your-phone", phone);
    formData.set("name", name);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("message", message);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });
    const data = (await response.json()) as ContactForm7Response;

    if (!response.ok || data.status !== "mail_sent") {
      const validationMessage = data.invalid_fields?.find((field) => field.message)?.message;

      return NextResponse.json(
        { error: validationMessage || data.message || "Could not send your message." },
        { status: response.ok ? 400 : response.status || 502 }
      );
    }

    return NextResponse.json({
      message: data.message || "Your message has been sent."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send your message." },
      { status: 500 }
    );
  }
}
