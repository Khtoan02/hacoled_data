"use client";
import { CalendarDays } from "lucide-react";
import { useMember } from "./session";
import { MonthlyReview } from "./monthly-review";
export function OperationalOverview() {
  const member = useMember();
  return (
    <div className="operational-overview">
      <section className="overview-greeting">
        <div>
          <h2>
            Chào {member.name.split(" ").slice(-1)[0]}, cùng xem tiến độ tháng.
          </h2>
          <p>Từ KPI được giao đến công việc, sản lượng và dấu vết bàn giao.</p>
        </div>
        <div className="overview-date">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
        <div className="dongson-pattern" aria-hidden="true" />
      </section>
      <MonthlyReview />
    </div>
  );
}
