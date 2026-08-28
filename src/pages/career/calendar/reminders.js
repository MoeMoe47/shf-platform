// src/pages/career/calendar/reminders.js
//
// Personal reminders are the one event type a student can create/edit/
// delete in this Calendar (see build brief: students may not create
// official instructor/course/credential/administrative events, and no
// reliable multi-role permission model is wired into the Career app today
// — checked: src/dev/mockApi.js's /api/me always returns roles:["student"]
// for Career, and no RoleGuard/hasRole() usage exists anywhere under
// src/pages/career or src/router/CareerRoutes.jsx). No backend exists for
// this, so this uses the smallest safe existing persistence pattern in the
// codebase: a versioned JSON blob in localStorage (same shape of approach
// as src/pages/resume-builder/store.js and src/utils/analytics.js's ring
// buffer), with a schema version key so a future format change can migrate
// instead of silently corrupting.

const STORAGE_KEY = "career:calendar:reminders:v1";
const SCHEMA_VERSION = 1;
const CHANGE_EVENT = "career-calendar-reminders-change";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      return { version: SCHEMA_VERSION, items: [] };
    }
    return parsed;
  } catch {
    return { version: SCHEMA_VERSION, items: [] };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable/full — reminders simply won't persist this
    // session; callers still get the in-memory result back synchronously.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeReminders(handler) {
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function listReminders() {
  return readStore().items;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Returns { ok, errors } — errors keyed by field, for accessible inline messages. */
export function validateReminder(input) {
  const errors = {};
  if (!input.title || !input.title.trim()) errors.title = "Title is required.";
  else if (input.title.length > 120) errors.title = "Title must be 120 characters or fewer.";

  if (!input.date || !DATE_KEY_RE.test(input.date)) {
    errors.date = "A valid date is required.";
  } else if (Number.isNaN(new Date(input.date).getTime())) {
    errors.date = "That date isn't valid.";
  }

  if (!input.allDay) {
    if (!input.time || !TIME_RE.test(input.time)) errors.time = "Enter a time, or mark this as all-day.";
  }

  if (input.note && input.note.length > 500) errors.note = "Note must be 500 characters or fewer.";

  return { ok: Object.keys(errors).length === 0, errors };
}

export function createReminder(input) {
  const { ok, errors } = validateReminder(input);
  if (!ok) return { ok: false, errors };

  const now = new Date().toISOString();
  const item = {
    id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    date: input.date,
    time: input.allDay ? null : input.time,
    allDay: !!input.allDay,
    note: (input.note || "").trim(),
    reminderMinutes: input.reminderMinutes || null,
    createdAt: now,
    updatedAt: now,
  };
  const store = readStore();
  store.items = [...store.items, item];
  writeStore(store);
  return { ok: true, item };
}

export function updateReminder(id, patch) {
  const { ok, errors } = validateReminder({ ...patch });
  if (!ok) return { ok: false, errors };

  const store = readStore();
  let found = null;
  store.items = store.items.map((r) => {
    if (r.id !== id) return r;
    found = {
      ...r,
      title: patch.title.trim(),
      date: patch.date,
      time: patch.allDay ? null : patch.time,
      allDay: !!patch.allDay,
      note: (patch.note || "").trim(),
      reminderMinutes: patch.reminderMinutes || null,
      updatedAt: new Date().toISOString(),
    };
    return found;
  });
  if (!found) return { ok: false, errors: { title: "Reminder no longer exists." } };
  writeStore(store);
  return { ok: true, item: found };
}

export function deleteReminder(id) {
  const store = readStore();
  const before = store.items.length;
  store.items = store.items.filter((r) => r.id !== id);
  writeStore(store);
  return store.items.length < before;
}
