"use client";

import { useState, type FormEvent } from "react";

import { Announcer } from "@foundation/accessibility";
import { Button, Field, Input } from "@foundation/ui";

import { intakeConfig } from "@/config";
import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";

interface ContactFormProps {
  content: SiteContent;
}

type SubmissionState = "error" | "idle" | "submitting" | "success";

/**
 * Name and phone only. That allowlist is frozen in the brief, so this form does
 * not iterate over `intakeConfig.selectedFields` — adding a field here without
 * changing the contract would silently break the Worker and the n8n workflow.
 */
export function ContactForm({ content }: ContactFormProps) {
  const [state, setState] = useState<SubmissionState>("idle");
  const { contact } = content;
  const endpoint = siteUrl(intakeConfig.endpoint);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      contractVersion: intakeConfig.contractVersion,
      type: intakeConfig.defaultType,
      locale: content.locale,
      pagePath: window.location.pathname,
      website: String(values.get("website") ?? ""),
      name: String(values.get("name") ?? ""),
      phone: String(values.get("phone") ?? ""),
    };

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Contact request rejected");
      form.reset();
      setState("success");
    } catch {
      setState("error");
    }
  }

  const announcement =
    state === "success"
      ? contact.labels.success
      : state === "error"
        ? contact.labels.error
        : "";

  return (
    <form
      action={endpoint}
      className="contact-form"
      id="contact-form"
      method="post"
      onSubmit={submit}
    >
      <input
        name="contractVersion"
        type="hidden"
        value={intakeConfig.contractVersion}
      />
      <input name="type" type="hidden" value={intakeConfig.defaultType} />
      <input name="locale" type="hidden" value={content.locale} />

      <div aria-hidden="true" className="honeypot">
        <label htmlFor="website">Website</label>
        <input
          autoComplete="off"
          id="website"
          maxLength={intakeConfig.fieldLimits.website}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <Field htmlFor="contact-name" label={contact.labels.name} required>
        <Input
          autoComplete="name"
          dir="auto"
          id="contact-name"
          maxLength={intakeConfig.fieldLimits.name}
          name="name"
          required
        />
      </Field>

      <Field htmlFor="contact-phone" label={contact.labels.phone} required>
        <Input
          autoComplete="tel"
          dir="ltr"
          id="contact-phone"
          inputMode="tel"
          maxLength={intakeConfig.fieldLimits.phone}
          name="phone"
          required
          type="tel"
        />
      </Field>

      <p className="contact-form__privacy">{contact.labels.privacy}</p>

      <div className="contact-form__actions">
        <Button disabled={state === "submitting"} type="submit">
          {state === "submitting"
            ? contact.labels.submitting
            : contact.labels.submit}
        </Button>
        {state === "success" || state === "error" ? (
          <p className={`form-status form-status--${state}`}>{announcement}</p>
        ) : null}
      </div>

      <Announcer>{announcement}</Announcer>
    </form>
  );
}
