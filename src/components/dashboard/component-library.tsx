"use client";
import { useState } from "react";
import { Check, Download, Plus, Save, Send } from "lucide-react";
import { DashboardShell } from "./shell";
import {
  Avatar,
  Drawer,
  EmptyState,
  Notice,
  Panel,
  PriorityBadge,
  StatusBadge,
} from "./ui";
export function ComponentLibrary() {
  const [message, setMessage] = useState(""),
    [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [checked, setChecked] = useState(false);
  return (
    <DashboardShell
      title="Thư viện giao diện"
      description="Các thành phần thống nhất cho không gian HacoLED. Dữ liệu tại đây chỉ để minh họa giao diện."
    >
      {message && <Notice tone="success">{message}</Notice>}
      <div className="gallery-grid">
        <Panel
          title="Nút & thao tác"
          description="Màu đỏ dành cho thao tác chính, màu trung tính cho thao tác phụ."
        >
          <div className="gallery-body gallery-buttons">
            <button
              className="primary-button"
              onClick={() => setMessage("Đã thực hiện thao tác minh họa.")}
            >
              <Plus size={16} />
              Thêm mới
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                setMessage(
                  "Thao tác này là mẫu giao diện, không tạo file xuất.",
                )
              }
            >
              <Download size={16} />
              Xuất dữ liệu
            </button>
            <button className="primary-button" disabled>
              <Save size={16} />
              Đang lưu…
            </button>
            <button
              className="icon-button"
              aria-label="Xác nhận minh họa"
              onClick={() => setMessage("Đã xác nhận minh họa.")}
            >
              <Check size={17} />
            </button>
            <button className="secondary-button" onClick={() => setOpen(true)}>
              Mở bảng chi tiết
            </button>
          </div>
        </Panel>
        <Panel
          title="Trạng thái & độ ưu tiên"
          description="Màu sắc đi cùng nhãn chữ để dễ nhận biết."
        >
          <div className="gallery-body gallery-badges">
            <StatusBadge status="pending" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="completed" />
            <PriorityBadge priority="low" />
            <PriorityBadge priority="normal" />
            <PriorityBadge priority="high" />
            <PriorityBadge priority="urgent" />
          </div>
        </Panel>
        <Panel
          title="Form nhập liệu"
          description="Nhãn rõ ràng, có kiểm tra dữ liệu và phản hồi khi gửi."
        >
          <form
            className="gallery-body account-form"
            onSubmit={(e) => {
              e.preventDefault();
              setMessage(
                `Đã nhận nội dung minh họa: ${name}. Không lưu vào database.`,
              );
            }}
          >
            <label>
              Tiêu đề
              <input
                placeholder="Nhập tiêu đề minh họa"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Loại công việc
              <select aria-label="Loại công việc minh họa">
                <option>Nội dung</option>
                <option>Thiết kế</option>
                <option>Chiến dịch</option>
              </select>
            </label>
            <label>
              Ghi chú
              <textarea
                placeholder="Thêm hướng dẫn cho người thực hiện…"
                rows={3}
              />
            </label>
            <div className="gallery-check">
              <input
                type="checkbox"
                aria-label="Đồng ý nội dung minh họa"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span>Tôi đã kiểm tra nội dung</span>
            </div>
            <button className="primary-button" disabled={!checked}>
              <Send size={15} />
              Gửi minh họa
            </button>
          </form>
        </Panel>
        <Panel title="Thông báo">
          <div className="gallery-body">
            <Notice tone="success">Thay đổi đã được lưu thành công.</Notice>
            <Notice tone="info">Kiểm tra thông tin trước khi tiếp tục.</Notice>
            <Notice>Chưa thể lưu dữ liệu. Vui lòng thử lại.</Notice>
          </div>
        </Panel>
        <Panel title="Thành viên & avatar">
          <div className="gallery-body gallery-badges">
            <Avatar name="HacoLED" size="small" />
            <Avatar name="Marketing" />
            <Avatar name="Đội ngũ HacoLED" size="large" tone="brand" />
            <span className="member-status enabled">
              <span />
              Hoạt động
            </span>
            <span className="member-status disabled">
              <span />
              Đã khóa
            </span>
          </div>
        </Panel>
        <Panel title="Trạng thái chưa có dữ liệu">
          <EmptyState
            title="Chưa có nội dung"
            description="Hiển thị lời hướng dẫn và thao tác tiếp theo, thay vì để trống màn hình."
            action={
              <button
                className="secondary-button"
                onClick={() =>
                  setMessage("Đây là thao tác minh họa cho trạng thái trống.")
                }
              >
                <Plus size={15} />
                Tạo nội dung
              </button>
            }
          />
        </Panel>
      </div>
      {open && (
        <Drawer
          title="Bảng chi tiết minh họa"
          description="Cùng một cách trình bày cho form và nội dung chi tiết."
          onClose={() => setOpen(false)}
        >
          <div className="task-readonly">
            <h3>Nhất quán trong từng thao tác</h3>
            <p className="detail-description">
              Bạn có thể đóng bằng nút đóng, phím Escape hoặc bấm bên ngoài. Khi
              đóng, focus quay về thao tác vừa mở.
            </p>
            <button
              className="primary-button mt-6"
              onClick={() => {
                setOpen(false);
                setMessage("Đã hoàn tất thao tác minh họa.");
              }}
            >
              <Check size={16} />
              Hoàn tất
            </button>
          </div>
        </Drawer>
      )}
    </DashboardShell>
  );
}
