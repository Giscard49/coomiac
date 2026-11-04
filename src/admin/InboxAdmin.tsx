import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchInquiries, fetchInquiryReplies, recordInquiryReply } from "../lib/data";
import { auth } from "../lib/firebase";
import type { Inquiry, InquiryReply } from "../lib/models";
import { AppButton } from "../components/ui";
import { errorMessage, formatDate } from "./utils";
import { useAdminI18n } from "./i18n";

type MailStatus = { configured: boolean; from: string; provider: string; reason?: string };

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "";
}

function mailtoLink(inquiry: Inquiry, subject: string, message: string): string {
  return `mailto:${inquiry.businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

export default function InboxAdmin() {
  const { lang, t } = useAdminI18n();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<InquiryReply[] | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "replied">("all");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(t.inbox.defaultSubject);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(null);
  const [mail, setMail] = useState<MailStatus | null>(null);
  const requestedId = useMemo(() => new URLSearchParams(window.location.search).get("inquiry"), []);

  const load = useCallback(async () => {
    const list = await fetchInquiries();
    setItems(list);
    setSelectedId(
      (current) =>
        current ?? (requestedId && list.some((item) => item.id === requestedId) ? requestedId : list[0]?.id ?? null),
    );
  }, [requestedId]);

  useEffect(() => {
    load().catch((error) => setNote({ kind: "error", text: errorMessage(error, lang) }));
  }, [load, lang]);

  useEffect(() => {
    (async () => {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) return;
        const response = await fetch("/api/reply", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) {
          setMail({ configured: false, from: "coomiaec@gmail.com", provider: "none" });
          return;
        }
        setMail((await response.json()) as MailStatus);
      } catch {
        setMail({ configured: false, from: "coomiaec@gmail.com", provider: "none" });
      }
    })();
  }, []);

  const selected = useMemo(() => (items ?? []).find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    if (!selected) {
      setReplies(null);
      return;
    }
    setSubject(selected.company ? t.inbox.subjectForCompany(selected.company) : t.inbox.defaultSubject);
    setMessage(t.inbox.replyTemplate(firstName(selected.fullName)));
    setReplies(null);
    setNote(null);
    let alive = true;
    fetchInquiryReplies(selected.id)
      .then((list) => {
        if (alive) setReplies(list);
      })
      .catch(() => {
        if (alive) setReplies([]);
      });
    return () => {
      alive = false;
    };
    // Only reset the composer when the selected inquiry changes; switching the
    // admin language must not erase a draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!term) return true;
      return [item.fullName, item.company, item.businessEmail, item.message]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, filter, search]);

  const send = async () => {
    if (!selected) return;
    if (!message.trim()) {
      setNote({ kind: "error", text: t.inbox.errNoMessage });
      return;
    }
    setBusy(t.inbox.busySending);
    setNote(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error(t.inbox.errSessionExpired);

      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: selected.businessEmail,
          subject,
          message,
          quoted: selected.message,
          inquiryId: selected.id,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; from?: string };
      if (!response.ok) throw new Error(payload.error || t.inbox.errSend(response.status));

      const from = payload.from || mail?.from || "coomiaec@gmail.com";
      let persisted = true;
      try {
        await recordInquiryReply(selected.id, {
          subject,
          message,
          to: selected.businessEmail,
          from,
          sentBy: auth?.currentUser?.email ?? "",
        });
      } catch {
        persisted = false;
      }

      const sentReply: InquiryReply = {
        id: `local-${Date.now()}`,
        subject,
        message,
        to: selected.businessEmail,
        from,
        sentBy: auth?.currentUser?.email ?? "",
        sentAt: null,
      };
      setReplies((current) => [...(current ?? []), sentReply]);
      setItems((current) =>
        (current ?? []).map((item) =>
          item.id === selected.id
            ? { ...item, status: "replied", replyCount: item.replyCount + 1 }
            : item,
        ),
      );
      setMessage("");
      setNote(
        persisted
          ? { kind: "ok", text: t.inbox.replySent(selected.businessEmail, from) }
          : {
              kind: "warn",
              text: t.inbox.replySavedWarning(selected.businessEmail),
            },
      );
    } catch (error) {
      setNote({ kind: "error", text: error instanceof Error ? error.message : errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const openMail = selected ? mailtoLink(selected, subject, message) : "#";

  return (
    <>
      {note && (
        <p
          className={
            note.kind === "ok" ? "notice-ok" : note.kind === "warn" ? "notice-warn" : "notice-error"
          }
        >
          {note.text}
        </p>
      )}

      {mail && !mail.configured && (
        <section className="admin-panel admin-email-status">
          <div>
            <span className="status-badge bad">{t.inbox.notConfiguredBadge}</span>
            <h3>{t.inbox.notConfiguredTitle(mail.from)}</h3>
            <p>
              {t.inbox.notConfiguredReason}{" "}
              {t.inbox.notConfiguredMailApp}
            </p>
            <details className="error-details">
              <summary>{t.inbox.serverConfig}</summary>
              <p>{t.inbox.configIntro}</p>
              <ul className="config-list">
                <li><code>SMTP_HOST=smtp.gmail.com</code></li>
                <li><code>SMTP_PORT=465</code></li>
                <li><code>SMTP_USER=coomiaec@gmail.com</code></li>
                <li><code>SMTP_PASS=</code> {t.inbox.configAppPassword}</li>
                <li><code>REPLY_FROM_EMAIL=coomiaec@gmail.com</code></li>
              </ul>
              <p>
                {t.inbox.configAppPasswords} {t.inbox.configResend}
              </p>
            </details>
          </div>
        </section>
      )}

      <div className={`inbox${selected ? " has-selection" : ""}`}>
        <section className="admin-panel inbox-list">
          <div className="panel-head">
            <div>
              <h2>{t.inbox.title}</h2>
              <p>{items ? t.inbox.received(items.length) : t.common.loading}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={Boolean(busy)}>
              {t.common.refresh}
            </button>
          </div>

          <div className="inbox-tools">
            <div className="filters inbox-filters">
              {(["all", "new", "replied"] as const).map((value) => (
                <button
                  key={value}
                  className={filter === value ? "selected" : ""}
                  onClick={() => setFilter(value)}
                >
                  {value === "all"
                    ? t.inbox.filterAll
                    : value === "new"
                      ? t.inbox.filterAwaiting
                      : t.inbox.filterReplied}
                </button>
              ))}
            </div>
            <input
              className="inbox-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.inbox.searchPlaceholder}
              aria-label={t.inbox.searchAria}
            />
          </div>

          {items === null ? (
            <p className="muted">{t.inbox.loading}</p>
          ) : visible.length === 0 ? (
            <p className="muted">
              {items.length === 0 ? t.inbox.empty : t.inbox.noMatch}
            </p>
          ) : (
            <div className="inbox-items">
              {visible.map((inquiry) => (
                <button
                  key={inquiry.id}
                  className={`inbox-item${inquiry.id === selectedId ? " active" : ""}${inquiry.status === "new" ? " unread" : ""}`}
                  onClick={() => setSelectedId(inquiry.id)}
                >
                  <span className="inbox-avatar">{inquiry.fullName.slice(0, 1).toUpperCase() || "?"}</span>
                  <span className="inbox-item-main">
                    <span className="inbox-item-top">
                      <b>{inquiry.fullName || t.common.unnamed}</b>
                      <small>{formatDate(inquiry.createdAt, lang)}</small>
                    </span>
                    <span className="inbox-item-sub">{inquiry.company || t.common.noCompany}</span>
                    <span className="inbox-item-snippet">{inquiry.message}</span>
                    <span className="inbox-item-tags">
                      <em>{t.inbox.inquiryTypes[inquiry.inquiryType] ?? inquiry.inquiryType}</em>
                      {inquiry.replyCount > 0 && <em className="ok">{t.inbox.sentCount(inquiry.replyCount)}</em>}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel inbox-detail">
          {!selected ? (
            <p className="muted">{t.inbox.selectMessage}</p>
          ) : (
            <>
              <button className="inbox-back" onClick={() => setSelectedId(null)}>
                {t.inbox.backAll}
              </button>
              <div className="inbox-detail-head">
                <div>
                  <span className="eyebrow">{t.inbox.inquiryEyebrow(t.inbox.inquiryTypes[selected.inquiryType] ?? selected.inquiryType)}</span>
                  <h2>{selected.fullName}</h2>
                  <p>
                    {selected.company || t.common.noCompany} ·{" "}
                    <a href={`mailto:${selected.businessEmail}`}>{selected.businessEmail}</a>
                  </p>
                </div>
                <span className={`status-badge ${selected.status === "replied" ? "ok" : ""}`}>
                  {selected.status === "replied" ? t.common.statusReplied : t.common.statusAwaiting}
                </span>
              </div>

              <p className="inbox-date">{t.inbox.receivedOn(formatDate(selected.createdAt, lang))}</p>

              <blockquote className="inbox-message">{selected.message}</blockquote>

              {replies && replies.length > 0 && (
                <div className="inbox-thread">
                  <h3>{t.inbox.repliesSent}</h3>
                  {replies.map((reply) => (
                    <article key={reply.id} className="inbox-reply">
                      <div>
                        <b>{reply.subject}</b>
                        <small>{t.inbox.replyFrom(formatDate(reply.sentAt, lang), reply.from)}</small>
                      </div>
                      <p>{reply.message}</p>
                    </article>
                  ))}
                </div>
              )}

              <div className="inbox-compose">
                <h3>{t.inbox.replyTitle}</h3>
                <label>
                  {t.inbox.subject}
                  <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={180} />
                </label>
                <label>
                  {t.inbox.message}
                  <textarea rows={9} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} />
                </label>
                <div className="admin-actions">
                  <AppButton onClick={() => void send()} disabled={Boolean(busy)}>
                    {busy || t.inbox.sendReply}
                  </AppButton>
                  <a className="btn btn-outline btn-sm" href={openMail}>
                    {t.inbox.openMailApp}
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMessage(t.inbox.replyTemplate(firstName(selected.fullName)))}
                    disabled={Boolean(busy)}
                  >
                    {t.inbox.resetText}
                  </button>
                </div>
                <p className="field-hint">
                  {t.inbox.fromHintPrefix} <b>{mail?.from ?? "coomiaec@gmail.com"}</b> {t.inbox.fromHintSuffix}
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
