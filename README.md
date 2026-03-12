# Le Pacte

反传统的、极度硬核的轻量化自控力 App，基于「链式时延协议 (CTDP)」理念开发。

## 核心状态机

- **IDLE (空闲态)** → 预定启动 → **RESERVED (预定态)**
- **RESERVED** → 15 分钟内入座 → **FOCUSED (专注态)** | 超时 → **IDLE** (链条断裂)
- **FOCUSED** → 长按完成 → **IDLE** (Chain +1) | 退后台/暂停 → **DILEMMA (判例结算态)**
- **DILEMMA** → 毁灭 → **IDLE** (链条清零) | 妥协 → **FOCUSED** (写入宪法)

## 技术栈

- React Native + Expo
- Expo Router + TypeScript
- Zustand (状态管理)
- AsyncStorage (持久化)
- react-native-reanimated (动画)
- expo-haptics (触觉反馈)

## 运行

**要求：** Node.js >= 20.19.4

**SDK：** Expo SDK 54（兼容 App Store / Play Store 的 Expo Go）

```bash
# 若使用 nvm，进入项目后会自动使用 .nvmrc 中的版本
nvm use

npm install
npx expo start
```

使用 Expo Go 或开发构建运行。

## 在手机上预览（Expo Go）

**基本开发无需登录**：电脑和手机在同一 Wi-Fi 下，用 Expo Go 扫码即可预览。

若需登录（如使用 EAS、云构建等）：

1. **电脑端**：在项目目录执行 `npx expo login`，输入 Expo 账号
2. **手机端**：打开 Expo Go → 底部「Profile」→「Sign in」→ 使用同一账号登录

扫码或手动输入终端显示的 URL（如 `exp://192.168.x.x:8081`）即可连接。

## 项目结构

```
app/
  _layout.tsx
  index.tsx
  constitution.tsx
src/
  store/pacteStore.ts
  storage/storage.ts
  design/theme.ts
  design/components/
  components/
  hooks/
```

## 打包与发布

### 图标与启动页资源

所有平台使用的图标 / 启动页都从 `app.json` 中引用，路径指向 `assets/` 目录：

- **通用 App 图标**：`expo.icon` → `./assets/icon.png`
- **启动页图片**：`expo.splash.image` → `./assets/splash-icon.png`
- **Android 自适应图标**：
  - `expo.android.adaptiveIcon.foregroundImage` → `./assets/android-icon-foreground.png`
  - `expo.android.adaptiveIcon.backgroundImage` → `./assets/android-icon-background.png`
  - `expo.android.adaptiveIcon.monochromeImage` → `./assets/android-icon-monochrome.png`
- **Web favicon**：`expo.web.favicon` → `./assets/favicon.png`

替换这些文件本身（保持文件名与路径不变）即可更新应用图标与启动页，无需额外修改代码。

### 使用 Expo Go 开发预览

开发阶段可以直接使用：

```bash
npx expo start
```

- 扫码在 **Expo Go** 中预览：能看到启动页和应用内 UI，但 **主屏幕图标仍然是 Expo Go 自己的图标**（这一点是正常的）。
- Web 预览：`npx expo start --web`，浏览器中强制刷新（例如 `Cmd+Shift+R`）可以看到新的 `favicon`。

### 使用 EAS Build 打包

本项目推荐使用 Expo 官方的 **EAS Build** 来生成商店可用的安装包。

1. **初始化 EAS（首次配置时需要）**

```bash
npx expo login          # 如已登录可跳过
npx expo install eas-cli
npx eas build:configure
```

2. **构建 iOS 安装包（.ipa / App Store）**

```bash
# 交互式选择配置并构建
npx eas build --platform ios
```

- 首次会引导你配置 Apple 开发者账号、证书、Provision Profiles 等。
- 构建完成后，在 EAS 的控制台或命令行输出中可下载 `.ipa` 或提交到 App Store Connect。
- 构建产物中会自动包含 `assets/icon.png` 与 `assets/splash-icon.png` 等资源。

3. **构建 Android 安装包（.aab / .apk / Play Store）**

```bash
npx eas build --platform android
```

- 默认输出 `.aab` 用于上传 Google Play，也可以在设置中改为 `.apk`。
- Launcher 图标会使用 `android-icon-foreground.png`、`android-icon-background.png`、`android-icon-monochrome.png` 这三张图片。

### 本地原生运行（可选）

如果你需要在本地 Xcode / Android Studio 中以原生工程方式运行，可以使用：

```bash
# 生成原生工程（仅当你需要自定义原生代码时使用）
npx expo prebuild

# iOS 真机 / 模拟器
npx expo run:ios

# Android 真机 / 模拟器
npx expo run:android
```

每次修改 `app.json` 中与原生资源相关的配置（如图标、启动页）后，建议重新运行 `prebuild` 或重新构建，以确保资源被正确打包进原生工程。
