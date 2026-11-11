This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- **Đường dẫn (route) luôn bằng tiếng Anh** (vd `/profile/wallet`, `/books/12/read`), không dùng tiếng Việt không dấu. Màn con cần ẩn thanh tab thì đặt trong nhóm ngoài `(tabs)` (vd `(account)`) nhưng giữ đường dẫn theo tab (`/profile/...`).
- Người hướng dẫn / giáo viên hiển thị bằng `<InstructorTag>` (avatar + "Người hướng dẫn" / tên); không ghi "HLV", "Huấn luyện viên" trước tên.
- **Tuyệt đối không dùng chữ "gia sư"** ở bất kỳ đâu (giao diện, toast, thông báo, nội dung mẫu, comment). Luôn gọi là **"người hướng dẫn"** (vd bài trên lộ trình: "Gặp người hướng dẫn"; hằng số `TUTOR_LABEL` trong `src/components/home/tutorLabel.ts`).
- Nhãn loại bài trên lộ trình: **"Gặp người hướng dẫn"**, **"Bài kiểm tra"** (không ghi gọn "Kiểm tra").
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Keyboard handling (bắt buộc cho mọi màn có ô nhập)

Màn hình / bottom sheet nào có `TextInput` thì phải xử lý bàn phím và **kiểm tra lại khi bàn phím đang mở** trước khi coi là xong. Docs: https://docs.expo.dev/guides/keyboard-handling/

- Bọc màn bằng `KeyboardAvoidingView behavior="padding"` cho **cả iOS và Android** (app Expo chạy edge-to-edge nên Android không tự resize). Không để `behavior` undefined trên Android, không đặt `softwareKeyboardLayoutMode: "pan"`.
- Nội dung form nằm trong `ScrollView` với `keyboardShouldPersistTaps="handled"`; dùng `useKeyboardForm()` (`src/hooks/useKeyboardForm.ts`): gắn `scrollRef`, bọc từng ô bằng `field(key).wrap` + `onFocus={field(key).onFocus}` để ô đang nhập luôn được cuộn lên trên bàn phím.
- Nút chính ở đáy màn dùng `<FloatingAction keyboardOpen={form.keyboardOpen}>` (xem mục Nút chính ở đáy màn) — nổi ngay trên bàn phím.
- Chuỗi ô nhập: `returnKeyType="next"` + `onSubmitEditing` focus ô kế tiếp; ô cuối `returnKeyType="done"` gọi submit.
- Màn form đặt ngoài nhóm `(tabs)` (vd nhóm `src/app/(account)/profile/*`) để thanh tab dưới không che ô nhập.
- **Bottom sheet có ô nhập** (vd AddReferrerSheet, ReferralSheet) cũng bắt buộc: luôn thử khi bàn phím đang mở — ô nhập, lỗi và nút xác nhận phải còn nhìn thấy, không bị bàn phím che.
- Hộp thoại chỉ có **một ô nhập ngắn** (vd mã khuyến mãi) → ưu tiên **popup giữa màn hình** `<CenterDialog>` (`src/components/CenterDialog.tsx`) thay vì bottom sheet: khung nằm giữa, KeyboardAvoidingView đẩy lên khi bàn phím mở nên ít bị che hơn.
- Kiểm tra: tối thiểu giả lập trên web (thu nhỏ chiều cao viewport, focus từng ô, chụp màn hình xem ô đang nhập + nút chính còn thấy), sau đó thử trên máy Android/iOS thật. Ghi rõ trong báo cáo nếu chưa thử được trên máy thật.

## Nút chính ở đáy màn (Lưu, Đổi mật khẩu, Đăng ký…)

- Luôn làm dạng **nổi trên nội dung**: dùng `<FloatingAction>` (`src/components/FloatingAction.tsx`) — nút có bóng; **không** làm thanh footer có nền / đường kẻ ngăn.
- Khoảng cách: lề trái = lề phải = cách mép dưới = **20px** (`FLOATING_EDGE`). Máy có thanh home (safe area dưới > 20) thì cách mép dưới = safe area dưới. Bàn phím mở: cách mép trên bàn phím 20px.
- Đặt `FloatingAction` trong một `View flex:1` cùng với ScrollView (bên trong KeyboardAvoidingView nếu màn có ô nhập), ScrollView chừa `paddingBottom: floatingActionSpace(insets.bottom)` để nút không che dòng cuối.
- Bottom sheet cũng theo kiểu nổi (vd `home/TrainingSheet.tsx`).
- Ngoại lệ: màn có nhiều khối, mỗi khối có nút riêng, thì nút đặt cuối khối đó, không nổi.

## Giữ vị trí cuộn

- Màn danh sách (tab) mở màn khác chồng lên rồi quay lại phải giữ vị trí cuộn: gọi `useKeepScroll(scrollRef)` và `track(y)` trong onScroll (web ẩn màn bên dưới bằng display:none nên mất vị trí). Đã dùng ở Trang chủ, Khoá học, Tài liệu.
- Màn danh sách dài có `ScrollTopButton` (nút lên đầu trang).

## Header / thanh trên cùng (kể cả dạng thu gọn khi cuộn)

- Đệm dưới của header **≥ đệm trái/phải** (header đệm ngang 16px → đệm dưới tối thiểu **16px**; ngang 20px → dưới ≥ 20px), để nút Back / icon không bị dồn sát mép dưới.
- Thanh nổi có chiều cao cố định thì tính đủ: `barH = topInset + 40 (nút) + 16 (đệm dưới)`, đặt `paddingBottom: 16`.

## Mua hàng / Giỏ hàng

- Mọi thứ mua được (sách, khoá học, sau này tài liệu khác) đi qua **giỏ hàng trên server** (`useCart()` từ `src/components/cart/CartContext.tsx`, API `/v1/cart`). Không tự làm luồng thanh toán riêng ở từng màn.
- Trang chi tiết (Sách, Khoá học) chỉ **một nút mua**: chưa trong giỏ → **"Thêm vào giỏ hàng"** = `add(type, id)` (ở lại màn, toast, chấm xanh bay vào giỏ); đã trong giỏ → **"Xem giỏ hàng"** (`router.navigate('/cart')`). Thẻ khoá học: "Thêm vào" → "Xem giỏ hàng". Bảng "Cách mở tài liệu" (vd nút Mở khoá để đọc tiếp ở màn đọc thử) cũng vậy: nút 3D "Thêm vào giỏ hàng" (icon giỏ, không ghi giá — giá nằm ở dòng mô tả) ↔ "Xem giỏ hàng".
- Khoá **đã sở hữu hoặc miễn phí**: không hiện giá / nút giỏ; thẻ chỉ có nút **"Bắt đầu học" / "Tiếp tục học"** (bấm ảnh / tên khoá → trang giới thiệu, không cần nút (i)) (`useStartCourse`: khoá miễn phí tự ghi danh `POST /v1/courses/{id}/enroll` rồi mở `/courses/[id]`).
- Mọi nút thêm vào giỏ truyền điểm bấm `from: { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }` → chấm xanh bay từ đó vào icon Giỏ hàng (`cart/CartFly.tsx`), icon "hứng" (nảy + lắc). Không truyền thì bay từ giữa màn.
- Tab **Giỏ hàng** (bên trái Hồ sơ) chỉ hiện khi giỏ có món (hoặc đang mở), icon có chấm vàng gây chú ý (không viền). Nút Thanh toán nằm cuối nội dung trang giỏ, không nổi. Mã khuyến mãi áp ở trang giỏ (`POST /v1/cart/promo`).

## Thông tin khác nút bấm (không làm thứ không bấm được trông như bấm được)

- Khối chỉ để **hiển thị thông tin** (số dư, thống kê, trạng thái, nhãn…) phải **phẳng**: nền nhạt + viền mảnh hoặc không viền; **không** bóng đổ, **không** mép 3D (`boxShadow: 0px Npx 0px …`), không icon / chevron gợi ý bấm, không hiệu ứng nhấn.
- Mép 3D, bóng nổi, chevron, scale khi nhấn **chỉ dành cho thứ bấm được** (nút, thẻ mở màn khác, pill có hành động).
- Danh sách dài (lịch sử, giao dịch, bạn bè…): mỗi dòng là **hàng phẳng** có đường kẻ mảnh, không làm mỗi dòng một thẻ (tốn chỗ).
- Thông tin chính của màn có danh sách cuộn (vd số xu ở Xu của tôi) đặt ở **phần cố định** phía trên (có thể thu gọn khi cuộn nhưng luôn còn thấy), chỉ danh sách cuộn.
- Phẳng **không có nghĩa là nhạt**: khối thông tin chính vẫn phải có điểm nhấn "wow" (gradient, hoa văn, chữ số lớn, chuyển động nhẹ như đếm số / vệt sáng) — chỉ tránh bóng nổi, mép 3D, chevron.

## Branding

Cố gắng follow theo bộ nhận diện đã thiết kế trong `branding_readme.md` (nằm trong Project docs của Ellso) cho mọi màn hình và component mới. Tóm tắt các điểm chính:

- **Logo**: luôn dùng file có sẵn — không gõ lại "ellso" bằng font, không vẽ lại chữ e. Không gradient, viền, bóng đổ, khung bao, xoay hay kéo giãn. Chỉ 3 màu: `emerald` #10B981 (mặc định, nền sáng), `white` (nền tối / nền emerald), `ink` #0F172A (in một màu). Logo dài trên header cao 28–32px, tối thiểu rộng 96px; chữ e tối thiểu 16px.
- **Màu**: chỉ dùng các token trong `branding_readme.md` (emerald-500/700/800, mint-400/50, spark-500, ink-900/600, surface, surface-alt, line, on-emerald, danger), có giá trị riêng cho sáng và tối. Lấy màu qua `useTheme()` / `src/theme/tokens.ts`, không hard-code HEX trong component. `spark-500` tối đa 1 điểm nhấn mỗi màn hình; `danger` chỉ cho lỗi và xoá.
- **Font**: Lexend (600/500) cho tiêu đề; Be Vietnam Pro (400–700) cho nội dung, nút, nhãn.
- **Slogan** *Learn to Lead, Innovate to Succeed* đặt thành dòng riêng, không gắn vào logo.

Nếu thấy chỗ nào trong code đang lệch so với branding, báo lại thay vì tự ý đổi diện rộng.

## Màn Nội dung bài học (`src/components/lesson/`)
- Mở từ bản đồ: `router.push({ pathname: '/lessons/[id]', params: { id, color: <màu chương>, course } })`. Bài kiểm tra / gặp giáo viên: chưa có màn → toast.
- Khối Editor.js: `LessonBlocks` (paragraph, header, list v1/v2 lồng nhau + checklist, quote, delimiter, image, table, code, warning), `QuizBlock`, `VideoBlock` (`PlatformPlayer`: native expo-video, web `<video>` + hls.js). Chữ trong dòng: `RichInline` (b/i/u/mark/code/a/br) — không dùng WebView.
- Thêm loại khối mới ở server (`LessonContent::BLOCK_TYPES`) → thêm type vào `src/data/lesson.ts` + render ở `StaticBlock`.
- Tracking: `useLessonTracking` (phiên học, giây học thực, độ sâu cuộn, đọc hết, giây xem video) + `LessonFeedback` cuối bài. Lỗi tracking bỏ qua im lặng.
- Expo chạy với `CI=1` không theo dõi file → sửa code xong phải khởi động lại Metro mới thấy thay đổi.

## Tab Khoá học: Tiếp tục khoá học
- Mục "Tiếp tục khoá học" (`courses/ContinueCourses.tsx`, `apiContinueCourses` trong `src/data/learning.ts`, GET `/v1/my/courses`) nằm ngay trên Khoá học E-learning: mọi khoá **đã mua / được cấp** (kể cả chưa học) + khoá **miễn phí đã học ≥ 1 bài** (`source`, `started` từ server). Khoá học xong xuống cuối. Bấm → bản đồ `/courses/[id]`. Không có khoá nào → ẩn mục.

## Tab Tài liệu
- Dữ liệu thật từ server (`useDocuments()`: `docs`, `topics`, `refresh`), tải lại khi quay về tab / mở Tài liệu của tôi. Không còn dữ liệu giả trong `src/data/documents.ts`.
- Bấm sách → trang sách `/books/[id]`. Bấm video / PDF: mở được → trình xem `/documents/view/[id]` (nhóm `(learn)`, không thanh tab: video HLS + mốc thời gian; PDF qua trang đọc pdf.js của server); đang khoá → bảng "Cách mở tài liệu".
