# Thông báo trình duyệt và thiết bị

## Bật cho từng người

Mặc định ứng dụng tự đăng ký Web Push trên mọi trang nội bộ nếu thiết bị đã cấp quyền. Nếu chưa chọn quyền, ứng dụng tự gọi yêu cầu khi tải trang (một lần mỗi lần tải, không lặp khi đổi focus). Người dùng vẫn phải tự chọn Allow; trình duyệt có thể chặn yêu cầu không có thao tác bấm, khi đó có lời nhắc “Cho phép thông báo” để bấm. Có thể tắt/bật lại từ Hồ sơ cá nhân hoặc chuông thông báo. Lựa chọn tắt được lưu theo thành viên trên thiết bị trong localStorage, không tự bật lại khi tải trang. Không thể bỏ qua quyền trình duyệt hoặc cài đặt Không làm phiền của hệ điều hành.

Web Push nhận được khi không có tab HacoLED mở, nếu trình duyệt/hệ điều hành hỗ trợ hoạt động nền và còn phiên đăng nhập hợp lệ. Tắt hẳn trình duyệt, hạn chế pin, Không làm phiền hoặc chặn thông báo có thể ngăn hiển thị. iPhone/iPad cần cài ứng dụng web vào màn hình chính và mở từ đó trên phiên bản hỗ trợ Web Push. Manifest và metadata hỗ trợ thêm vào màn hình chính; đăng nhập trong ứng dụng đã thêm rồi mới bật quyền. Hệ thống không hứa thay thế email/SMS hoặc giao nhận tuyệt đối.

Nhận tin nhắn trực tiếp/nhóm, công việc mới/chuyển người thực hiện, công việc hoàn thành và nhắc KPI. Không đẩy tin nhắn do chính mình gửi. Theo yêu cầu hiển thị của chủ hệ thống, thông báo chat dùng “Haco | Tên người gửi: nội dung”, lấy tin đến mới nhất trong lô và rút gọn nội dung tối đa 180 ký tự. Công việc/KPI vẫn dùng lời nhắc chung. Bấm để mở đúng chat/công việc; vẫn yêu cầu đăng nhập và kiểm tra quyền.

## Cấu hình Vercel Production

1. Chạy `npm run push:setup` nếu chưa có `.env.push.local`. Script tạo khóa/CRON_SECRET ở file chỉ đọc được bởi chủ máy, bị Git bỏ qua, không in giá trị ra terminal. Không ghi đè file tồn tại.
2. Nếu `SOCIAL_CREDENTIALS_KEY` đã có trên server (64 ký tự hex), chat/công việc có thể dùng cặp VAPID ổn định được suy ra bằng HKDF SHA-256 với mục đích riêng `hacoled-data-web-push-v1`. Không dùng trực tiếp khóa mã hóa kênh làm khóa VAPID. Không gửi master/private key ra client.
3. Cấu hình tùy chọn cặp khóa độc lập `WEB_PUSH_VAPID_PUBLIC_KEY` và `WEB_PUSH_VAPID_PRIVATE_KEY` (cả hai); khi có, chúng được ưu tiên. Nếu server chưa có master key phù hợp thì bắt buộc cấu hình cặp này. `WEB_PUSH_SUBJECT` mặc định `https://hacoled.com`. Không đổi cặp khóa sau khi người dùng đã bật, trừ khi thực hiện luân chuyển có chủ đích; đổi khóa sẽ yêu cầu bật lại thiết bị.
4. Thêm **CRON_SECRET** từ file vào Environment Variables → Production trên Vercel rồi redeploy. Không dán khóa vào chat, commit hoặc URL. Đây là bước cần quyền quản trị project Vercel, không thể hoàn tất chỉ bằng push Git nếu chưa có kết nối quản trị.
5. `vercel.json` có lịch GET `/api/push/cron` lúc 02:00 UTC (09:00 Việt Nam) mỗi ngày. Route yêu cầu Authorization Bearer đúng CRON_SECRET và so sánh timing-safe. Lịch hằng ngày phù hợp mức tần suất Hobby; thời điểm chính xác phụ thuộc bộ lập lịch Vercel. Kiểm tra lần chạy trong dashboard.

Giao diện hiển thị cấu hình chưa sẵn sàng nếu thiếu khóa. Nếu thiếu CRON_SECRET, vẫn gửi chat/công việc sau thao tác phát sinh; giao diện báo riêng rằng nhắc KPI khi mọi người đều đóng ứng dụng chưa có lịch nền. Không giả báo phần này đã hoạt động. Nhắc KPI vẫn có thể phát sinh khi người dùng mở ứng dụng như trước.

## Gửi và chống trùng

Migration `015-web-push.sql` lưu đăng ký theo thành viên + hash phiên đăng nhập, hàng đợi sự kiện và dấu gửi thành công theo từng thiết bị. Trigger cùng giao dịch nghiệp vụ đẩy sự kiện chat/notifications vào hàng đợi, chỉ cho người đã có đăng ký. Không backfill các việc/tin nhắn trước khi bật.

Sau các API ghi chat/công việc/import/kết quả hoặc lấy thông báo, Next.js `after()` xử lý tối đa bốn lô 80 sự kiện, có khóa lease, tối đa 32 yêu cầu mạng/lượt, 8 yêu cầu song song và giới hạn thời gian. Gom cùng người và cùng nhóm sự kiện/cuộc trò chuyện; các thiết bị chỉ nhận những sự kiện xảy ra sau thời điểm đăng ký. Thành công được ghi theo thiết bị để không gửi lại khi thử lại. 404/410 xóa đăng ký hết hiệu lực. Lỗi mạng/5xx giữ hàng đợi và lùi thời gian thử lại; sẽ được tiếp tục khi có hoạt động API hoặc cron. Sự kiện quá 24 giờ/12 lần thử dừng gửi; thông báo trong app vẫn giữ nguyên. Metadata hàng đợi cũ được dọn sau 30 ngày.

Service worker chỉ xử lý push/click, không cache trang/API/ảnh/quyền đăng nhập. Payload push mã hóa chỉ chứa ID sự kiện và ID thiết bị. Trước khi hiện OS notification, worker gọi server để kiểm tra lại phiên, thiết bị, membership chat, join/read cursor, trạng thái đã đọc và phạm vi công việc hiện tại. Mất quyền/đăng xuất sẽ không hiển thị nội dung từ hàng đợi cũ. Khi không xác minh được, không dùng nội dung lưu cũ; một số trình duyệt có thể hiển thị lời nhắc nền mặc định của trình duyệt.

Đăng xuất/thu hồi phiên xóa đăng ký trên server bằng FK cascade. Hết hạn phiên cũng chặn gửi và kiểm tra hiển thị. Sau lần đăng nhập mới, hệ thống tự đăng ký lại nếu đã Allow và chưa chủ động tắt trên thiết bị; đăng ký cũ của tài khoản khác không được tự nhận sang tài khoản mới. Endpoint phải HTTPS trên các push provider được hỗ trợ (Google, Mozilla, Apple, Windows), chặn localhost/IP/host giả để không biến API thành proxy HTTP. Không log endpoint token, auth key, private VAPID hoặc nội dung tin nhắn.

## Kiểm thử và giới hạn xác minh

`tests/web-push.spec.ts` kiểm tra đăng ký, quyền, session cascade, chat queue, retry, endpoint 410, khóa không hợp lệ, mẫu tên người gửi/nội dung chat và service worker xác minh trước khi hiện. HTTPS transport fixture trong test chặn đường dẫn riêng `/hacoled-test/` để **không gửi ra Internet**; phần mã hóa/VAPID thật vẫn chạy. UI test mô phỏng quyền/PushManager để xác nhận tự hỏi quyền, tự đăng ký khi được Allow, giữ lựa chọn tắt qua reload và có nút dự phòng khi trình duyệt chặn yêu cầu tự động. Đây không phải bằng chứng thiết bị production đã nhận thông báo OS thật; cần người dùng bật quyền trên thiết bị thực sau khi deploy/cấu hình.

Tài liệu: https://github.com/web-push-libs/web-push · https://developer.mozilla.org/en-US/docs/Web/API/Push_API · https://vercel.com/docs/cron-jobs/usage-and-pricing

Có thể mở cài đặt trực tiếp từ nút chuông cạnh Chat. **Thử thông báo trên máy** chỉ xác minh việc gửi yêu cầu hiển thị tới trình duyệt/OS, không chứng minh provider đã chuyển Web Push. Nếu thử vẫn không thấy, kiểm tra quyền thông báo trang, quyền thông báo của ứng dụng trình duyệt trong hệ điều hành và Không làm phiền. Nếu hiển thị “Chưa bật”, thiết bị chưa đăng ký Web Push cho phiên đăng nhập này. Tin chưa đọc ở lần tải đầu cũng có nhắc trong ứng dụng, chống lặp bằng mốc tin đến lưu sessionStorage.

Thông báo chat/work cùng tag vẫn yêu cầu nhắc lại (`renotify: true`); trước đây `false` có thể thay thế thông báo cũ mà không phát cảnh báo mới. Mỗi lần bấm thử dùng tag ngẫu nhiên mới và yêu cầu giữ thông báo nếu trình duyệt hỗ trợ; kết quả kiểm tra thêm `getNotifications` để phân biệt việc trình duyệt lưu thông báo với việc người dùng nhìn thấy banner. macOS có thiết lập riêng cho thông báo khi chiếu/chia sẻ màn hình, ngoài quyền của Comet và chế độ Focus. Không tự thay đổi cài đặt này vì thông báo có thể lộ với người xem màn hình.
