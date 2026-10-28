"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Panel, Notice, LoadingState, EmptyState, Drawer } from "./ui";
import { currentMonth, monthLabel, OUTPUT_TYPES } from "../../lib/kpis";
import type { PerformanceData } from "../../lib/performance";
function percent(v: number | null) {
  return v === null ? "Chưa có mẫu số" : `${v}%`;
}
function change(v: number | null) {
  return v === null
    ? "Chưa đủ dữ liệu so sánh"
    : `${v > 0 ? "+" : ""}${v} điểm %`;
}
export function MonthlyReview() {
  const [month, setMonth] = useState(currentMonth()),
    [data, setData] = useState<PerformanceData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [person, setPerson] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/performance?month=${month}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, reload]);
  const current = month === currentMonth(),
    selected = data?.people.find((p) => p.id === person);
  return (
    <div className="monthly-review">
      <div className="monthly-review-toolbar">
        <div>
          <h2>Đánh giá vận hành theo tháng</h2>
          <p>
            Sản lượng, tiến độ và mức đạt chỉ tiêu từ cùng nguồn công việc/KPI.
          </p>
        </div>
        <label>
          Tháng đánh giá
          <input
            aria-label="Tháng đánh giá vận hành"
            type="month"
            min="2000-01"
            max="2100-12"
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setPerson(null);
              }
            }}
          />
        </label>
        <button
          className="icon-button"
          aria-label="Làm mới đánh giá tháng"
          disabled={loading}
          onClick={() => setReload((n) => n + 1)}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {error && (
        <Notice>
          {error}{" "}
          <button className="text-link" onClick={() => setReload((n) => n + 1)}>
            Thử lại
          </button>
        </Notice>
      )}
      {loading ? (
        <LoadingState label="Đang tải đánh giá tháng…" />
      ) : (
        data &&
        !error && (
          <>
            <p className="review-context">
              {current
                ? "Tháng đang diễn ra: số liệu đến hiện tại; tháng trước chỉ là tham chiếu, không phải kết luận về năng lực."
                : "Đối chiếu theo kỳ đã chọn. Các báo cáo chưa được chốt kỳ và có thể thay đổi khi sửa công việc."}{" "}
              Các tỷ lệ không có mẫu số được hiển thị là chưa có dữ liệu.
            </p>
            <div className="review-metrics">
              {[
                {
                  label: "Việc đến hạn",
                  value: data.summary.due,
                  note: `${data.summary.completed_due} đã xong · ${percent(data.summary.completion_rate)}`,
                },
                {
                  label: "Việc hoàn thành trong tháng",
                  value: data.summary.completed,
                  note: `Tháng trước: ${data.previous.completed} việc`,
                },
                {
                  label: "KPI đạt / đang theo dõi",
                  value: `${data.summary.met}/${data.summary.kpis}`,
                  note: `${data.summary.exceeded} vượt chỉ tiêu`,
                },
                {
                  label: "Đúng hạn (có thời điểm)",
                  value: percent(data.summary.on_time_rate),
                  note: `${data.summary.on_time}/${data.summary.on_time_known} việc đủ dữ liệu`,
                },
                {
                  label: "Việc quá hạn chưa xong",
                  value: data.summary.overdue,
                  note: `${data.summary.no_due} việc mới chưa có hạn`,
                },
                {
                  label: "Việc hoàn thành ngoài KPI",
                  value: data.summary.extra,
                  note: "Giữ riêng khối lượng hỗ trợ/phát sinh",
                },
              ].map((m) => (
                <div key={m.label}>
                  <span>{m.label}</span>
                  <strong>{m.value}</strong>
                  <small>{m.note}</small>
                </div>
              ))}
            </div>
            <div className="review-chart-grid">
              <Panel
                title="Nhịp độ công việc 6 tháng"
                description="Đếm công việc hoàn thành theo ngày sản lượng và việc có hạn trong tháng; hai nhóm có thể khác nhau."
              >
                <div
                  className="monthly-bar-chart bar-chart"
                  role="img"
                  aria-label={data.trends
                    .map(
                      (t) =>
                        `${t.month}: ${t.completed} hoàn thành, ${t.due} đến hạn`,
                    )
                    .join("; ")}
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={data.trends.map((t) => ({
                        ...t,
                        label: monthLabel(t.month),
                      }))}
                      margin={{ top: 15, right: 15, bottom: 5, left: -20 }}
                    >
                      <CartesianGrid vertical={false} stroke="#eef0f4" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#667085" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#667085" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Bar
                        name="Hoàn thành trong tháng"
                        dataKey="completed"
                        fill="#bd2027"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Bar
                        name="Có hạn trong tháng"
                        dataKey="due"
                        fill="#f4c34e"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="review-legend">
                  <span>Đỏ: hoàn thành</span>
                  <span>Vàng: đến hạn</span>
                </div>
              </Panel>
              <Panel
                title="Sản lượng theo loại"
                description={`So sánh với ${monthLabel(data.previous_month)}. Không cộng chung bài viết, video và thiết kế.`}
              >
                {data.outputs.length ? (
                  <div className="table-scroll">
                    <table className="members-table review-output-table">
                      <thead>
                        <tr>
                          <th>Loại</th>
                          <th>Tháng chọn</th>
                          <th>Tháng trước</th>
                          <th>Chênh lệch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.outputs.map((o) => (
                          <tr key={o.output_type}>
                            <td>{OUTPUT_TYPES[o.output_type].label}</td>
                            <td>
                              {o.delivered} {OUTPUT_TYPES[o.output_type].unit}
                            </td>
                            <td>{o.previous}</td>
                            <td>
                              {o.change === null
                                ? "Chưa có nền so sánh"
                                : `${o.change > 0 ? "+" : ""}${o.change}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="Chưa có sản lượng để so sánh"
                    description="Số 0 trong báo cáo không thay cho kết quả chưa được ghi nhận."
                  />
                )}
              </Panel>
            </div>
            <Panel
              title="Nhân sự qua hai tháng"
              description="Nhân sự có công việc hoặc KPI trong hai tháng. So sánh riêng tiến độ, đúng hạn, đạt KPI và việc phát sinh; không tự xếp hạng năng lực."
            >
              <div className="table-scroll">
                <table className="members-table review-people">
                  <thead>
                    <tr>
                      <th>Nhân sự</th>
                      <th>Hoàn thành / trước</th>
                      <th>Việc đến hạn đã xong</th>
                      <th>Đúng hạn</th>
                      <th>KPI đạt / giao</th>
                      <th>Vượt / ngoài KPI</th>
                      <th>Đối chiếu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.people.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          {p.completed} / {p.previous.completed}
                        </td>
                        <td>
                          {p.completed_due}/{p.due}
                          <small className="task-channel-label">
                            {change(p.completion_change)}
                          </small>
                        </td>
                        <td>
                          {percent(p.on_time_rate)}
                          <small className="task-channel-label">
                            {change(p.on_time_change)}
                          </small>
                        </td>
                        <td>
                          {p.met}/{p.kpis}
                          <small className="task-channel-label">
                            Trước: {p.previous_met}/{p.previous_kpis}
                          </small>
                        </td>
                        <td>
                          {p.exceeded} / {p.extra}
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setPerson(p.id)}
                            aria-label={`Chi tiết tháng của ${p.name}`}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.people.length && (
                <EmptyState
                  title="Chưa có dữ liệu nhân sự trong kỳ"
                  description="Giao KPI hoặc ghi nhận công việc để bắt đầu đối chiếu."
                />
              )}
            </Panel>
            <Panel
              title="Từ chỉ tiêu đến kế hoạch làm việc"
              description="Các điểm cần rà soát để mục tiêu và công việc khớp nhau."
            >
              {data.alerts.length ? (
                <div className="review-alerts">
                  {data.alerts.map((a) => (
                    <div key={a.id}>
                      <strong>
                        {a.person} · {a.channel} ·{" "}
                        {OUTPUT_TYPES[a.output_type].label}
                      </strong>
                      <p>
                        {a.missing_work ? "Chưa liên kết công việc. " : ""}Dự
                        kiến {a.planned}/{a.target}{" "}
                        {OUTPUT_TYPES[a.output_type].unit}; thực tế trong kỳ{" "}
                        {a.delivered}.
                        {a.outside_month > 0
                          ? ` Có ${a.outside_month} hoàn thành ngoài tháng.`
                          : ""}
                      </p>
                      <Link
                        className="text-link"
                        href={`/admin/tasks?kpi=${a.id}`}
                      >
                        Đối chiếu công việc
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Chưa có chênh lệch kế hoạch cần nhắc"
                  description="Điều này không xác nhận chất lượng nội dung hoặc khả năng đạt cuối tháng."
                />
              )}
            </Panel>
            <Panel
              title="Chi tiết sản lượng & dấu vết bàn giao"
              description="Theo người, kênh chính, loại sản phẩm và tuyến nội dung. Có link/kết quả là dấu vết ghi nhận, chưa phải đánh giá chất lượng."
            >
              {data.breakdown.length ? (
                <div className="table-scroll">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Người / kênh</th>
                        <th>Loại / tuyến</th>
                        <th>Sản lượng</th>
                        <th>Định dạng / từ khóa</th>
                        <th>Có kết quả / minh chứng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.breakdown.map((b) => (
                        <tr key={b.key}>
                          <td>
                            {b.person}
                            <small className="task-channel-label">
                              {b.channel}
                            </small>
                          </td>
                          <td>
                            {OUTPUT_TYPES[b.output_type].label}
                            <small className="task-channel-label">
                              {b.pillar}
                            </small>
                          </td>
                          <td>
                            {b.quantity} {OUTPUT_TYPES[b.output_type].unit}
                            <small className="task-channel-label">
                              {b.tasks} công việc
                            </small>
                          </td>
                          <td>
                            {b.formats || "Chưa ghi định dạng"}
                            <small className="task-channel-label">
                              {b.keywords || "Chưa ghi từ khóa"}
                            </small>
                          </td>
                          <td>
                            {b.with_result}/{b.tasks} · {b.with_evidence}/
                            {b.tasks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Chưa có bàn giao trong tháng"
                  description="Kết quả xuất hiện khi công việc được hoàn thành và có ngày sản lượng."
                />
              )}
            </Panel>
            <p className="review-context">
              Checklist bàn giao: {data.summary.checklist_done}/
              {data.summary.checklist_total} mục được đánh dấu. Chưa có kết nối
              API social, chấm chất lượng, lead hoặc doanh thu. Số liệu là trạng
              thái hiện tại, chưa phải ảnh chụp kỳ đã chốt.
            </p>
          </>
        )
      )}
      {selected && data && (
        <Drawer
          title={`Đối chiếu tháng · ${selected.name}`}
          description={`${monthLabel(data.month)} so với ${monthLabel(data.previous_month)}`}
          onClose={() => setPerson(null)}
        >
          <div className="review-person-detail">
            <dl>
              <dt>Hoàn thành trong tháng</dt>
              <dd>
                {selected.completed} việc · trước {selected.previous.completed}
              </dd>
              <dt>Việc đến hạn đã hoàn thành</dt>
              <dd>
                {selected.completed_due}/{selected.due} ·{" "}
                {percent(selected.completion_rate)}
              </dd>
              <dt>Đúng hạn với thời điểm có thể kiểm tra</dt>
              <dd>
                {selected.on_time}/{selected.on_time_known} ·{" "}
                {percent(selected.on_time_rate)}
              </dd>
              <dt>KPI đạt và vượt</dt>
              <dd>
                {selected.met}/{selected.kpis} đạt, {selected.exceeded} vượt
              </dd>
              <dt>Việc ngoài KPI</dt>
              <dd>{selected.extra}</dd>
              <dt>Dấu vết kết quả / minh chứng</dt>
              <dd>
                {selected.with_result} / {selected.with_evidence} trên{" "}
                {selected.completed} việc
              </dd>
              <dt>Checklist bàn giao</dt>
              <dd>
                {selected.checklist_done}/{selected.checklist_total}
              </dd>
            </dl>
            <p className="result-hint">
              Mẫu số của tỷ lệ đúng hạn chỉ gồm việc đến hạn đã xong và có thời
              điểm hoàn thành được lưu trên server. Chưa đủ dữ liệu không được
              quy thành điểm kém.
            </p>
            <Link
              className="primary-button"
              href={`/admin/tasks?assignee=${selected.id}`}
            >
              Mở công việc của nhân sự
            </Link>
          </div>
        </Drawer>
      )}
    </div>
  );
}
