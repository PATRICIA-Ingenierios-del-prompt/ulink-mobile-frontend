# ULink Mobile — Backend Integration TODO

## Priority 1 — Critical (blocks core functionality)

- [x] **WebSocket/STOMP chat** — `@stomp/stompjs` and `sockjs-client` installed. 4 WS services created:
  1. **Chat+Voice** — `services/chatSocket.ts` — `/ws-stomp?access_token={jwt}` (Native WS). Subscribe: `/topic/chat/{chatId}`, `/topic/voice/{chatId}`, `/user/queue/voice-signal`, `/user/queue/kicked`. Send: `/app/chat.send/{chatId}`, `/app/voice.join/{chatId}`, `/app/voice.signal/{chatId}`. Wired into `chat/[id].tsx`.
  2. **Board/Lienzo** — `services/boardSocket.ts` — `/ws/board` (SockJS, public). Subscribe: `/exchange/amq.topic/board.{id}`, `.clear`, `.cursor`. Send: `/app/board/{id}/stroke`, `/app/board/{id}/cursor`. REST: `boardApi` for create/get/clear.
  3. **Geo** — `services/geoSocket.ts` — `/ws/geo?access_token={jwt}` (Native WS). Subscribe: `/topic/geo/{eventId}`, `/user/queue/geo/{eventId}/snapshot`. Send: `/app/geo/{eventId}`. Snapshot subscribes after broadcast to avoid race.
  4. **Parques Game** — `services/parquesSocket.ts` — `/parques-ws` (SockJS, public). Subscribe: `/exchange/amq.topic/game.{gameId}`, `/exchange/amq.topic/errors`. Send: `/app/game/create`, `/app/game/{gameId}/roll|move|pass|addBot|start`. Wired into `ParquesBoard` via `hooks/useParquesGameOnline.ts`.
  5. **Notifications** — `/ws/notifications/**` (unused in web frontend — not implemented)
  All use `?access_token={jwt}` query param for auth. **(DONE)**
- [x] **Deep linking config** — `linking` config added to `app/_layout.tsx`, `DeepLinkHandler` component listens for `ulink://invite/{token}` and `ulink://parche/{id}`. `scheme: "ulink"` in app.json.
- [x] **Onboarding flow** — `app/onboarding.tsx` created (3-step wizard: name/apellidos, carrera/semestre/genero, interests). Auth flow in `welcome-login.tsx` checks `userService.necesitaOnboarding()` and redirects accordingly.
- [x] **Push notifications** — `expo-notifications` installed, configured in `app.json`, `services/notificationsService.ts` created (register, listen, handle tap). NotificationObserver in `_layout.tsx` handles navigation from notification taps. Registration called after login in `welcome-login.tsx`. Backend device token endpoint still needed.

## Priority 2 — Important (significant UX gaps)

- [x] **Home feed** — Fetches user's parches (`parcheService.mine()`) and public parches (`parcheService.byVisibility("PUBLIC")`). Category-based color coding, real names, member counts. Uses `useAuth()` for personalized greeting.
- [x] **Events screen** — `services/eventService.ts` created with `publicMap()`, `myJoinedEvents()`, `myParchesEvents()`. Events screen fetches real events, displays them on map with category-based colors/emojis, and shows events list below map.
- [x] **Explore/matching** — `services/matchingService.ts` created with `obtenerSugerencias()`, `decidir()`, `listarMatches()`. Explore screen fetches real suggestions, hydrates with `userService.getPerfil()`, shows loading/empty states, and calls `decidir()` on swipe.
- [x] **User profile lookup** — `app/user/[id].tsx` now fetches real profile via `userService.getPerfil(id)`, shows loading spinner, displays real name/carrera/semestre/intereses, initials-based avatar.
- [x] **Parche creation form** — `app/create-parche.tsx` created with name/description/category/visibility/capacity fields. Calls `parcheService.create()` and navigates to the new parche. "Crear un parche" button in parches screen now navigates to this form.
- [ ] **Profile photo upload** — Skipped: no backend endpoint for user profile picture upload. Parche pictures use `parcheService.requestPictureUpload()`.
- [x] **Chat history** — `services/communicationService.ts` created with `getMessages()`. Chat screen fetches real messages from `/api/chat/{chatId}/messages` on open, shows loading spinner, maps to display format.
- [ ] **Friends list** — Skipped: no backend friends/connections API available.
- [x] **Settings persistence** — Logout handler wired to `AuthContext.logout()` with confirmation dialog, navigates to `/welcome-login`. Delete account button still needs backend endpoint.

## Priority 3 — Nice-to-have

- [ ] **Audio recording** — Install `expo-av`, implement recording/playback in chat voice messages.
- [ ] **WebRTC calls** — Implement real video/audio calls.
- [ ] **Lienzo sharing** — `services/boardSocket.ts` created (STOMP + REST). Need to wire into the Lienzo tab UI in `parche.tsx` to sync collaborative canvas drawings via WebSocket.
- [ ] **Monas collectibles** — Connect to gamification API.
- [ ] **Offline support** — Cache layer for messages and profiles.
- [ ] **Parche invite creation** — Wire `parcheService.createInvite()` in parche settings for admins.

## Gateway Blocker

- [ ] **CORS fix on gateway** — Set `CORS_ALLOWED_ORIGINS=*` on K8s + update `SecurityConfig.java` to use `setAllowedOriginPatterns()`. All API calls blocked until resolved.
