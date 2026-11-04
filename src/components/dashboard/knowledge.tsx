"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
- Mục tiêu / lý do áp dụng:
- Thời gian bắt đầu hiệu lực:
- Đối tượng áp dụng: Toàn bộ đội ngũ Marketing & Sales HacoLED.

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
- Mục đích chuẩn hóa quy trình:
- Nhân sự chịu trách nhiệm thực thi:

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
- Bối cảnh & ứng dụng thực tế tại HacoLED:
- Giá trị cốt lõi cần nhớ:

## 2. Nội dung trọng tâm
- Điểm chính 1:
- Điểm chính 2:
- Điểm chính 3:

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

function FormattedContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="knowledge-formatted-content">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={idx} className="knowledge-content-spacer" />;
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={idx} className="knowledge-content-h4">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={idx} className="knowledge-content-h3">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={idx} className="knowledge-content-h2">
              {line.slice(2)}
            </h2>
          );
        }
        if (/^-\s*\[[ xX]\]\s+/.test(line.trim())) {
          const checked = /^-\s*\[[xX]\]/.test(line.trim());
          const text = line.trim().replace(/^-\s*\[[ xX]\]\s+/, "");
          return (
            <div key={idx} className="knowledge-content-checklist">
              <span
                className={`knowledge-check-box ${checked ? "is-checked" : ""}`}
                aria-hidden="true"
              >
                {checked ? "✓" : ""}
              </span>
              <span>{text}</span>
            </div>
          );
        }
        if (/^[-*•]\s+/.test(line.trim())) {
          const text = line.trim().replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="knowledge-content-bullet">
              <span className="knowledge-bullet-dot" aria-hidden="true" />
              <span>{text}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(line.trim())) {
          const match = line.trim().match(/^(\d+\.)\s+(.*)$/);
          return (
            <div key={idx} className="knowledge-content-numbered">
              <strong className="knowledge-number-prefix">
                {match?.[1] ?? "•"}
              </strong>
              <span>{match?.[2] ?? line}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="knowledge-content-paragraph">
            {line}
          </p>
        );
      })}
    </div>
  );
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

  // Active post detail drawer
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [readerTab, setReaderTab] = useState<"all" | "viewed" | "unviewed">("all");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Create / Edit drawer (Leader only)
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const viewedRecordedRef = useRef<Set<string>>(new Set());

  const loadPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chưa tải được danh sách thông báo & quy trình.");
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setTotalMembers(Number(data.total_members ?? 0));
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

  // Automatically record view when a post detail drawer is opened
  useEffect(() => {
    if (!selectedPostId) return;
    const key = `${selectedPostId}`;
    if (viewedRecordedRef.current.has(key)) return;
    viewedRecordedRef.current.add(key);

    void (async () => {
      try {
        const res = await fetch("/api/knowledge", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedPostId, action: "view" }),
        });
        if (res.ok) {
          await loadPosts(true);
        }
      } catch {
        // Ignore transient view tracking network error
      }
    })();
  }, [selectedPostId, loadPosts]);

  function openPostDetail(post: KnowledgePost) {
    viewedRecordedRef.current.delete(post.id);
    setReaderTab("all");
    setConfirmDeleteId(null);
    setSelectedPostId(post.id);
  }

  function closePostDetail() {
    setSelectedPostId(null);
    setConfirmDeleteId(null);
    if (queryPostId) {
      router.replace("/admin/knowledge", { scroll: false });
    }
  }

  async function handleAcknowledge(post: KnowledgePost) {
    setAcknowledgingId(post.id);
    setError("");
    try {
      const res = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, action: "acknowledge" }),
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
        closePostDetail();
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
    if (posts.length > 0 && totalMembers > 0) {
      const totalPossible = posts.length * totalMembers;
      const sumViews = posts.reduce((acc, p) => acc + p.viewed_count, 0);
      const sumAcks = posts.reduce((acc, p) => acc + p.acknowledged_count, 0);
      avgViewRate = Math.round((sumViews / totalPossible) * 100);
      avgAckRate = Math.round((sumAcks / totalPossible) * 100);
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
    };
  }, [posts, totalMembers]);

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
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadPosts()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>
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

      {/* KPI Summary Strip */}
      <section className="knowledge-kpi-grid" aria-label="Thống kê thông báo và quy trình">
        <div className="knowledge-kpi-card">
          <div className="knowledge-kpi-icon brand">
            <BookOpen size={20} />
          </div>
          <div className="knowledge-kpi-body">
            <span>Tổng nội dung đã ban hành</span>
            <strong>{stats.total} bài đăng</strong>
            <small>
              {stats.announcements} Thông báo · {stats.sops} Quy trình · {stats.docs} Kiến thức
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

        <div className="knowledge-kpi-card">
          <div className="knowledge-kpi-icon info">
            <Users size={20} />
          </div>
          <div className="knowledge-kpi-body">
            <span>Đo lường độ phủ toàn đội ngũ ({totalMembers} thành viên)</span>
            <strong>
              {stats.avgViewRate}% đã xem · {stats.avgAckRate}% xác nhận
            </strong>
            <small>
              Theo dõi trực tiếp ai đã xem và ai chưa xem từng quy trình
            </small>
          </div>
        </div>
      </section>

      {/* Main Content Panel */}
      <Panel
        title="Kho thông báo, quy trình (SOP) & tài liệu nội bộ"
        description={
          isLeader
            ? "Bạn đang đăng nhập với quyền Leader Marketing: có thể đăng mới, ghim, chỉnh sửa và đo lường chi tiết từng thành viên đã xem hay chưa."
            : "Mở từng bài viết để đọc chi tiết và bấm “Xác nhận đã nắm bắt” sau khi nắm rõ thông báo hoặc quy trình."
        }
      >
        {/* Filter Bar */}
        <div className="knowledge-toolbar">
          <div className="knowledge-category-tabs" role="tablist" aria-label="Phân loại nội dung">
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === "all"}
              className={`knowledge-tab-btn ${categoryFilter === "all" ? "active" : ""}`}
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
                  className={`knowledge-tab-btn ${categoryFilter === cat.id ? "active" : ""}`}
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
                  e.target.value as "all" | "unread" | "unacknowledged" | "pinned",
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
              const viewPercent =
                post.total_members > 0
                  ? Math.round((post.viewed_count / post.total_members) * 100)
                  : 0;
              const isCurrentAck =
                post.my_acknowledged &&
                (post.my_acknowledged_version ?? 1) >= post.version;
              const isOutdatedAck =
                post.my_acknowledged &&
                (post.my_acknowledged_version ?? 1) < post.version;
              const unviewedCount = Math.max(0, post.total_members - post.viewed_count);
              const viewedReaders = (post.readers ?? []).filter((r) => r.viewed);

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
                      <span className={`knowledge-badge category-${post.category}`}>
                        <CategoryIcon category={post.category} size={13} />
                        {catMeta.label}
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
                      {post.summary ||
                        post.content
                          .replace(/[#*`>-]/g, "")
                          .slice(0, 180)
                          .trim()}
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

                  {/* Readership Tracking Bar */}
                  <div className="knowledge-card-metrics">
                    <div className="knowledge-metric-header">
                      <span className="knowledge-metric-label">
                        <Eye size={14} />
                        <strong>
                          {post.viewed_count}/{post.total_members}
                        </strong>{" "}
                        đã xem ({viewPercent}%)
                        {unviewedCount > 0 && (
                          <em className="knowledge-unviewed-tag">
                            · Còn {unviewedCount} người chưa xem
                          </em>
                        )}
                      </span>
                      <span className="knowledge-metric-ack">
                        <CheckCheck size={14} />
                        <strong>
                          {post.acknowledged_count}/{post.total_members}
                        </strong>{" "}
                        đã xác nhận nắm bắt
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

                    <div className="knowledge-card-footer">
                      <div className="knowledge-author-meta">
                        <Avatar name={post.author_name} size="small" tone="brand" />
                        <span>
                          Đăng bởi <strong>{post.author_name}</strong> ·{" "}
                          <time dateTime={post.updated_at}>
                            {formatRelativeDate(post.updated_at)}
                          </time>
                        </span>
                      </div>

                      <div className="knowledge-card-actions">
                        {viewedReaders.length > 0 && (
                          <div
                            className="knowledge-reader-avatars"
                            title={`Đã xem: ${viewedReaders
                              .map((r) => r.member_name)
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
                          Xem chi tiết
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

      {/* Post Detail + Readership Measurement Drawer */}
      {selectedPost && (
        <Drawer
          title={selectedPost.title}
          description={`${getKnowledgeCategoryMeta(selectedPost.category).label} · Phiên bản v${
            selectedPost.version
          } · Cập nhật ${formatDateTime(selectedPost.updated_at)}`}
          onClose={closePostDetail}
        >
          <div className="knowledge-detail-drawer">
            {/* Header Meta & Leader Controls */}
            <div className="knowledge-detail-meta-bar">
              <div className="knowledge-card-badges">
                {selectedPost.pinned && (
                  <span className="knowledge-badge pinned">
                    <Pin size={12} />
                    Đã ghim đầu trang
                  </span>
                )}
                <span
                  className={`knowledge-badge category-${selectedPost.category}`}
                >
                  <CategoryIcon category={selectedPost.category} size={13} />
                  {getKnowledgeCategoryMeta(selectedPost.category).label}
                </span>
                <span className="knowledge-badge version">
                  Phiên bản v{selectedPost.version}
                </span>
              </div>

              {isLeader && (
                <div className="knowledge-leader-actions">
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => void handleTogglePin(selectedPost)}
                  >
                    <Pin size={14} />
                    {selectedPost.pinned ? "Bỏ ghim" : "Ghim bài"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => openEditModal(selectedPost)}
                  >
                    <Edit3 size={14} />
                    Chỉnh sửa
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
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedPost.summary && (
              <div className="knowledge-detail-summary">
                <strong>Tóm tắt trọng tâm:</strong> {selectedPost.summary}
              </div>
            )}

            {/* Main Article Body */}
            <div className="knowledge-detail-body">
              <FormattedContent content={selectedPost.content} />
            </div>

            {/* Attached Reference Links */}
            {selectedPost.links.length > 0 && (
              <div className="knowledge-detail-links">
                <h3>
                  <Link2 size={16} />
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
                      <CheckCircle2 size={18} />
                      Bạn đã xác nhận nắm bắt nội dung này
                    </span>
                  ) : (
                    <span className="ack-pending-title">
                      <ClipboardCheck size={18} />
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
                      }) · Bạn đã mở xem ${Math.max(1, selectedPost.my_view_count)} lần.`
                    : "Bấm nút xác nhận bên cạnh sau khi bạn đã đọc kỹ để hệ thống ghi nhận bạn đã nắm bắt thông báo / quy trình này."}
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
                  <CheckCheck size={16} />
                  {acknowledgingId === selectedPost.id
                    ? "Đang ghi nhận…"
                    : "Xác nhận đã nắm bắt"}
                </button>
              )}
            </div>

            {/* Readership Measurement Section ("Đo lường xem ai đã xem quy trình đó") */}
            <section
              className="knowledge-readers-section"
              aria-label="Đo lường người xem và nắm bắt"
            >
              <div className="knowledge-readers-header">
                <div>
                  <h3>
                    <Users size={17} />
                    Đo lường thành viên đã xem & nắm bắt
                  </h3>
                  <p>
                    Hệ thống tự động ghi nhận thời điểm mở xem, số lần xem và trạng thái xác nhận của từng thành viên.
                  </p>
                </div>

                <div className="knowledge-readers-tabs">
                  <button
                    type="button"
                    className={`knowledge-subtab ${readerTab === "all" ? "active" : ""}`}
                    onClick={() => setReaderTab("all")}
                  >
                    Tất cả ({selectedPost.total_members})
                  </button>
                  <button
                    type="button"
                    className={`knowledge-subtab ${
                      readerTab === "viewed" ? "active" : ""
                    }`}
                    onClick={() => setReaderTab("viewed")}
                  >
                    Đã xem ({selectedPost.viewed_count})
                  </button>
                  <button
                    type="button"
                    className={`knowledge-subtab ${
                      readerTab === "unviewed" ? "active" : ""
                    }`}
                    onClick={() => setReaderTab("unviewed")}
                  >
                    Chưa xem (
                    {Math.max(0, selectedPost.total_members - selectedPost.viewed_count)}
                    )
                  </button>
                </div>
              </div>

              <div className="knowledge-readers-list">
                {(selectedPost.readers ?? [])
                  .filter((r) => {
                    if (readerTab === "viewed") return r.viewed;
                    if (readerTab === "unviewed") return !r.viewed;
                    return true;
                  })
                  .map((reader) => (
                    <div
                      key={reader.member_id}
                      className={`knowledge-reader-row ${
                        reader.viewed ? "is-viewed" : "is-unviewed"
                      }`}
                    >
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

                      <div className="knowledge-reader-stats">
                        {reader.viewed ? (
                          <>
                            <span className="knowledge-reader-view-info">
                              <Eye size={13} />
                              Đã xem <strong>{reader.view_count} lần</strong> · Gần nhất:{" "}
                              {formatDateTime(reader.last_viewed_at)}
                            </span>
                            {reader.is_current_version_ack ? (
                              <span className="knowledge-read-pill acknowledged">
                                <CheckCheck size={13} />
                                Đã nắm bắt ({formatRelativeDate(reader.acknowledged_at)})
                              </span>
                            ) : reader.acknowledged ? (
                              <span className="knowledge-read-pill pending">
                                Đã xác nhận bản cũ (v{reader.acknowledged_version})
                              </span>
                            ) : (
                              <span className="knowledge-read-pill viewed">
                                Đã mở xem · Chưa bấm xác nhận
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="knowledge-read-pill unread">
                            <Clock size={13} />
                            Chưa mở xem
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </Drawer>
      )}

      {/* Create / Edit Post Drawer (Leader Marketing Only) */}
      {isLeader && editorOpen && (
        <Drawer
          title={
            form.id
              ? "Chỉnh sửa thông báo / quy trình / kiến thức"
              : "Đăng thông báo, quy trình (SOP) hoặc kiến thức mới"
          }
          description="Nội dung sau khi đăng sẽ hiển thị cho toàn bộ thành viên và tự động đo lường lượt xem, xác nhận."
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
                Hỗ trợ tiêu đề <code>## Mục lớn</code>, danh sách gạch đầu dòng{" "}
                <code>- Ý chính</code>, đánh số <code>1. Bước 1</code> và checklist{" "}
                <code>- [ ] Việc cần làm</code>.
              </small>
              <textarea
                id="knowledge-content-input"
                rows={12}
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
