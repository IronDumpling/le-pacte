# Le Pacte

反传统的、极度硬核的轻量化自控力 App，基于「链式时延协议 (CTDP)」理念开发。

## 核心状态机

- **IDLE (空闲态)** → 预约启动 → **RESERVED (预约态)**
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

```bash
npm install
npx expo start
```

使用 Expo Go 或开发构建运行。

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
