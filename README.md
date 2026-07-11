<div align="center">

# KOD**A**

### Every word. Every action.

**AI-powered offline meeting recorder device + companion app**

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![AI](https://img.shields.io/badge/AI-Groq%20%2B%20Whisper-FF5C3A?style=flat-square)](https://groq.com)
[![Queue](https://img.shields.io/badge/Queue-Celery%20%2B%20Redis-DC382D?style=flat-square&logo=redis)](https://docs.celeryq.dev)
[![License](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

[Website](https://getkoda.vercel.app) · [Download App](#) · [Order Device](#) · [Docs](#documentation)

</div>

---

## What is KODA?

KODA is a physical AI meeting recorder device that sits in the middle of any room, captures every voice in an offline team meeting, transcribes it with AI, and automatically creates tasks in Jira, sends summaries to Slack, and saves notes to Notion — the moment the meeting ends.

No participant apps. No QR codes to scan. No manual notes. No missed action items.

> **The problem KODA solves:** 70% of action items from meetings are never followed up. Every existing solution (Otter.ai, Fireflies, Fathom) only works for online meetings. KODA is built for the real world — the conference room, the startup office, the workshop where teams actually make decisions.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   KODA Device          Backend              Your Tools      │
│   (in the room)        (your server)                        │
│                                                             │
│   🎙 Records     →    🔊 Whisper STT   →   📋 Transcript   |
│   audio chunks         transcribes                          │
│                                                             │
│   📡 Streams     →    🤖 Groq AI      →   ✅ Summary      |
│   over WiFi            analyzes               + Tasks       │
│                                                             │
│                        🔗 Integrations  →   🎯 Jira tickets│
│                                             💬 Slack recap  |
│                                             📓 Notion notes │
└─────────────────────────────────────────────────────────────┘
```

**Step 1 — Place KODA**
Put the device in the center of the room. Press power. LED turns green.

**Step 2 — Talk normally**
KODA's 12-mic array captures every voice. No one needs to install anything or press anything.

**Step 3 — End the meeting**
Host taps "End Meeting" in the KODA app. Processing begins automatically.

**Step 4 — Actions created**
Within 10-15 seconds: Jira tickets created, Slack summary posted, Notion page saved. Everything labeled with who said what.

---

## The Device

KODA is a palm-sized matte black device built for meeting rooms.

```
Dimensions    88 × 42 × 11mm (fits in a shirt pocket)
Material      Matte black polycarbonate (proto) → anodized aluminum (v2)
Microphones   2× INMP441 MEMS digital microphones
Connectivity  WiFi + Bluetooth (ESP32-S3)
Charging      USB-C
Indicator     Single 2mm LED (orange = recording, green = idle)
Controls      One button — short press: power, long press (3s): reset pairing
Storage       None — audio streams directly to backend, never stored on device
```

**Brain:** ESP32-S3 — instant boot, WiFi + BLE built in, handles audio streaming and LED control. All AI processing happens on the backend — the device stays simple and cheap.

---

## The App

KODA companion app for iOS and Android.

**Key screens:**
- **Home** — all meetings, team and personal, with AI-generated titles
- **Meeting Detail** — full transcript with speaker labels, summary, action items
- **Ask KODA** — chat with AI about any meeting ("What did we decide about the API?")
- **Record** — personal recording mode, no device needed
- **Settings** — device management, connected apps (Jira/Slack/Notion), account

**Ask KODA** is the flagship feature — a bottom drawer that lets the host ask anything about a specific meeting. Powered by Groq + Llama 3.1 70B.

---

## Tech Stack

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | FastAPI (Python) | REST API, async, auto docs |
| Database | Supabase (PostgreSQL) | All persistent data |
| STT | OpenAI Whisper (local) | Audio → text, runs on server |
| Diarization | Pyannote Audio | Speaker separation (Voice A, Voice B) |
| AI | Groq API — Llama 3.1 70B | Summary, tasks, Q&A |
| Queue | Celery + Redis | Background audio processing |
| Auth | JWT tokens | Stateless authentication |
| Integrations | Jira, Slack, Notion REST APIs | Task and note automation |

### App
| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Navigation | Expo Router |
| Animations | React Native Reanimated + Lottie |
| API client | Axios |
| Storage | AsyncStorage |

### Device Firmware
| Layer | Technology |
|---|---|
| MCU | ESP32-S3 |
| Language | C / Arduino framework |
| Audio | I2S INMP441 mic input |
| Connectivity | WiFi (audio streaming) + BLE (app pairing) |

---

Full interactive docs available at `/docs` when running locally.

---

## Competitive Landscape

| Feature | Otter.ai | Fireflies | Plaud Note | **KODA** |
|---|---|---|---|---|
| Works for offline meetings | ✗ | ✗ | ✓ | ✓ |
| Shared room device | ✗ | ✗ | ✗ | ✓ |
| Auto Jira integration | ✗ | ✗ | ✗ | ✓ |
| Auto Slack + Notion | ✓ | ✓ | ✗ | ✓ |
| No per-seat subscription | ✗ | ✗ | ✗ | ✓ |
| Team-level device | ✗ | ✗ | ✗ | ✓ |
| Data stays on your server | ✗ | ✗ | ✗ | ✓ |

---

## Roadmap

- [x] Backend API — auth, devices, meetings, audio, actions
- [x] Whisper STT pipeline with speaker diarization
- [x] Groq AI — summary, action item extraction, Q&A
- [x] Jira integration with smart cache layer
- [x] Slack + Notion integrations
- [x] Device pairing system (two-table architecture)
- [ ] React Native app — all screens
- [ ] ESP32-S3 device firmware
- [ ] WebSocket live transcript streaming
- [ ] Celery beat — Jira cache refresh
- [ ] App Store + Play Store launch
- [ ] First production batch — 100 devices
- [ ] Jira Marketplace listing
- [ ] Enterprise SSO + admin dashboard

---

## Contributing

KODA is currently in active development. If you are interested in contributing, have feedback, or want to be an early tester — reach out.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **Yash Mangal**

[getkoda.com](https://getkoda.com) · [LinkedIn](#) · [contact@getkoda.com](mailto:contact@getkoda.com)

**KOD**`A` — *Every word. Every action.*

</div>
