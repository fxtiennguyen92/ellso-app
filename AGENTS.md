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
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Branding

Cố gắng follow theo bộ nhận diện đã thiết kế trong `branding_readme.md` (nằm trong Project docs của Ellso) cho mọi màn hình và component mới. Tóm tắt các điểm chính:

- **Logo**: luôn dùng file có sẵn — không gõ lại "ellso" bằng font, không vẽ lại chữ e. Không gradient, viền, bóng đổ, khung bao, xoay hay kéo giãn. Chỉ 3 màu: `emerald` #10B981 (mặc định, nền sáng), `white` (nền tối / nền emerald), `ink` #0F172A (in một màu). Logo dài trên header cao 28–32px, tối thiểu rộng 96px; chữ e tối thiểu 16px.
- **Màu**: chỉ dùng các token trong `branding_readme.md` (emerald-500/700/800, mint-400/50, spark-500, ink-900/600, surface, surface-alt, line, on-emerald, danger), có giá trị riêng cho sáng và tối. Lấy màu qua `useTheme()` / `src/theme/tokens.ts`, không hard-code HEX trong component. `spark-500` tối đa 1 điểm nhấn mỗi màn hình; `danger` chỉ cho lỗi và xoá.
- **Font**: Lexend (600/500) cho tiêu đề; Be Vietnam Pro (400–700) cho nội dung, nút, nhãn.
- **Slogan** *Learn to Lead, Innovate to Succeed* đặt thành dòng riêng, không gắn vào logo.

Nếu thấy chỗ nào trong code đang lệch so với branding, báo lại thay vì tự ý đổi diện rộng.
