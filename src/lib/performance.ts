import type { Kpi, OutputType } from "./kpis";
export interface PerformanceTask {
  id: string;
  title: string;
  assignee_id: string;
  assignee_name: string;
  channel_id: string | null;
  channel_name: string | null;
  output_type: OutputType;
  kpi_id: string | null;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  delivered_on: string | null;
  delivered_quantity: number;
  brief: Record<string, string>;
  result_text: string;
  has_evidence: boolean;
  checklist_done: number;
  checklist_total: number;
}
export function shiftMonth(month: string, offset: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function ratio(n: number, d: number) {
  return d ? Math.round((n / d) * 1000) / 10 : null;
}
function day(v: string | null) {
  return v
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(v))
    : null;
}
export function monthTasks(
  tasks: PerformanceTask[],
  month: string,
  now = new Date(),
) {
  const due = tasks.filter((t) => day(t.due_at)?.startsWith(month)),
    finished = tasks.filter(
      (t) =>
        t.status === "completed" &&
        (t.delivered_on || day(t.completed_at))?.startsWith(month),
    );
  const completedDue = due.filter((t) => t.status === "completed"),
    known = completedDue.filter((t) => t.completed_at),
    onTime = known.filter(
      (t) =>
        new Date(t.completed_at!).getTime() <= new Date(t.due_at!).getTime(),
    );
  return {
    due: due.length,
    completed_due: completedDue.length,
    completion_rate: ratio(completedDue.length, due.length),
    completed: finished.length,
    overdue: due.filter(
      (t) =>
        t.status !== "completed" &&
        new Date(t.due_at!).getTime() < now.getTime(),
    ).length,
    on_time: onTime.length,
    on_time_known: known.length,
    on_time_rate: ratio(onTime.length, known.length),
    extra: finished.filter((t) => !t.kpi_id).length,
    with_result: finished.filter((t) => t.result_text.trim()).length,
    with_evidence: finished.filter((t) => t.has_evidence).length,
    checklist_done: finished.reduce((s, t) => s + t.checklist_done, 0),
    checklist_total: finished.reduce((s, t) => s + t.checklist_total, 0),
    no_due: tasks.filter(
      (t) => !t.due_at && day(t.created_at)?.startsWith(month),
    ).length,
  };
}
export function summarizePerformance(
  tasks: PerformanceTask[],
  kpis: Kpi[],
  month: string,
  now = new Date(),
) {
  const previous = shiftMonth(month, -1),
    active = kpis.filter((k) => k.month === month && k.active),
    prior = kpis.filter((k) => k.month === previous && k.active);
  const selected = monthTasks(tasks, month, now),
    before = monthTasks(tasks, previous, now);
  const people = Array.from(
    new Map([
      ...tasks.map((t) => [t.assignee_id, t.assignee_name] as const),
      ...kpis.map((k) => [k.assignee_id, k.assignee_name] as const),
    ]).entries(),
  )
    .map(([id, name]) => {
      const own = tasks.filter((t) => t.assignee_id === id),
        goals = active.filter((k) => k.assignee_id === id),
        old = prior.filter((k) => k.assignee_id === id),
        cur = monthTasks(own, month, now),
        prev = monthTasks(own, previous, now);
      return {
        id,
        name,
        ...cur,
        previous: prev,
        kpis: goals.length,
        met: goals.filter((k) => k.delivered >= k.target).length,
        exceeded: goals.filter((k) => k.delivered > k.target).length,
        previous_met: old.filter((k) => k.delivered >= k.target).length,
        previous_kpis: old.length,
        completion_change:
          cur.completion_rate === null || prev.completion_rate === null
            ? null
            : Math.round((cur.completion_rate - prev.completion_rate) * 10) /
              10,
        on_time_change:
          cur.on_time_rate === null || prev.on_time_rate === null
            ? null
            : Math.round((cur.on_time_rate - prev.on_time_rate) * 10) / 10,
      };
    })
    .filter(
      (p) =>
        p.due ||
        p.completed ||
        p.kpis ||
        p.previous.completed ||
        p.previous.due ||
        p.previous_kpis,
    )
    .sort(
      (a, b) => b.completed - a.completed || a.name.localeCompare(b.name, "vi"),
    );
  const completed = tasks.filter(
    (t) =>
      t.status === "completed" &&
      (t.delivered_on || day(t.completed_at))?.startsWith(month),
  );
  const outputs = Array.from(
    new Set([
      ...completed.map((t) => t.output_type),
      ...tasks
        .filter(
          (t) =>
            t.status === "completed" &&
            (t.delivered_on || day(t.completed_at))?.startsWith(previous),
        )
        .map((t) => t.output_type),
    ]),
  ).map((type) => {
    const value = completed
        .filter((t) => t.output_type === type)
        .reduce((s, t) => s + t.delivered_quantity, 0),
      prev = tasks
        .filter(
          (t) =>
            t.status === "completed" &&
            t.output_type === type &&
            (t.delivered_on || day(t.completed_at))?.startsWith(previous),
        )
        .reduce((s, t) => s + t.delivered_quantity, 0);
    return {
      output_type: type,
      delivered: value,
      previous: prev,
      change: prev ? Math.round(((value - prev) / prev) * 1000) / 10 : null,
    };
  });
  const breakdown = Array.from(
    new Set(
      completed.map((t) =>
        [
          t.assignee_id,
          t.channel_id || "none",
          t.output_type,
          t.brief.content_pillar || "Chưa ghi tuyến nội dung",
        ].join("|"),
      ),
    ),
  ).map((key) => {
    const rows = completed.filter(
        (t) =>
          [
            t.assignee_id,
            t.channel_id || "none",
            t.output_type,
            t.brief.content_pillar || "Chưa ghi tuyến nội dung",
          ].join("|") === key,
      ),
      t = rows[0];
    return {
      key,
      assignee_id: t.assignee_id,
      person: t.assignee_name,
      channel: t.channel_name || "Chưa gắn kênh",
      output_type: t.output_type,
      pillar: t.brief.content_pillar || "Chưa ghi tuyến nội dung",
      tasks: rows.length,
      quantity: rows.reduce((s, t) => s + t.delivered_quantity, 0),
      with_result: rows.filter((t) => t.result_text.trim()).length,
      with_evidence: rows.filter((t) => t.has_evidence).length,
      formats: [
        ...new Set(rows.map((t) => t.brief.content_format).filter(Boolean)),
      ].join(", "),
      keywords: [
        ...new Set(rows.map((t) => t.brief.primary_keyword).filter(Boolean)),
      ].join(", "),
    };
  });
  const trends = Array.from({ length: 6 }, (_, i) =>
    shiftMonth(month, i - 5),
  ).map((m) => {
    const g = kpis.filter((k) => k.month === m && k.active);
    return {
      month: m,
      ...monthTasks(tasks, m, now),
      kpis: g.length,
      met: g.filter((k) => k.delivered >= k.target).length,
    };
  });
  return {
    month,
    previous_month: previous,
    summary: {
      ...selected,
      kpis: active.length,
      met: active.filter((k) => k.delivered >= k.target).length,
      exceeded: active.filter((k) => k.delivered > k.target).length,
      without_work: active.filter((k) => !k.task_count).length,
      underplanned: active.filter((k) => k.planned < k.target).length,
    },
    previous: before,
    people,
    outputs,
    breakdown,
    trends,
    alerts: active
      .filter(
        (k) => !k.task_count || k.planned < k.target || k.outside_month > 0,
      )
      .map((k) => ({
        id: k.id,
        person: k.assignee_name,
        channel: k.channel_name,
        output_type: k.output_type,
        target: k.target,
        planned: k.planned,
        delivered: k.delivered,
        outside_month: k.outside_month,
        missing_work: !k.task_count,
      })),
    as_of: now.toISOString(),
  };
}
export type PerformanceData = ReturnType<typeof summarizePerformance>;
