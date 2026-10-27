"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Task } from "../../lib/tasks";
import { TASK_STATUSES } from "../../lib/tasks";
import { Panel } from "./ui";
const colors = {
  pending: "#f1bd45",
  in_progress: "#bd2027",
  completed: "#279b76",
};
export function TaskCharts({
  tasks,
  months = 6,
}: {
  tasks: Task[];
  months?: number;
}) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  });
  const current = formatter.format(new Date()),
    [year, month] = current.split("-").map(Number);
  const activity = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (months - 1 - i), 1));
    const key = formatter.format(d);
    return {
      month: `T${d.getUTCMonth() + 1}/${String(d.getUTCFullYear()).slice(-2)}`,
      count: tasks.filter(
        (t) => formatter.format(new Date(t.created_at)) === key,
      ).length,
    };
  });
  const distribution = Object.entries(TASK_STATUSES).map(([status, name]) => ({
    status,
    name,
    value: tasks.filter((t) => t.status === status).length,
  }));
  return (
    <div className="overview-charts">
      <Panel
        title="Nhịp độ công việc"
        description="Số công việc được tạo theo tháng trong phạm vi của bạn."
      >
        <div
          className="bar-chart"
          role="img"
          aria-label={`Công việc theo tháng: ${activity.map((d) => `${d.month}: ${d.count}`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={activity}
              margin={{ top: 16, right: 12, bottom: 0, left: -24 }}
              barSize={24}
            >
              <CartesianGrid
                vertical={false}
                stroke="#eef0f4"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#667085", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#667085", fontSize: 11 }}
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{ fill: "#fff5f4" }}
                contentStyle={{
                  border: "1px solid #e6e9ef",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(value) => [`${value} công việc`, "Đã tạo"]}
              />
              <Bar
                name="Đã tạo"
                dataKey="count"
                fill="#bd2027"
                radius={[5, 5, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel
        title="Tiến độ chung"
        description="Phân bổ trạng thái công việc hiện tại."
      >
        <div className="donut-wrap">
          {tasks.length ? (
            <>
              <div
                className="donut-chart"
                role="img"
                aria-label={`Tiến độ: ${distribution.map((d) => `${d.name}: ${d.value}`).join(", ")}`}
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      innerRadius={67}
                      outerRadius={86}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={4}
                      paddingAngle={tasks.length > 1 ? 3 : 0}
                      isAnimationActive={false}
                    >
                      {distribution.map((d) => (
                        <Cell
                          key={d.status}
                          fill={colors[d.status as keyof typeof colors]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #e6e9ef",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>
                    {Math.round((distribution[2].value / tasks.length) * 100)}%
                  </strong>
                  <span>Hoàn thành</span>
                </div>
              </div>
            </>
          ) : (
            <div className="chart-empty">Chưa có dữ liệu công việc</div>
          )}
          <div className="chart-legend">
            {distribution.map((d) => (
              <div key={d.status}>
                <span
                  style={{
                    background: colors[d.status as keyof typeof colors],
                  }}
                />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
