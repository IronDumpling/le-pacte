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
