"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  getKnowledgeCategoryMeta,
  KNOWLEDGE_CATEGORIES,
  type KnowledgeCategory,
  type KnowledgeLink,
  type KnowledgePost,
} from "../../lib/knowledge";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import { Avatar, Drawer, EmptyState, LoadingState, Notice, Panel } from "./ui";

interface PostFormState {
  id?: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  content: string;
  links: KnowledgeLink[];
  pinned: boolean;
  require_ack: boolean;
  notify: boolean;
}

const EMPTY_FORM: PostFormState = {
  category: "announcement",
  title: "",
  summary: "",
  content: "",
  links: [],
  pinned: false,
  require_ack: true,
  notify: true,
};

const QUICK_TEMPLATES: Record<
  KnowledgeCategory,
  { title: string; summary: string; content: string }
> = {
  announcement: {
    title: "Thông báo: [Nhập chủ đề thông báo]",
    summary: "Tóm tắt nội dung chính cần toàn bộ thành viên nắm bắt và thực hiện.",
    content: `## 1. Nội dung thông báo
- **Mục tiêu / lý do áp dụng:**
- **Thời gian bắt đầu hiệu lực:**
- **Đối tượng áp dụng:** Toàn bộ đội ngũ Marketing & Sales HacoLED.

## 2. Những điểm cần lưu ý thực hiện
- Bước 1:
- Bước 2:
- Bước 3:

## 3. Đầu mối hỗ trợ
- Liên hệ Leader Marketing khi cần giải đáp hoặc xử lý tình huống phát sinh.`,
  },
  sop: {
    title: "Quy trình (SOP): [Tên quy trình vận hành]",
    summary: "Quy trình chuẩn hóa các bước thực thi và bàn giao giữa các vị trí trong team.",
    content: `## 1. Mục đích & Phạm vi áp dụng
- **Mục đích chuẩn hóa quy trình:**
- **Nhân sự chịu trách nhiệm thực thi:**

## 2. Các bước thực hiện chi tiết (SOP)
1. **Bước 1 — Tiếp nhận & Chuẩn bị:**
   - Kiểm tra đầy đủ thông tin đầu vào / brief.
2. **Bước 2 — Triển khai thực hiện:**
   - Thực hiện theo checklist tiêu chuẩn chất lượng HacoLED.
3. **Bước 3 — Kiểm duyệt & Nghiệm thu:**
   - Gửi link bằng chứng và báo cáo kết quả trên hệ thống.

## 3. Checklist kiểm tra trước khi hoàn tất
- [ ] Đúng định dạng & chuẩn nhận diện thương hiệu HacoLED
- [ ] Đã đính kèm link nghiệm thu đầy đủ
- [ ] Đã cập nhật trạng thái trên bảng Công việc`,
  },
  knowledge: {
    title: "Kiến thức & Tài liệu: [Chủ đề kiến thức / sản phẩm]",
    summary: "Tài liệu tổng hợp kiến thức chuyên môn, thông số kỹ thuật và kinh nghiệm triển khai.",
    content: `## 1. Tổng quan kiến thức
- **Bối cảnh & ứng dụng thực tế tại HacoLED:**
- **Giá trị cốt lõi cần nhớ:**

## 2. Bảng tóm tắt nội dung / Kịch bản
| Hạng mục | Nội dung chi tiết | Lưu ý triển khai |
|---|---|---|
| Hạng mục 1 | Mô tả nội dung 1 | Ghi chú thực tế |
| Hạng mục 2 | Mô tả nội dung 2 | Ghi chú thực tế |

## 3. Lưu ý thường gặp & Cách xử lý
- Tình huống 1:
- Tình huống 2:`,
  },
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatRelativeDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return formatDateTime(iso);
  } catch {
    return iso;
  }
}

function formatDurationSeconds(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(Number(seconds ?? 0)));
  if (s === 0) return "0 giây";
  if (s < 60) return `${s} giây`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${mins}p ${rem}s` : `${mins} phút`;
}

function CategoryIcon({
  category,
  size = 16,
}: {
  category: KnowledgeCategory;
  size?: number;
}) {
  if (category === "announcement") return <Megaphone size={size} />;
  if (category === "sop") return <ClipboardCheck size={size} />;
  return <BookOpen size={size} />;
}

function stripMarkdownPreview(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .join(" ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/[*_~`#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 210);
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex =
    /(`[^`\n]+`|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|\*(?!\s)([^*\n]+?)(?<!\s)\*|(?<![\w/])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w/])|https?:\/\/[^\s<)]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const full = match[0];

    if (full.startsWith("`") && full.endsWith("`")) {
      nodes.push(
        <code key={`code-${key++}`} className="knowledge-inline-code">
          {full.slice(1, -1)}
        </code>,
      );
    } else if (match[2] !== undefined && match[3] !== undefined) {
      nodes.push(
        <a
          key={`link-${key++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="knowledge-inline-link"
        >
          {renderInlineMarkdown(match[2])}
        </a>,
      );
    } else if (match[4] !== undefined || match[5] !== undefined) {
      const inner = match[4] ?? match[5] ?? "";
      nodes.push(
        <strong key={`bold-${key++}`} className="knowledge-inline-bold">
          {renderInlineMarkdown(inner)}
        </strong>,
      );
    } else if (match[6] !== undefined) {
      nodes.push(<del key={`del-${key++}`}>{renderInlineMarkdown(match[6])}</del>);
    } else if (match[7] !== undefined || match[8] !== undefined) {
      const inner = match[7] ?? match[8] ?? "";
      nodes.push(<em key={`em-${key++}`}>{renderInlineMarkdown(inner)}</em>);
    } else if (/^https?:\/\//i.test(full)) {
      nodes.push(
        <a
          key={`url-${key++}`}
          href={full}
          target="_blank"
          rel="noopener noreferrer"
          className="knowledge-inline-link"
        >
          {full}
        </a>,
      );
    } else {
      nodes.push(full);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function isTableRowLine(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  const pipeCount = (t.match(/\|/g) ?? []).length;
  return pipeCount >= 2;
}

function isTableSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 &&
    cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))
  );
}

function parseTableCells(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((cell) => cell.trim());
}

function FormattedContent({ content }: { content: string }) {
  const rawLines = content.split(/\r?\n/);

  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const curr = rawLines[i];
    const trimmed = curr.trim();
    if (
      trimmed.startsWith("|") &&
      !trimmed.endsWith("|") &&
      i + 1 < rawLines.length &&
      rawLines[i + 1].trim() !== "" &&
      !rawLines[i + 1].trim().startsWith("|") &&
      !rawLines[i + 1].trim().startsWith("#")
    ) {
      let merged = trimmed;
      while (
        i + 1 < rawLines.length &&
        rawLines[i + 1].trim() !== "" &&
        !rawLines[i + 1].trim().startsWith("|")
      ) {
        i++;
        merged += " " + rawLines[i].trim();
        if (merged.endsWith("|")) break;
      }
      lines.push(merged);
    } else {
      lines.push(curr);
    }
  }

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="knowledge-content-spacer" />);
      i++;
      continue;
    }

    // 1. Fenced code block ```...```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      elements.push(
        <pre key={`pre-${i}`} className="knowledge-code-block">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // 2. Markdown Table
    if (isTableRowLine(trimmed)) {
      const tableLines: string[] = [trimmed];
      let cursor = i + 1;
      while (cursor < lines.length) {
        const nextTrimmed = lines[cursor].trim();
        if (!nextTrimmed) {
          let lookahead = cursor + 1;
          while (lookahead < lines.length && !lines[lookahead].trim()) {
            lookahead++;
          }
          if (lookahead < lines.length && isTableRowLine(lines[lookahead].trim())) {
            cursor = lookahead;
            continue;
          }
          break;
        }
        if (isTableRowLine(nextTrimmed)) {
          tableLines.push(nextTrimmed);
          cursor++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2) {
        const parsedRows = tableLines.map(parseTableCells);
        const sepIndex = parsedRows.findIndex(isTableSeparatorRow);
        const headerCells = parsedRows[0];
        const bodyRows =
          sepIndex === 1
            ? parsedRows.slice(2)
            : sepIndex > 1
              ? parsedRows.filter((_, idx) => idx !== 0 && idx !== sepIndex)
              : parsedRows.slice(1);
        const colCount = Math.max(
          headerCells.length,
          ...bodyRows.map((r) => r.length),
        );

        elements.push(
          <div key={`tbl-${i}`} className="knowledge-md-table-wrap">
            <table className="knowledge-md-table">
              <thead>
                <tr>
                  {Array.from({ length: colCount }, (_, colIdx) => (
                    <th key={colIdx}>
                      {renderInlineMarkdown(headerCells[colIdx] ?? "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {Array.from({ length: colCount }, (_, colIdx) => (
                      <td key={colIdx}>
                        {renderInlineMarkdown(row[colIdx] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        i = cursor;
        continue;
      }
    }

    // 3. Horizontal Rule
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="knowledge-hr" />);
      i++;
      continue;
    }

    // 4. Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/\s+#+\s*$/, "");
      if (level === 1) {
        elements.push(
          <h2 key={`h1-${i}`} className="knowledge-content-h2">
            {renderInlineMarkdown(text)}
          </h2>,
        );
      } else if (level === 2) {
        elements.push(
          <h3 key={`h2-${i}`} className="knowledge-content-h3">
            {renderInlineMarkdown(text)}
          </h3>,
        );
      } else {
        elements.push(
          <h4 key={`h3-${i}`} className="knowledge-content-h4">
            {renderInlineMarkdown(text)}
          </h4>,
        );
      }
      i++;
      continue;
    }

    // 5. Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="knowledge-blockquote">
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{renderInlineMarkdown(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // 6. Checklist
    if (/^[-*•]\s*\[[ xX]\]\s+/.test(trimmed)) {
      const checked = /^[-*•]\s*\[[xX]\]/.test(trimmed);
      const text = trimmed.replace(/^[-*•]\s*\[[ xX]\]\s+/, "");
      elements.push(
        <div key={`chk-${i}`} className="knowledge-content-checklist">
          <span
            className={`knowledge-check-box ${checked ? "is-checked" : ""}`}
            aria-hidden="true"
          >
            {checked ? "✓" : ""}
          </span>
          <span>{renderInlineMarkdown(text)}</span>
        </div>,
      );
      i++;
      continue;
    }

    // 7. Bullet list
    if (/^[-*+•]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*+•]\s+/, "");
      const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
      elements.push(
        <div
          key={`bul-${i}`}
          className={`knowledge-content-bullet ${indent >= 2 ? "is-nested" : ""}`}
        >
          <span className="knowledge-bullet-dot" aria-hidden="true" />
          <span>{renderInlineMarkdown(text)}</span>
        </div>,
      );
      i++;
      continue;
    }

    // 8. Numbered list
    const numMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="knowledge-content-numbered">
          <strong className="knowledge-number-prefix">{numMatch[1]}</strong>
          <span>{renderInlineMarkdown(numMatch[2])}</span>
        </div>,
      );
      i++;
      continue;
    }

    // 9. Paragraph
    elements.push(
      <p key={`p-${i}`} className="knowledge-content-paragraph">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
    i++;
  }

  return <div className="knowledge-formatted-content">{elements}</div>;
}

function comprehensionTone(percent: number): "high" | "medium" | "low" {
  if (percent >= 75) return "high";
  if (percent >= 45) return "medium";
  return "low";
}

export function KnowledgePage() {
  const member = useMember();
  const isLeader = member.role === "lead_marketing";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPostId = searchParams.get("post");

  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<"all" | KnowledgeCategory>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unread" | "unacknowledged" | "pinned"
  >("all");
  const [search, setSearch] = useState("");

  // Active full-page document reader
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [readerTab, setReaderTab] = useState<"all" | "viewed" | "unviewed">("all");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Live reading telemetry state for the currently opened post
  const articleRef = useRef<HTMLDivElement | null>(null);
  const pendingReadSecondsRef = useRef(0);
  const maxScrollPercentRef = useRef(30);
  const viewedRecordedRef = useRef<Set<string>>(new Set());

  // Create / Edit drawer (Leader only)
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chưa tải được danh sách thông báo & quy trình.");
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      if (data.total_members != null) {
        setTotalMembers(Number(data.total_members));
      }
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Chưa tải được danh sách thông báo & quy trình.",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // Open post from URL query parameter ?post=...
  useEffect(() => {
    if (queryPostId && posts.some((p) => p.id === queryPostId)) {
      setSelectedPostId(queryPostId);
    }
  }, [queryPostId, posts]);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  // Calculate current scroll depth of the article element in the viewport
  const updateArticleScrollDepth = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.height <= 0) return;

    // How far down the bottom of the viewport has reached relative to the article
    const seenPixels = viewportHeight - rect.top;
    const rawPct = Math.round((seenPixels / rect.height) * 100);
    const clamped = Math.max(25, Math.min(100, rawPct));
    if (clamped > maxScrollPercentRef.current) {
      maxScrollPercentRef.current = clamped;
    }
  }, []);

  // Flush reading progress (time + scroll depth) to the server
  const flushReadingProgress = useCallback(
    async (postId: string, refreshAfter = false) => {
      const delta = pendingReadSecondsRef.current;
      const scroll = maxScrollPercentRef.current;
      if (delta <= 0 && scroll <= 25) return;
      pendingReadSecondsRef.current = 0;
      try {
        await fetch("/api/knowledge", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: postId,
            action: "progress",
            read_seconds_delta: delta,
            scroll_percent: scroll,
          }),
        });
        if (refreshAfter) {
          await loadPosts(true);
        }
      } catch {
        // Ignore transient network errors
      }
    },
    [loadPosts],
  );

  // Record initial view + track active reading seconds and scroll depth while selectedPostId is open
  useEffect(() => {
    if (!selectedPostId) return;

    pendingReadSecondsRef.current = 0;
    maxScrollPercentRef.current = 30;

    // Scroll to top of workspace when opening a document
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Record view once per open
    if (!viewedRecordedRef.current.has(selectedPostId)) {
      viewedRecordedRef.current.add(selectedPostId);
      void (async () => {
        try {
          updateArticleScrollDepth();
          const res = await fetch("/api/knowledge", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedPostId,
              action: "view",
              read_seconds_delta: 2,
              scroll_percent: maxScrollPercentRef.current,
            }),
          });
          if (res.ok) {
            await loadPosts(true);
          }
        } catch {
          // Ignore transient error
        }
      })();
    }

    const onScroll = () => {
      updateArticleScrollDepth();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const initialTimer = setTimeout(updateArticleScrollDepth, 300);

    // 1-second active reading clock + periodic sync every 6 seconds
    let ticks = 0;
    const interval = setInterval(() => {
      if (document.hidden) return;
      pendingReadSecondsRef.current += 1;
      updateArticleScrollDepth();
      // If article is short enough to fit on screen and user read >= 5s, mark 100% scroll depth
      const el = articleRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.height <= window.innerHeight * 0.95 && pendingReadSecondsRef.current >= 4) {
          maxScrollPercentRef.current = 100;
        }
      }
      ticks++;
      if (ticks % 6 === 0) {
        void flushReadingProgress(selectedPostId, true);
      }
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      void flushReadingProgress(selectedPostId, false);
    };
  }, [selectedPostId, loadPosts, updateArticleScrollDepth, flushReadingProgress]);

  function openPostDetail(post: KnowledgePost) {
    viewedRecordedRef.current.delete(post.id);
    setReaderTab("all");
    setConfirmDeleteId(null);
    setSelectedPostId(post.id);
    router.replace(`/admin/knowledge?post=${encodeURIComponent(post.id)}`, {
      scroll: false,
    });
  }

  async function closePostDetail() {
    const closingId = selectedPostId;
    setSelectedPostId(null);
    setConfirmDeleteId(null);
    router.replace("/admin/knowledge", { scroll: false });
    if (closingId) {
      await flushReadingProgress(closingId, true);
    }
  }

  async function handleAcknowledge(post: KnowledgePost) {
    setAcknowledgingId(post.id);
    setError("");
    const delta = pendingReadSecondsRef.current;
    pendingReadSecondsRef.current = 0;
    updateArticleScrollDepth();
    try {
      const res = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          action: "acknowledge",
          read_seconds_delta: Math.max(3, delta),
          scroll_percent: Math.max(90, maxScrollPercentRef.current),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chưa xác nhận được. Vui lòng thử lại.");
      }
      setNotice(`Đã xác nhận nắm bắt: "${post.title}"`);
      await loadPosts(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa xác nhận được.");
    } finally {
      setAcknowledgingId(null);
    }
  }

  function openCreateModal(defaultCategory: KnowledgeCategory = "announcement") {
    setForm({
      ...EMPTY_FORM,
      category: defaultCategory,
    });
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  function openEditModal(post: KnowledgePost) {
    setForm({
      id: post.id,
      category: post.category,
      title: post.title,
      summary: post.summary,
      content: post.content,
      links: post.links.length ? [...post.links] : [],
      pinned: post.pinned,
      require_ack: post.require_ack,
      notify: false,
    });
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  async function handleTogglePin(post: KnowledgePost) {
    if (!isLeader) return;
    setError("");
    try {
      const res = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          category: post.category,
          summary: post.summary,
          content: post.content,
          links: post.links,
          pinned: !post.pinned,
          require_ack: post.require_ack,
          notify: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật trạng thái ghim.");
      }
      setNotice(
        !post.pinned
          ? `Đã ghim "${post.title}" lên đầu trang.`
          : `Đã bỏ ghim "${post.title}".`,
      );
      await loadPosts(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi cập nhật ghim.");
    }
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!isLeader) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch("/api/knowledge", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: form.id } : {}),
          category: form.category,
          title: form.title,
          summary: form.summary,
          content: form.content,
          links: form.links.filter((l) => l.url.trim()),
          pinned: form.pinned,
          require_ack: form.require_ack,
          notify: form.notify,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chưa lưu được bài viết.");
      }
      setEditorOpen(false);
      setNotice(
        isEdit
          ? "Đã cập nhật nội dung thành công."
          : form.notify
            ? "Đã đăng bài mới và gửi thông báo cho toàn bộ thành viên."
            : "Đã đăng bài mới thành công.",
      );
      await loadPosts(true);
      if (data.id) {
        setSelectedPostId(String(data.id));
        router.replace(`/admin/knowledge?post=${encodeURIComponent(String(data.id))}`, {
          scroll: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa lưu được bài viết.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePost(post: KnowledgePost) {
    if (!isLeader) return;
    setDeletingId(post.id);
    setError("");
    try {
      const res = await fetch(`/api/knowledge?id=${encodeURIComponent(post.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa bài viết.");
      }
      if (selectedPostId === post.id) {
        setSelectedPostId(null);
        router.replace("/admin/knowledge", { scroll: false });
      }
      setNotice(`Đã xóa bài viết "${post.title}".`);
      await loadPosts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa bài viết.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  // Computed metrics
  const stats = useMemo(() => {
    const announcements = posts.filter((p) => p.category === "announcement").length;
    const sops = posts.filter((p) => p.category === "sop").length;
    const docs = posts.filter((p) => p.category === "knowledge").length;
    const myUnread = posts.filter((p) => !p.my_viewed).length;
    const myNeedAck = posts.filter(
      (p) =>
        p.require_ack &&
        (!p.my_acknowledged || (p.my_acknowledged_version ?? 1) < p.version),
    ).length;

    let avgViewRate = 0;
    let avgAckRate = 0;
    let avgComprehension = 0;
    let avgReadSec = 0;

    if (isLeader && posts.length > 0 && totalMembers > 0) {
      const totalPossible = posts.length * totalMembers;
      const sumViews = posts.reduce((acc, p) => acc + (p.viewed_count ?? 0), 0);
      const sumAcks = posts.reduce((acc, p) => acc + (p.acknowledged_count ?? 0), 0);
      avgViewRate = Math.round((sumViews / totalPossible) * 100);
      avgAckRate = Math.round((sumAcks / totalPossible) * 100);

      const postsWithViews = posts.filter((p) => (p.viewed_count ?? 0) > 0);
      if (postsWithViews.length > 0) {
        avgComprehension = Math.round(
          postsWithViews.reduce(
            (acc, p) => acc + (p.avg_comprehension_percent ?? 0),
            0,
          ) / postsWithViews.length,
        );
        avgReadSec = Math.round(
          postsWithViews.reduce((acc, p) => acc + (p.avg_read_seconds ?? 0), 0) /
            postsWithViews.length,
        );
      }
    }

    return {
      total: posts.length,
      announcements,
      sops,
      docs,
      myUnread,
      myNeedAck,
      avgViewRate,
      avgAckRate,
      avgComprehension,
      avgReadSec,
    };
  }, [posts, totalMembers, isLeader]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi");
    return posts.filter((post) => {
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "unread" && post.my_viewed) {
        return false;
      }
      if (
        statusFilter === "unacknowledged" &&
        (!post.require_ack ||
          (post.my_acknowledged && (post.my_acknowledged_version ?? 1) >= post.version))
      ) {
        return false;
      }
      if (statusFilter === "pinned" && !post.pinned) {
        return false;
      }
      if (q) {
        const hay =
          `${post.title} ${post.summary} ${post.content} ${post.author_name}`.toLocaleLowerCase(
            "vi",
          );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, categoryFilter, statusFilter, search]);

  return (
    <DashboardShell
      title="Thông báo, Quy trình & Kiến thức"
      description="Trung tâm thông báo nội bộ, quy trình vận hành chuẩn (SOP) và tài liệu kiến thức chung cho toàn đội ngũ HacoLED."
      actions={
        <div className="knowledge-top-actions">
          {selectedPost ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => void closePostDetail()}
            >
              <ArrowLeft size={15} />
              Quay lại danh sách
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadPosts()}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Tải lại
            </button>
          )}
          {isLeader && (
            <button
              type="button"
              className="primary-button"
              onClick={() => openCreateModal("announcement")}
            >
              <Plus size={16} />
              Đăng thông báo / quy trình
            </button>
          )}
        </div>
      }
    >
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {/* FULL-PAGE DOCUMENT READER VIEW (Không nằm trong sidebar/drawer hẹp) */}
      {selectedPost ? (
        <div className="knowledge-reader-view">
          {/* Reader Top Navigation Bar */}
          <div className="knowledge-reader-topbar">
            <button
              type="button"
              className="secondary-button"
              onClick={() => void closePostDetail()}
            >
              <ArrowLeft size={16} />
              Quay lại danh sách ({posts.length} bài)
            </button>

            <div className="knowledge-reader-topbar-right">
              {isLeader && (
                <div className="knowledge-leader-actions">
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => void handleTogglePin(selectedPost)}
                  >
                    <Pin size={14} />
                    {selectedPost.pinned ? "Bỏ ghim" : "Ghim đầu trang"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => openEditModal(selectedPost)}
                  >
                    <Edit3 size={14} />
                    Chỉnh sửa nội dung
                  </button>
                  {confirmDeleteId === selectedPost.id ? (
                    <div className="knowledge-delete-confirm">
                      <span>Xác nhận xóa?</span>
                      <button
                        type="button"
                        className="danger-button compact"
                        disabled={deletingId === selectedPost.id}
                        onClick={() => void handleDeletePost(selectedPost)}
                      >
                        {deletingId === selectedPost.id ? "Đang xóa…" : "Xóa vĩnh viễn"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button compact"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button compact danger-text"
                      onClick={() => setConfirmDeleteId(selectedPost.id)}
                    >
                      <Trash2 size={14} />
                      Xóa bài
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Large Article Document */}
          <article className="knowledge-document-paper" ref={articleRef}>
            <header className="knowledge-document-header">
              <div className="knowledge-card-badges">
                {selectedPost.pinned && (
                  <span className="knowledge-badge pinned">
                    <Pin size={13} />
                    Đã ghim quan trọng
                  </span>
                )}
                <span className={`knowledge-badge category-${selectedPost.category}`}>
                  <CategoryIcon category={selectedPost.category} size={14} />
                  {getKnowledgeCategoryMeta(selectedPost.category).label}
                </span>
                <span className="knowledge-badge version">
                  Phiên bản v{selectedPost.version}
                </span>
                <span className="knowledge-badge read-time">
                  <Timer size={13} />
                  Thời lượng đọc dự kiến: ~
                  {formatDurationSeconds(selectedPost.expected_read_seconds)}
                </span>
              </div>

              <h2 className="knowledge-document-title">{selectedPost.title}</h2>

              <div className="knowledge-document-byline">
                <div className="knowledge-author-meta">
                  <Avatar name={selectedPost.author_name} size="small" tone="brand" />
                  <div>
                    <strong>{selectedPost.author_name}</strong>
                    <small>
                      Ban hành: {formatDateTime(selectedPost.created_at)}
                      {selectedPost.updated_at !== selectedPost.created_at
                        ? ` · Cập nhật: ${formatDateTime(selectedPost.updated_at)}`
                        : ""}
                    </small>
                  </div>
                </div>

                <div className="knowledge-my-status-banner">
                  {selectedPost.my_acknowledged &&
                  (selectedPost.my_acknowledged_version ?? 1) >=
                    selectedPost.version ? (
                    <span className="knowledge-read-pill acknowledged">
                      <CheckCheck size={14} />
                      Bạn đã xác nhận nắm bắt
                    </span>
                  ) : (
                    <span className="knowledge-read-pill pending">
                      <Clock size={14} />
                      Cần xác nhận sau khi đọc xong
                    </span>
                  )}
                </div>
              </div>

              {selectedPost.summary && (
                <div className="knowledge-document-summary">
                  <strong>Tóm tắt trọng tâm:</strong> {selectedPost.summary}
                </div>
              )}
            </header>

            <div className="knowledge-document-content">
              <FormattedContent content={selectedPost.content} />
            </div>

            {/* Attached Reference Links */}
            {selectedPost.links.length > 0 && (
              <div className="knowledge-detail-links">
                <h3>
                  <Link2 size={17} />
                  Tài liệu, biểu mẫu & liên kết đính kèm ({selectedPost.links.length})
                </h3>
                <div className="knowledge-detail-links-list">
                  {selectedPost.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="knowledge-detail-link-item"
                    >
                      <div>
                        <strong>{link.label}</strong>
                        <small>{link.url}</small>
                      </div>
                      <ExternalLink size={16} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledgment Action Box */}
            <div className="knowledge-ack-box">
              <div className="knowledge-ack-info">
                <strong>
                  {selectedPost.my_acknowledged &&
                  (selectedPost.my_acknowledged_version ?? 1) >=
                    selectedPost.version ? (
                    <span className="ack-done-title">
                      <CheckCircle2 size={20} />
                      Bạn đã xác nhận nắm bắt nội dung này
                    </span>
                  ) : (
                    <span className="ack-pending-title">
                      <ClipboardCheck size={20} />
                      Xác nhận đã đọc & nắm bắt nội dung
                    </span>
                  )}
                </strong>
                <p>
                  {selectedPost.my_acknowledged &&
                  (selectedPost.my_acknowledged_version ?? 1) >=
                    selectedPost.version
                    ? `Xác nhận lúc ${formatDateTime(
                        selectedPost.my_acknowledged_at,
                      )} (Phiên bản v${
                        selectedPost.my_acknowledged_version ?? 1
                      }). Hệ thống đã ghi nhận bạn hoàn tất đọc tài liệu này.`
                    : "Sau khi đọc kỹ toàn bộ nội dung trên, hãy bấm nút xác nhận bên cạnh để hoàn tất việc nắm bắt thông báo / quy trình."}
                </p>
              </div>

              {(!selectedPost.my_acknowledged ||
                (selectedPost.my_acknowledged_version ?? 1) <
                  selectedPost.version) && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={acknowledgingId === selectedPost.id}
                  onClick={() => void handleAcknowledge(selectedPost)}
                >
                  <CheckCheck size={17} />
                  {acknowledgingId === selectedPost.id
                    ? "Đang ghi nhận…"
                    : "Xác nhận đã nắm bắt"}
                </button>
              )}
            </div>
          </article>

          {/* LEADER-ONLY READERSHIP & COMPREHENSION ANALYTICS SECTION */}
          {isLeader && selectedPost.readers && (
            <section
              className="knowledge-leader-analytics-panel"
              aria-label="Đo lường thành viên đã xem và mức độ nắm bắt"
            >
              <div className="knowledge-analytics-head">
                <div>
                  <span className="knowledge-leader-only-badge">
                    🔒 Chỉ hiển thị với Leader Marketing
                  </span>
                  <h3>
                    <Activity size={19} />
                    Đo lường thành viên đã xem, thời gian đọc & % nắm bắt nội dung
                  </h3>
                  <p>
                    Điểm <strong>% Nắm bắt nội dung</strong> được hệ thống tự động tính toán cho từng người dựa trên 4 chỉ số thực tế:{" "}
                    <strong>Thời gian đọc thực tế (40%)</strong> so với thời lượng chuẩn (~
                    {formatDurationSeconds(selectedPost.expected_read_seconds)}),{" "}
                    <strong>Độ sâu cuộn đọc bài viết (30%)</strong>,{" "}
                    <strong>Xác nhận nắm bắt (20%)</strong> và{" "}
                    <strong>Lượt mở xem / ôn lại (10%)</strong>.
                  </p>
                </div>

                <div className="knowledge-readers-tabs">
                  <button
                    type="button"
                    className={`knowledge-subtab ${readerTab === "all" ? "active" : ""}`}
                    onClick={() => setReaderTab("all")}
                  >
                    Tất cả ({selectedPost.total_members ?? 0})
                  </button>
                  <button
                    type="button"
                    className={`knowledge-subtab ${
                      readerTab === "viewed" ? "active" : ""
                    }`}
                    onClick={() => setReaderTab("viewed")}
                  >
                    Đã mở xem ({selectedPost.viewed_count ?? 0})
                  </button>
                  <button
                    type="button"
                    className={`knowledge-subtab ${
                      readerTab === "unviewed" ? "active" : ""
                    }`}
                    onClick={() => setReaderTab("unviewed")}
                  >
                    Chưa xem (
                    {Math.max(
                      0,
                      (selectedPost.total_members ?? 0) -
                        (selectedPost.viewed_count ?? 0),
                    )}
                    )
                  </button>
                </div>
              </div>

              {/* 4 Summary Analytics Cards for This Document */}
              <div className="knowledge-doc-metrics-grid">
                <div className="knowledge-doc-metric-box">
                  <span>Số thành viên đã mở xem</span>
                  <strong>
                    {selectedPost.viewed_count ?? 0} /{" "}
                    {selectedPost.total_members ?? 0} người
                  </strong>
                  <small>
                    Còn{" "}
                    {Math.max(
                      0,
                      (selectedPost.total_members ?? 0) -
                        (selectedPost.viewed_count ?? 0),
                    )}{" "}
                    thành viên chưa mở bài viết
                  </small>
                </div>

                <div className="knowledge-doc-metric-box">
                  <span>Thời gian xem trung bình</span>
                  <strong>
                    {formatDurationSeconds(selectedPost.avg_read_seconds ?? 0)}
                  </strong>
                  <small>
                    Thời lượng đọc chuẩn dự kiến: ~
                    {formatDurationSeconds(selectedPost.expected_read_seconds)}
                  </small>
                </div>

                <div className="knowledge-doc-metric-box">
                  <span>Mức độ nắm bắt trung bình</span>
                  <strong>{selectedPost.avg_comprehension_percent ?? 0}%</strong>
                  <small>
                    Độ sâu cuộn đọc TB: {selectedPost.avg_scroll_percent ?? 0}% chiều dài bài
                  </small>
                </div>

                <div className="knowledge-doc-metric-box">
                  <span>Đã bấm xác nhận nắm bắt</span>
                  <strong>
                    {selectedPost.acknowledged_count ?? 0} /{" "}
                    {selectedPost.total_members ?? 0} người
                  </strong>
                  <small>
                    Xác nhận đúng phiên bản hiện hành (v{selectedPost.version})
                  </small>
                </div>
              </div>

              {/* Detailed Per-Member Table */}
              <div className="knowledge-readers-table-wrap">
                <table className="knowledge-readers-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Lượt mở & Thời điểm xem</th>
                      <th>Thời gian đọc & Độ sâu</th>
                      <th>Đánh giá % Nắm bắt nội dung</th>
                      <th>Trạng thái xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPost.readers
                      .filter((r) => {
                        if (readerTab === "viewed") return r.viewed;
                        if (readerTab === "unviewed") return !r.viewed;
                        return true;
                      })
                      .map((reader) => {
                        const tone = comprehensionTone(reader.comprehension_percent);
                        return (
                          <tr
                            key={reader.member_id}
                            className={reader.viewed ? "is-viewed" : "is-unviewed"}
                          >
                            <td>
                              <div className="knowledge-reader-identity">
                                <Avatar
                                  name={reader.member_name}
                                  size="small"
                                  tone={reader.viewed ? "brand" : "neutral"}
                                />
                                <div>
                                  <strong>{reader.member_name}</strong>
                                  <small>{reader.member_title}</small>
                                </div>
                              </div>
                            </td>

                            <td>
                              {reader.viewed ? (
                                <div className="knowledge-table-cell-stack">
                                  <strong>{reader.view_count} lượt mở xem</strong>
                                  <small>
                                    Gần nhất: {formatDateTime(reader.last_viewed_at)}
                                  </small>
                                </div>
                              ) : (
                                <span className="knowledge-muted-dash">
                                  Chưa mở xem lần nào
                                </span>
                              )}
                            </td>

                            <td>
                              {reader.viewed ? (
                                <div className="knowledge-table-cell-stack">
                                  <strong>
                                    <Timer size={13} style={{ display: "inline", marginRight: 4 }} />
                                    {formatDurationSeconds(reader.total_read_seconds)}
                                  </strong>
                                  <small>
                                    Đã cuộn đọc tới {reader.max_scroll_percent}% nội dung
                                  </small>
                                </div>
                              ) : (
                                <span className="knowledge-muted-dash">0 giây · 0%</span>
                              )}
                            </td>

                            <td>
                              <div className="knowledge-comprehension-cell">
                                <div className="knowledge-comprehension-head">
                                  <strong className={`comp-text ${tone}`}>
                                    {reader.comprehension_percent}% nắm bắt
                                  </strong>
                                  <span className={`comp-tag ${tone}`}>
                                    {!reader.viewed
                                      ? "Chưa tiếp cận"
                                      : reader.comprehension_percent >= 75
                                        ? "Nắm bắt tốt"
                                        : reader.comprehension_percent >= 45
                                          ? "Đang đọc / Khá"
                                          : "Đọc lướt"}
                                  </span>
                                </div>
                                <div className="knowledge-comp-bar-track">
                                  <div
                                    className={`knowledge-comp-bar-fill ${tone}`}
                                    style={{
                                      width: `${reader.comprehension_percent}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td>
                              {reader.is_current_version_ack ? (
                                <span className="knowledge-read-pill acknowledged">
                                  <CheckCheck size={13} />
                                  Đã xác nhận ({formatRelativeDate(reader.acknowledged_at)})
                                </span>
                              ) : reader.acknowledged ? (
                                <span className="knowledge-read-pill pending">
                                  Xác nhận bản cũ (v{reader.acknowledged_version})
                                </span>
                              ) : reader.viewed ? (
                                <span className="knowledge-read-pill viewed">
                                  Đã xem · Chưa xác nhận
                                </span>
                              ) : (
                                <span className="knowledge-read-pill unread">
                                  <Clock size={13} />
                                  Chưa mở xem
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : (
        /* MAIN LIST VIEW */
        <>
          {/* KPI Summary Strip */}
          <section
            className={`knowledge-kpi-grid ${isLeader ? "cols-3" : "cols-2"}`}
            aria-label="Thống kê thông báo và quy trình"
          >
            <div className="knowledge-kpi-card">
              <div className="knowledge-kpi-icon brand">
                <BookOpen size={20} />
              </div>
              <div className="knowledge-kpi-body">
                <span>Tổng nội dung đã ban hành</span>
                <strong>{stats.total} bài đăng</strong>
                <small>
                  {stats.announcements} Thông báo · {stats.sops} Quy trình ·{" "}
                  {stats.docs} Kiến thức
                </small>
              </div>
            </div>

            <div className="knowledge-kpi-card">
              <div
                className={`knowledge-kpi-icon ${
                  stats.myNeedAck > 0 || stats.myUnread > 0 ? "warning" : "success"
                }`}
              >
                <CheckCircle2 size={20} />
              </div>
              <div className="knowledge-kpi-body">
                <span>Trạng thái nắm bắt của bạn</span>
                <strong>
                  {stats.myNeedAck > 0
                    ? `${stats.myNeedAck} bài cần xác nhận`
                    : "Đã nắm bắt đầy đủ"}
                </strong>
                <small>
                  {stats.myUnread > 0
                    ? `Bạn có ${stats.myUnread} bài mới chưa mở xem`
                    : "Bạn đã mở xem tất cả thông báo & quy trình"}
                </small>
              </div>
            </div>

            {/* Only Leader Marketing sees the team-wide readership & comprehension KPI card */}
            {isLeader && (
              <div className="knowledge-kpi-card">
                <div className="knowledge-kpi-icon info">
                  <Users size={20} />
                </div>
                <div className="knowledge-kpi-body">
                  <span>
                    Đo lường toàn đội ngũ ({totalMembers} thành viên · Chỉ Leader thấy)
                  </span>
                  <strong>
                    {stats.avgViewRate}% đã xem · Nắm bắt TB {stats.avgComprehension}%
                  </strong>
                  <small>
                    Thời gian đọc TB: {formatDurationSeconds(stats.avgReadSec)} / bài ·{" "}
                    {stats.avgAckRate}% đã bấm xác nhận
                  </small>
                </div>
              </div>
            )}
          </section>

          {/* Main Content Panel */}
          <Panel
            title="Kho thông báo, quy trình (SOP) & tài liệu nội bộ"
            description={
              isLeader
                ? "Bấm vào bất kỳ bài viết nào để mở trang đọc toàn màn hình và xem bảng đo lường thời gian đọc, % nắm bắt của từng thành viên."
                : "Bấm vào bài viết để mở trang đọc chi tiết và bấm “Xác nhận đã nắm bắt” sau khi nắm rõ nội dung."
            }
          >
            {/* Filter Bar */}
            <div className="knowledge-toolbar">
              <div
                className="knowledge-category-tabs"
                role="tablist"
                aria-label="Phân loại nội dung"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === "all"}
                  className={`knowledge-tab-btn ${
                    categoryFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setCategoryFilter("all")}
                >
                  Tất cả <span>{stats.total}</span>
                </button>
                {KNOWLEDGE_CATEGORIES.map((cat) => {
                  const count =
                    cat.id === "announcement"
                      ? stats.announcements
                      : cat.id === "sop"
                        ? stats.sops
                        : stats.docs;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={categoryFilter === cat.id}
                      className={`knowledge-tab-btn ${
                        categoryFilter === cat.id ? "active" : ""
                      }`}
                      onClick={() => setCategoryFilter(cat.id)}
                    >
                      <CategoryIcon category={cat.id} size={15} />
                      {cat.label}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="knowledge-search-controls">
                <div className="knowledge-search-box">
                  <Search size={16} />
                  <input
                    type="search"
                    aria-label="Tìm kiếm thông báo, quy trình, kiến thức"
                    placeholder="Tìm theo tiêu đề, nội dung, người đăng…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Xóa từ khóa"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  aria-label="Lọc theo trạng thái đọc"
                  className="knowledge-status-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "unread"
                        | "unacknowledged"
                        | "pinned",
                    )
                  }
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="unread">Chưa mở xem ({stats.myUnread})</option>
                  <option value="unacknowledged">
                    Cần xác nhận nắm bắt ({stats.myNeedAck})
                  </option>
                  <option value="pinned">Đã ghim quan trọng</option>
                </select>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <LoadingState label="Đang tải thông báo, quy trình & tài liệu…" />
            ) : !filteredPosts.length ? (
              <EmptyState
                icon={BookOpen}
                title={
                  posts.length === 0
                    ? "Chưa có thông báo hoặc quy trình nào được đăng"
                    : "Không tìm thấy bài viết phù hợp bộ lọc"
                }
                description={
                  posts.length === 0
                    ? isLeader
                      ? "Hãy bấm “Đăng thông báo / quy trình” để chia sẻ thông báo đầu tiên, quy trình SOP hoặc tài liệu kiến thức cho toàn đội ngũ."
                      : "Khi Leader Marketing đăng thông báo, quy trình hoặc tài liệu mới, bạn sẽ nhận được chuông thông báo và xem tại đây."
                    : "Thử chuyển sang tab danh mục “Tất cả” hoặc xóa từ khóa tìm kiếm."
                }
                action={
                  isLeader && posts.length === 0 ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => openCreateModal("announcement")}
                    >
                      <Plus size={16} />
                      Đăng bài đầu tiên
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="knowledge-cards-grid">
                {filteredPosts.map((post) => {
                  const catMeta = getKnowledgeCategoryMeta(post.category);
                  const isCurrentAck =
                    post.my_acknowledged &&
                    (post.my_acknowledged_version ?? 1) >= post.version;
                  const isOutdatedAck =
                    post.my_acknowledged &&
                    (post.my_acknowledged_version ?? 1) < post.version;

                  // Leader-only metrics
                  const totalMem = post.total_members ?? 0;
                  const viewedCnt = post.viewed_count ?? 0;
                  const viewPercent =
                    isLeader && totalMem > 0
                      ? Math.round((viewedCnt / totalMem) * 100)
                      : 0;
                  const unviewedCount = isLeader
                    ? Math.max(0, totalMem - viewedCnt)
                    : 0;
                  const viewedReaders = isLeader
                    ? (post.readers ?? []).filter((r) => r.viewed)
                    : [];

                  return (
                    <article
                      key={post.id}
                      className={`knowledge-card ${post.pinned ? "is-pinned" : ""} ${
                        !post.my_viewed ? "is-unread" : ""
                      }`}
                    >
                      <div className="knowledge-card-top">
                        <div className="knowledge-card-badges">
                          {post.pinned && (
                            <span className="knowledge-badge pinned">
                              <Pin size={12} />
                              Đã ghim
                            </span>
                          )}
                          <span
                            className={`knowledge-badge category-${post.category}`}
                          >
                            <CategoryIcon category={post.category} size={13} />
                            {catMeta.label}
                          </span>
                          <span className="knowledge-badge read-time">
                            <Timer size={12} />~
                            {formatDurationSeconds(post.expected_read_seconds)}
                          </span>
                          {post.version > 1 && (
                            <span className="knowledge-badge version">
                              v{post.version}
                            </span>
                          )}
                        </div>

                        <div className="knowledge-card-my-status">
                          {!post.my_viewed ? (
                            <span className="knowledge-read-pill unread">
                              ● Mới · Chưa xem
                            </span>
                          ) : isCurrentAck ? (
                            <span className="knowledge-read-pill acknowledged">
                              <CheckCheck size={13} />
                              Đã nắm bắt
                            </span>
                          ) : isOutdatedAck ? (
                            <span className="knowledge-read-pill pending">
                              Cập nhật v{post.version} · Cần xác nhận lại
                            </span>
                          ) : post.require_ack ? (
                            <span className="knowledge-read-pill pending">
                              Đã xem · Chờ xác nhận
                            </span>
                          ) : (
                            <span className="knowledge-read-pill viewed">
                              <Eye size={13} />
                              Đã xem
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className="knowledge-card-main"
                        onClick={() => openPostDetail(post)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openPostDetail(post);
                          }
                        }}
                      >
                        <h3 className="knowledge-card-title">{post.title}</h3>
                        <p className="knowledge-card-summary">
                          {post.summary || stripMarkdownPreview(post.content)}
                        </p>
                      </div>

                      {post.links.length > 0 && (
                        <div className="knowledge-card-links">
                          {post.links.slice(0, 3).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="knowledge-link-chip"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link2 size={13} />
                              <span>{link.label}</span>
                              <ExternalLink size={11} />
                            </a>
                          ))}
                          {post.links.length > 3 && (
                            <span className="knowledge-link-more">
                              +{post.links.length - 3} tài liệu
                            </span>
                          )}
                        </div>
                      )}

                      <div className="knowledge-card-metrics">
                        {/* Team readership metrics on card ONLY visible to Leader Marketing */}
                        {isLeader && (
                          <>
                            <div className="knowledge-metric-header">
                              <span className="knowledge-metric-label">
                                <Eye size={14} />
                                <strong>
                                  {viewedCnt}/{totalMem}
                                </strong>{" "}
                                đã xem ({viewPercent}%)
                                {unviewedCount > 0 && (
                                  <em className="knowledge-unviewed-tag">
                                    · Chưa xem: {unviewedCount}
                                  </em>
                                )}
                              </span>
                              <span className="knowledge-metric-ack">
                                <Activity size={14} />
                                TB đọc{" "}
                                <strong>
                                  {formatDurationSeconds(post.avg_read_seconds ?? 0)}
                                </strong>{" "}
                                · Nắm bắt TB{" "}
                                <strong>{post.avg_comprehension_percent ?? 0}%</strong>
                              </span>
                            </div>

                            <div
                              className="knowledge-progress-track"
                              aria-label={`Đã xem ${viewPercent}%`}
                            >
                              <div
                                className="knowledge-progress-fill viewed"
                                style={{ width: `${viewPercent}%` }}
                              />
                            </div>
                          </>
                        )}

                        <div className="knowledge-card-footer">
                          <div className="knowledge-author-meta">
                            <Avatar
                              name={post.author_name}
                              size="small"
                              tone="brand"
                            />
                            <span>
                              Đăng bởi <strong>{post.author_name}</strong> ·{" "}
                              <time dateTime={post.updated_at}>
                                {formatRelativeDate(post.updated_at)}
                              </time>
                            </span>
                          </div>

                          <div className="knowledge-card-actions">
                            {isLeader && viewedReaders.length > 0 && (
                              <div
                                className="knowledge-reader-avatars"
                                title={`Đã xem: ${viewedReaders
                                  .map(
                                    (r) =>
                                      `${r.member_name} (${r.comprehension_percent}%)`,
                                  )
                                  .join(", ")}`}
                              >
                                {viewedReaders.slice(0, 4).map((r) => (
                                  <Avatar
                                    key={r.member_id}
                                    name={r.member_name}
                                    size="small"
                                  />
                                ))}
                                {viewedReaders.length > 4 && (
                                  <span className="knowledge-avatar-more">
                                    +{viewedReaders.length - 4}
                                  </span>
                                )}
                              </div>
                            )}

                            {isLeader && (
                              <>
                                <button
                                  type="button"
                                  className="secondary-button compact"
                                  onClick={() => void handleTogglePin(post)}
                                  title={post.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                >
                                  <Pin size={14} />
                                  {post.pinned ? "Bỏ ghim" : "Ghim"}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button compact"
                                  onClick={() => openEditModal(post)}
                                >
                                  <Edit3 size={14} />
                                  Sửa
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="primary-button compact"
                              onClick={() => openPostDetail(post)}
                            >
                              <FileText size={14} />
                              Mở đọc tài liệu
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}

      {/* Create / Edit Post Drawer (Leader Marketing Only) */}
      {isLeader && editorOpen && (
        <Drawer
          title={
            form.id
              ? "Chỉnh sửa thông báo / quy trình / kiến thức"
              : "Đăng thông báo, quy trình (SOP) hoặc kiến thức mới"
          }
          description="Nội dung sau khi đăng sẽ hiển thị toàn màn hình khi mở đọc và tự động đo lường thời gian xem, % nắm bắt cho Leader."
          onClose={() => setEditorOpen(false)}
        >
          <form className="knowledge-editor-form" onSubmit={handleSavePost}>
            <div className="knowledge-form-group">
              <label>1. Chọn phân loại nội dung</label>
              <div className="knowledge-category-selector">
                {KNOWLEDGE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`knowledge-cat-option ${
                      form.category === cat.id ? "selected" : ""
                    }`}
                    onClick={() => setForm((prev) => ({ ...prev, category: cat.id }))}
                  >
                    <div className="knowledge-cat-option-head">
                      <CategoryIcon category={cat.id} size={16} />
                      <strong>{cat.label}</strong>
                    </div>
                    <small>{cat.description}</small>
                  </button>
                ))}
              </div>
            </div>

            {!form.id && (
              <div className="knowledge-template-bar">
                <span>
                  <Sparkles size={14} /> Cần khung trình bày nhanh?
                </span>
                <button
                  type="button"
                  className="secondary-button compact"
                  onClick={() => {
                    const tpl = QUICK_TEMPLATES[form.category];
                    setForm((prev) => ({
                      ...prev,
                      title: prev.title || tpl.title,
                      summary: prev.summary || tpl.summary,
                      content: prev.content || tpl.content,
                    }));
                  }}
                >
                  Chèn mẫu {getKnowledgeCategoryMeta(form.category).shortLabel}
                </button>
              </div>
            )}

            <div className="knowledge-form-group">
              <label htmlFor="knowledge-title-input">2. Tiêu đề bài đăng *</label>
              <input
                id="knowledge-title-input"
                type="text"
                required
                maxLength={200}
                placeholder="VD: Quy trình bàn giao Lead chiến dịch T11 hoặc Thông báo lịch họp..."
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="knowledge-form-group">
              <label htmlFor="knowledge-summary-input">
                3. Tóm tắt ngắn (hiển thị ngoài thẻ danh sách)
              </label>
              <input
                id="knowledge-summary-input"
                type="text"
                maxLength={500}
                placeholder="Tóm tắt 1-2 câu về mục đích hoặc đối tượng cần nắm bắt..."
                value={form.summary}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, summary: e.target.value }))
                }
              />
            </div>

            <div className="knowledge-form-group">
              <label htmlFor="knowledge-content-input">
                4. Nội dung chi tiết / Các bước quy trình *
              </label>
              <small className="knowledge-field-hint">
                Hỗ trợ tiêu đề <code>## Mục lớn</code>, in đậm <code>**Chữ đậm**</code>, bảng{" "}
                <code>| Cột 1 | Cột 2 |</code>, danh sách <code>- Ý chính</code> và checklist{" "}
                <code>- [ ] Việc cần làm</code>.
              </small>
              <textarea
                id="knowledge-content-input"
                rows={14}
                required
                maxLength={30000}
                placeholder="Nhập chi tiết thông báo, quy trình SOP hoặc kiến thức..."
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
              />
            </div>

            {/* Reference Links Builder */}
            <div className="knowledge-form-group">
              <div className="knowledge-links-header">
                <label>5. Tài liệu / File / Link đính kèm (Google Docs, Sheet, Drive, Canva…)</label>
                {form.links.length < 12 && (
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        links: [...prev.links, { label: "", url: "" }],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Thêm link tài liệu
                  </button>
                )}
              </div>

              {form.links.length > 0 && (
                <div className="knowledge-links-editor">
                  {form.links.map((link, index) => (
                    <div key={index} className="knowledge-link-row">
                      <input
                        type="text"
                        placeholder="Tên tài liệu (VD: File SOP chi tiết)"
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...form.links];
                          updated[index] = {
                            ...updated[index],
                            label: e.target.value,
                          };
                          setForm((prev) => ({ ...prev, links: updated }));
                        }}
                      />
                      <input
                        type="url"
                        placeholder="https://docs.google.com/..."
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...form.links];
                          updated[index] = {
                            ...updated[index],
                            url: e.target.value,
                          };
                          setForm((prev) => ({ ...prev, links: updated }));
                        }}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Xóa link"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            links: prev.links.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="knowledge-options-box">
              <label className="knowledge-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pinned: e.target.checked }))
                  }
                />
                <div>
                  <strong>Ghim bài viết lên đầu trang</strong>
                  <small>
                    Ưu tiên hiển thị trên cùng để mọi thành viên thấy ngay khi vào tab.
                  </small>
                </div>
              </label>

              <label className="knowledge-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.require_ack}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      require_ack: e.target.checked,
                    }))
                  }
                />
                <div>
                  <strong>Yêu cầu thành viên bấm &ldquo;Xác nhận đã nắm bắt&rdquo;</strong>
                  <small>
                    Đo lường rõ ai chỉ mới mở xem và ai đã xác nhận nắm rõ quy trình / thông báo.
                  </small>
                </div>
              </label>

              <label className="knowledge-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.notify}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notify: e.target.checked }))
                  }
                />
                <div>
                  <strong>
                    <Bell size={14} style={{ display: "inline", marginRight: 4 }} />
                    {form.id
                      ? "Gửi lại thông báo chuông & Web Push về bản cập nhật này"
                      : "Tự động gửi thông báo chuông & Web Push cho toàn team"}
                  </strong>
                  <small>
                    Tất cả thành viên đang hoạt động sẽ nhận được thông báo ngay lập tức.
                  </small>
                </div>
              </label>
            </div>

            <div className="knowledge-editor-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving
                  ? "Đang lưu…"
                  : form.id
                    ? "Lưu cập nhật"
                    : "Đăng ngay cho toàn team"}
              </button>
            </div>
          </form>
        </Drawer>
      )}
    </DashboardShell>
  );
}
