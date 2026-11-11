"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRepoQuery, useRepository } from "@/components/providers/RepositoryProvider";
import { RxMark } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { ANY_STAFF, eligibleStaff } from "@/lib/booking/availability";
import { buildIcs } from "@/lib/booking/ics";
import { formatMoneyCompact, priceForLevel, priceLabel } from "@/lib/booking/pricing";
import {
  dayOfMonth,
  formatDateKeyLong,
  formatDayLong,
  formatTime,
  toDateKey,
  todayKey,
  weekdayOf,
  type DateKey,
} from "@/lib/booking/time";
import { DAY_SHORT, DEPOSIT_CENTS } from "@/lib/domain/constants";
import { queries } from "@/lib/data/queries";
import { BookingError, type BookingResult } from "@/lib/data/repository";
import {
  SERVICE_CATEGORIES,
  bookingInputSchema,
  type Service,
  type ServiceCategory,
  type Settings,
  type Staff,
} from "@/lib/domain/types";
import { SITE } from "@/lib/site";
import styles from "./Booker.module.css";

const STEP_TITLES = ["Choose a service", "Choose a stylist", "Choose a time", "Your details"] as const;
const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

type Field = "name" | "phone" | "email" | "note";
type Errors = Partial<Record<Field, string>>;

interface Props {
  initialServices: Service[];
  initialStaff: Staff[];
  initialSettings: Settings;
  /** Preselect a service, e.g. from /book?service=c-bal */
  initialServiceId?: string;
  headingLevel?: "h2" | "h3";
}

export function Booker({ initialServices, initialStaff, initialSettings, initialServiceId, headingLevel = "h3" }: Props) {
  const repo = useRepository();
  const { data: services } = useRepoQuery(queries.services, initialServices);
  const { data: staff } = useRepoQuery(queries.staff, initialStaff);
  const { data: settings } = useRepoQuery(queries.settings, initialSettings);

  const startService = initialServices.some((s) => s.id === initialServiceId) ? initialServiceId : undefined;
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(startService ? 1 : 0);
  const [serviceId, setServiceId] = useState<string | null>(startService ?? null);
  const [category, setCategory] = useState<ServiceCategory>(
    initialServices.find((s) => s.id === startService)?.category ?? "Colour",
  );
  const [staffId, setStaffId] = useState<string>(ANY_STAFF);
  const [pickedDate, setPickedDate] = useState<DateKey | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const Heading = headingLevel;

  const service = services.find((s) => s.id === serviceId) ?? null;
  const today = useMemo(() => todayKey(), []);

  // Move focus to the step heading whenever the step changes, so keyboard and screen reader users land in the right place.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  /* ---------- availability ---------- */

  const openDaysQuery = useCallback(
    (r: typeof repo) =>
      serviceId ? r.getOpenDays({ serviceId, staffId, from: today, days: 21 }) : Promise.resolve([]),
    [serviceId, staffId, today],
  );
  const { data: openDays } = useRepoQuery(openDaysQuery);
  const firstOpen = openDays?.find((d) => d.open > 0)?.date ?? null;
  const date = pickedDate ?? firstOpen;

  const slotsQuery = useCallback(
    (r: typeof repo) =>
      serviceId && date ? r.getAvailability({ serviceId, staffId, date }) : Promise.resolve([]),
    [serviceId, staffId, date],
  );
  const { data: slots, ready: slotsReady } = useRepoQuery(slotsQuery);

  /* ---------- derived ---------- */

  const stylists = useMemo(
    () => (service ? eligibleStaff(staff, service) : []),
    [staff, service],
  );
  const chosenStaff = staff.find((s) => s.id === staffId);
  const price = service ? priceForLevel(service, staffId === ANY_STAFF ? "senior" : chosenStaff?.level) : 0;
  const categoryServices = services.filter((s) => s.category === category);

  /* ---------- actions ---------- */

  function chooseService(id: string) {
    setServiceId(id);
    setStaffId(ANY_STAFF);
    setPickedDate(null);
    setStartsAt(null);
  }
  function chooseStaff(id: string) {
    setStaffId(id);
    setPickedDate(null);
    setStartsAt(null);
  }
  function setField(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }
  function reset() {
    setStep(0);
    setServiceId(null);
    setStaffId(ANY_STAFF);
    setPickedDate(null);
    setStartsAt(null);
    setResult(null);
    setForm({ name: "", phone: "", email: "", note: "" });
    setErrors({});
    setShowSummary(false);
    setFormError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!serviceId || !startsAt) return;
    setFormError("");
    const parsed = bookingInputSchema.safeParse({ serviceId, staffId, startsAt, ...form });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (key in form && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setShowSummary(true);
      // put focus on the first invalid field
      const first = (["name", "phone", "email", "note"] as Field[]).find((f) => next[f]);
      if (first) rootRef.current?.querySelector<HTMLElement>(`#bk-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const booked = await repo.createAppointment(parsed.data);
      setResult(booked);
      setStep(4);
    } catch (err) {
      if (err instanceof BookingError && err.code === "unavailable") {
        setFormError(err.message);
        setStartsAt(null);
        setStep(2);
      } else if (err instanceof BookingError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again or call the salon.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function downloadIcs() {
    if (!result) return;
    const { appointment, service: svc, staff: stylist } = result;
    const ics = buildIcs({
      uid: `${appointment.id}@salonrx.ca`,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      summary: `${svc.name} at Salon Rx`,
      description: `With ${stylist.name}. 24 hours' notice to change or cancel. ${SITE.phone}`,
      location: `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}`,
      stampedAt: appointment.createdAt,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "salon-rx-appointment.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- render ---------- */

  if (!settings.acceptOnlineBookings) {
    return (
      <div className={styles.booker} id="booker" ref={rootRef}>
        <Heading className={styles.heading}>Booking paused</Heading>
        <p className={styles.hint}>
          Online booking is paused right now. Call <a href={SITE.phoneHref}>{SITE.phone}</a> and Hillary will find you a time.
        </p>
      </div>
    );
  }

  const canContinue =
    (step === 0 && !!service) || step === 1 || (step === 2 && !!date && !!startsAt) || step === 3;

  const errorList = (Object.entries(errors) as [Field, string | undefined][]).filter(([, v]) => v);

  return (
    <div className={styles.booker} id="booker" ref={rootRef}>
      <p className="sr-only" role="status" aria-live="polite">
        {step < 4 ? `Step ${step + 1} of 4: ${STEP_TITLES[step as 0 | 1 | 2 | 3]}` : "Booking confirmed"}
      </p>

      {step < 4 && (
        <ol className={styles.prog} aria-label="Booking progress">
          {STEP_TITLES.map((t, i) => (
            <li key={t} data-on={i <= step} aria-current={i === step ? "step" : undefined}>
              <span className="sr-only">
                Step {i + 1}: {t}
                {i < step ? " (done)" : ""}
              </span>
            </li>
          ))}
        </ol>
      )}

      {formError && (
        <p className={styles.alert} role="alert">
          {formError}
        </p>
      )}

      {step === 0 && (
        <>
          <Heading className={styles.heading} tabIndex={-1} ref={headingRef}>
            {STEP_TITLES[0]}
          </Heading>
          <p className={styles.hint}>One to start. Add more at the chair.</p>
          <ToggleGroup
            className={styles.cats}
            label="Service category"
            options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={category}
            onChange={setCategory}
          />
          <div className={styles.opts}>
            {categoryServices.map((s) => (
              <button key={s.id} type="button" className={styles.opt} aria-pressed={serviceId === s.id} onClick={() => chooseService(s.id)}>
                <span>
                  <b>{s.name}</b>
                  <small>
                    {s.category} · {s.durationMin} min
                  </small>
                </span>
                <span className={styles.p}>{priceLabel(s)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && service && (
        <>
          <Heading className={styles.heading} tabIndex={-1} ref={headingRef}>
            {STEP_TITLES[1]}
          </Heading>
          <p className={styles.hint}>{service.name}</p>
          <div className={styles.opts}>
            <button type="button" className={styles.opt} aria-pressed={staffId === ANY_STAFF} onClick={() => chooseStaff(ANY_STAFF)}>
              <span className={styles.who}>
                <span className={styles.mini} aria-hidden="true">
                  Rx
                </span>
                <span>
                  <b>First available</b>
                  <small>We&apos;ll match you with the right person</small>
                </span>
              </span>
            </button>
            {stylists.map((s) => (
              <button key={s.id} type="button" className={styles.opt} aria-pressed={staffId === s.id} onClick={() => chooseStaff(s.id)}>
                <span className={styles.who}>
                  <span className={styles.mini} aria-hidden="true">
                    {initials(s.name)}
                  </span>
                  <span>
                    <b>{s.name}</b>
                    <small>{s.role}</small>
                  </span>
                </span>
                <span className={styles.p}>{priceLabel(service, priceForLevel(service, s.level))}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && service && (
        <>
          <Heading className={styles.heading} tabIndex={-1} ref={headingRef}>
            {STEP_TITLES[2]}
          </Heading>
          <p className={styles.hint}>
            {service.name} · {staffId === ANY_STAFF ? "First available" : chosenStaff?.name}
          </p>
          <div className={styles.days} role="group" aria-label="Pick a day">
            {(openDays ?? []).map((d) => (
              <button
                key={d.date}
                type="button"
                className={styles.day}
                disabled={d.open === 0}
                aria-pressed={date === d.date}
                aria-label={`${formatDateKeyLong(d.date)}, ${d.open ? `${d.open} open times` : "no openings"}`}
                onClick={() => {
                  setPickedDate(d.date);
                  setStartsAt(null);
                }}
              >
                <small aria-hidden="true">{DAY_SHORT[weekdayOf(d.date)]}</small>
                <b aria-hidden="true">{dayOfMonth(d.date)}</b>
                <small aria-hidden="true">{d.open ? `${d.open} open` : "—"}</small>
              </button>
            ))}
          </div>
          <div className={styles.slots} role="group" aria-label={date ? `Times on ${formatDateKeyLong(date)}` : "Times"}>
            {slots && slots.length > 0
              ? slots.map((s) => (
                  <button key={s.startsAt} type="button" className={styles.slot} aria-pressed={startsAt === s.startsAt} onClick={() => setStartsAt(s.startsAt)}>
                    {formatTime(s.startsAt)}
                  </button>
                ))
              : slotsReady && <p className={styles.hint}>{date ? "No openings that day." : "No openings in the next three weeks. Please call us."}</p>}
          </div>
        </>
      )}

      {step === 3 && service && startsAt && (
        <form onSubmit={submit} noValidate>
          <Heading className={styles.heading} tabIndex={-1} ref={headingRef}>
            {STEP_TITLES[3]}
          </Heading>
          <p className={styles.hint}>We&apos;ll text a reminder the day before.</p>
          {showSummary && errorList.length > 0 && (
            <div className={styles.summaryErrors} role="alert">
              <b>Please fix {errorList.length === 1 ? "this" : "these"}:</b>
              <ul>
                {errorList.map(([k, v]) => (
                  <li key={k}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.fg}>
            <div className={styles.fld}>
              <label htmlFor="bk-name">Name</label>
              <input id="bk-name" autoComplete="name" value={form.name} onChange={(e) => setField("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "bk-name-err" : undefined} required />
              {errors.name && (
                <span id="bk-name-err" className={styles.err}>
                  {errors.name}
                </span>
              )}
            </div>
            <div className={styles.fld}>
              <label htmlFor="bk-phone">Mobile</label>
              <input id="bk-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "bk-phone-err" : undefined} required />
              {errors.phone && (
                <span id="bk-phone-err" className={styles.err}>
                  {errors.phone}
                </span>
              )}
            </div>
            <div className={`${styles.fld} ${styles.full}`}>
              <label htmlFor="bk-email">Email (optional)</label>
              <input id="bk-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setField("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "bk-email-err" : undefined} />
              {errors.email && (
                <span id="bk-email-err" className={styles.err}>
                  {errors.email}
                </span>
              )}
            </div>
            <div className={`${styles.fld} ${styles.full}`}>
              <label htmlFor="bk-note">Inspo, allergies, or your tea order</label>
              <textarea id="bk-note" value={form.note} onChange={(e) => setField("note", e.target.value)} aria-invalid={!!errors.note} aria-describedby={errors.note ? "bk-note-err" : undefined} />
              {errors.note && (
                <span id="bk-note-err" className={styles.err}>
                  {errors.note}
                </span>
              )}
            </div>
          </div>
          <div className={styles.sum}>
            <b>{service.name}</b>
            <span>
              {formatDayLong(startsAt)} at {formatTime(startsAt)} · {service.durationMin} min
            </span>
            <span>
              {staffId === ANY_STAFF ? "First available stylist" : chosenStaff?.name} · {priceLabel(service, price)}
            </span>
          </div>
          {settings.patchTestPrompt && service.category === "Colour" && (
            <p className={styles.pol}>First colour with us? We&apos;ll set up a quick patch test 48 hours before.</p>
          )}
          <p className={styles.pol}>
            24 hours&apos; notice to change or cancel, or a $50 rebooking charge applies.
            {settings.depositRequired && ` A ${formatMoneyCompact(DEPOSIT_CENTS)} deposit holds the spot.`}
          </p>
          <div className={styles.bnav}>
            <Button variant="line" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" variant="blue" disabled={submitting}>
              {submitting ? "Booking…" : "Confirm booking"}
            </Button>
          </div>
        </form>
      )}

      {step === 4 && result && (
        <div className={styles.done}>
          <RxMark className={styles.doneMark} />
          <Heading className={styles.heading} tabIndex={-1} ref={headingRef}>
            You&apos;re booked
          </Heading>
          <p className={styles.hint}>
            {result.service.name} with {result.staff.name}, {formatDayLong(result.appointment.startsAt)} at {formatTime(result.appointment.startsAt)}
          </p>
          <p className={styles.hint}>
            Confirmation sent{result.client.email || form.email ? ` to ${form.email || result.client.email}` : ""}. Tea&apos;s on us.
          </p>
          <div className={styles.doneActions}>
            <Button variant="line" size="sm" onClick={downloadIcs}>
              Add to calendar
            </Button>
            <Button variant="line" size="sm" onClick={reset}>
              Book another
            </Button>
            <ButtonLink size="sm" href={`/admin/calendar?date=${toDateKey(result.appointment.startsAt)}`}>
              See it in the salon calendar
            </ButtonLink>
          </div>
          <p className={styles.pol}>
            Demo: the salon calendar is the back office preview. <Link href="/admin">Open the staff demo</Link>.
          </p>
        </div>
      )}

      {step < 3 && (
        <div className={styles.bnav}>
          {step > 0 ? (
            <Button variant="line" onClick={() => setStep((step - 1) as 0 | 1 | 2)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={!canContinue} onClick={() => setStep((step + 1) as 1 | 2 | 3)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
