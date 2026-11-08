"use client";

import type { OutputType } from "../../lib/kpis";
import type { SocialChannel } from "../../lib/social";
import type { TaskBrief } from "../../lib/tasks";

const labels: Record<keyof TaskBrief, string> = {
  content_direction: "Định hướng nội dung",
  content_pillar: "Tuyến nội dung",
  content_format: "Định dạng nội dung",
  primary_keyword: "Từ khóa chính",
  slug: "Slug bài viết",
  cta: "CTA",
  website_url: "Link trỏ về Website",
  outbound_links: "Link cần trỏ đi",
  notes: "Ghi chú công việc",
};

const BRIEF_ORDER: (keyof TaskBrief)[] = [
  "content_direction",
  "content_pillar",
  "content_format",
  "primary_keyword",
  "slug",
  "cta",
  "website_url",
  "outbound_links",
  "notes",
];

export function TaskBriefFields({
  brief,
  outputType,
  selectedChannels,
  onChange,
}: {
  brief: TaskBrief;
  outputType: OutputType;
  selectedChannels: SocialChannel[];
  onChange: (brief: TaskBrief) => void;
}) {
  const platforms = new Set(selectedChannels.map((channel) => channel.platform));
  const websitePost = outputType === "post" && platforms.has("website");
  const facebookPost = outputType === "post" && platforms.has("facebook");
  const genericPost = outputType === "post" && !websitePost && !facebookPost;
  const video = ["video", "short_video", "story"].includes(outputType);

  const renderedKeys = new Set<keyof TaskBrief>();
  const update = (key: keyof TaskBrief, value: string) =>
    onChange({ ...brief, [key]: value });

  const field = (
    key: keyof TaskBrief,
    options: { required?: boolean; placeholder?: string; area?: boolean } = {},
  ) => {
    renderedKeys.add(key);
    return (
      <label key={key}>
        {labels[key]}
        {options.required ? " *" : " (nếu có)"}
        {options.area ? (
          <textarea
            rows={3}
            maxLength={3000}
            required={options.required}
            value={brief[key] || ""}
            placeholder={options.placeholder}
            onChange={(event) => update(key, event.target.value)}
          />
        ) : (
          <input
            maxLength={key === "slug" ? 200 : 3000}
            required={options.required}
            value={brief[key] || ""}
            placeholder={options.placeholder}
            onChange={(event) => update(key, event.target.value)}
          />
        )}
      </label>
    );
  };

  const primaryFields = (
    <>
      {facebookPost && (
        <div className="task-brief-group">
          <h4>Bài viết Facebook</h4>
          {field("content_pillar", {
            required: true,
            placeholder: "Ví dụ: Dự án thực tế, kiến thức LED…",
          })}
          {field("content_format", {
            required: true,
            placeholder: "Ví dụ: Bài ảnh, carousel, bài chia sẻ…",
          })}
          {field("cta", { placeholder: "Ví dụ: Nhắn tin để nhận tư vấn" })}
          {field("website_url", { placeholder: "https://hacoled.com/..." })}
        </div>
      )}
      {websitePost && (
        <div className="task-brief-group">
          <h4>Bài viết Website</h4>
          {field("primary_keyword", {
            required: true,
            placeholder: "Từ khóa SEO chính",
          })}
          {field("slug", {
            required: true,
            placeholder: "ten-bai-viet-khong-dau",
          })}
          {field("outbound_links", {
            area: true,
            placeholder: "Mỗi link một dòng hoặc ghi rõ anchor cần trỏ",
          })}
        </div>
      )}
      {genericPost && (
        <div className="task-brief-group">
          <h4>Bài đăng</h4>
          <p className="result-hint">
            Chọn kênh Facebook hoặc Website để hiện đúng bộ yêu cầu chi tiết.
          </p>
          {field("content_pillar", {
            required: true,
            placeholder: "Tuyến nội dung",
          })}
          {field("content_format", {
            required: true,
            placeholder: "Định dạng nội dung",
          })}
          {field("cta", { placeholder: "CTA mong muốn" })}
          {field("website_url", { placeholder: "Link trỏ về Website" })}
        </div>
      )}
      {video && (
        <div className="task-brief-group">
          <h4>
            {outputType === "video"
              ? "Video dài YouTube"
              : "Video dọc ngắn (Short Video / Story)"}
          </h4>
          {field("content_direction", {
            required: true,
            area: true,
            placeholder:
              "Thông điệp chính, cách triển khai, nhịp điệu và nội dung cần thể hiện…",
          })}
          {field("cta", {
            placeholder: "CTA cần xuất hiện trong video hoặc caption",
          })}
        </div>
      )}
      <div className="task-brief-group">
        <h4>
          {outputType === "other"
            ? "Chi tiết công việc cần thực hiện"
            : "Ghi chú & yêu cầu bổ sung"}
        </h4>
        {field("notes", {
          required: outputType === "other",
          area: true,
          placeholder:
            outputType === "other"
              ? "Ghi rõ cần làm việc gì và kết quả phải bàn giao."
              : "Người phụ trách, lưu ý phối hợp, link liên kết hoặc ghi chú triển khai…",
        })}
      </div>
    </>
  );

  const extraPopulatedKeys = BRIEF_ORDER.filter(
    (k) => !renderedKeys.has(k) && Boolean(brief[k]?.trim()),
  );

  return (
    <section className="task-brief-fields">
      <div className="task-brief-heading">
        <h3>Yêu cầu công việc</h3>
        <p>Biểu mẫu thay đổi theo định dạng và nền tảng kênh đã chọn.</p>
      </div>
      {primaryFields}
      {extraPopulatedKeys.length > 0 && (
        <div className="task-brief-group">
          <h4>Thông tin yêu cầu khác</h4>
          {extraPopulatedKeys.map((key) =>
            field(key, {
              area:
                key === "content_direction" ||
                key === "outbound_links" ||
                (brief[key]?.length ?? 0) > 80,
            }),
          )}
        </div>
      )}
    </section>
  );
}

export function TaskBriefSummary({ brief }: { brief: TaskBrief }) {
  const rows = BRIEF_ORDER.filter((key) => Boolean(brief[key]?.trim())).map(
    (key) => [key, brief[key]!.trim()] as const,
  );
  if (!rows.length)
    return <p className="detail-description">Chưa có yêu cầu chi tiết.</p>;
  return (
    <dl className="task-brief-summary">
      {rows.map(([key, value]) => (
        <div key={key} className="task-brief-summary-item">
          <dt>{labels[key]}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
