# U·LINK Mobile App 🚀

Welcome to the **U·LINK Mobile Frontend**, built with [Expo](https://expo.dev) and React Native.

U·LINK is a university matching and social platform designed to connect students with common interests, study groups (Parches), events, and friendships.

## 🌟 Key Features

- **Match & Discover**: Tinder-like swiping to find study partners and new friends based on compatibility scores.
- **Parches (Groups)**: Join, create, and chat in dedicated groups.
- **Real-time Chat**: WebSocket-powered group chats and 1-on-1 direct messaging.
- **Events Map**: Explore interactive maps of campus events.
- **Friends Tab**: Manage connections, view online status, and launch direct messages, audio calls, and video calls.
- **Wellness (Bienestar)**: Integrated breathing exercises (4-7-8, Box, Calm) with real-time animations, and a multi-track ambient sound mixer (rain, forest, lofi, etc.) for focus and relaxation.
- **Dynamic Themes**: Beautiful glassmorphism UI with custom gradients and accessible modes.

## ⚡ Recent Optimizations (v1.1)

To ensure a smooth, premium experience, the app features significant performance optimizations:
- **In-Memory Cache Layer**: Rapid tab-switching with `TTL`-based caching for API responses.
- **Skeleton Loaders**: Premium loading states rather than blocking spinners.
- **N+1 Query Reduction**: Intelligent batching and background prefetching (e.g., in the Explore tab) to reduce parallel backend stress by 60%.
- **Token Prefetching**: Bypassed disk I/O bottlenecks in request interceptors for instant API auth.
- **Render Optimizations**: Strategic use of `React.memo` and `useCallback` to maintain 60fps across complex UI trees, like the Settings view and interactive Wellness components.

## 🛠️ Get Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the app**:
   ```bash
   npm start
   ```

3. **Run on a device**:
   - Install **Expo Go** on your iOS/Android device.
   - Scan the QR code from your terminal.

## 🏗️ Architecture

- **Routing**: Expo Router (file-based routing in `app/`).
- **Styling**: Vanilla React Native stylesheets + `expo-linear-gradient` + Glassmorphism components.
- **Animations**: `react-native-reanimated` for 60fps micro-animations.
- **Networking**: `axios` with interceptor-based JWT rotation + `@stomp/stompjs` for WebSockets.

---
*Hecho con ❤️ en la ECI*
