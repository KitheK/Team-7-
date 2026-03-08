# Voice Server – AI Vendor Negotiation Pipeline

Self-hosted voice pipeline for automated vendor negotiation calls.
Uses Pipecat to orchestrate Distil-Whisper (STT), Llama 3.2 3B (LLM),
and Sesame CSM-1B (TTS) with Twilio telephony.

## Architecture

```
Twilio Media Streams
  └─ WebSocket ─→ Pipecat Pipeline (port 8765)
                    ├─ Distil-Whisper v3 via Speaches (STT, port 8001)
                    ├─ Llama 3.2 3B via vLLM (LLM, port 8002)
                    └─ Sesame CSM-1B (TTS, port 8003)
```

## Hardware Requirements

| Component       | VRAM    |
|-----------------|---------|
| Distil-Whisper  | ~2 GB   |
| Llama 3.2 3B   | ~6 GB   |
| Sesame CSM-1B  | ~8 GB   |
| **Total**       | **~16 GB** |

Fits on a single RTX 3090, RTX 4090, or cloud A10G instance.

## Setup: Local GPU (RTX 3090/4090)

### Prerequisites

- NVIDIA GPU with >= 16 GB VRAM
- Docker with NVIDIA Container Toolkit
- ngrok account (for exposing WebSocket to Twilio)

### Steps

1. Clone and configure:

```bash
cd voice-server
cp .env.example .env
# Fill in SUPABASE_SERVICE_ROLE_KEY, HF_TOKEN, and Twilio credentials
```

2. Start all services:

```bash
docker compose up --build
```

3. Expose the WebSocket server via ngrok:

```bash
ngrok http 8765
```

4. Copy the ngrok URL (e.g. `wss://abc123.ngrok.io`) and configure it as
   the `PIPECAT_WS_URL` in the Supabase Edge Function environment, or
   pass it when initiating a call via the Twilio API.

5. Configure Twilio:
   - Buy a phone number in the Twilio console
   - Set the Voice webhook to your ngrok URL
   - Or use the Twilio REST API to initiate outbound calls pointing
     Media Streams to your ngrok WebSocket

## Setup: Cloud GPU (RunPod / Lambda / AWS)

### AWS G5 (A10G) Example

1. Launch a `g5.xlarge` instance (1x A10G, 24 GB VRAM, ~$1.01/hr on-demand,
   ~$0.50/hr spot).

2. Install NVIDIA drivers + Docker:

```bash
sudo apt update && sudo apt install -y nvidia-driver-535 docker.io nvidia-container-toolkit
sudo systemctl restart docker
```

3. Clone, configure `.env`, and start:

```bash
git clone <repo-url>
cd Team-7-/voice-server
cp .env.example .env
# Edit .env with your keys
docker compose up --build -d
```

4. The instance has a public IP — no ngrok needed. Point Twilio
   Media Streams directly to `wss://<public-ip>:8765`.

5. For HTTPS/WSS, put Caddy or nginx in front with a Let's Encrypt cert.

### RunPod

1. Create a GPU pod with >= 16 GB VRAM (A10G or RTX 4090).
2. Use the "RunPod Docker" template, or SSH in and run the same
   Docker Compose setup.
3. RunPod provides a public endpoint — use that for Twilio.

## Initiating a Call

The `negotiations-start` Supabase Edge Function handles call initiation.
When `provider` is set to `"local"`, it:

1. Generates the negotiation script via Hugging Face
2. Calls the Twilio REST API to place an outbound call
3. Connects Twilio's Media Stream to this WebSocket server
4. Passes `negotiation_id` as a custom parameter

The pipeline then:
- Fetches the negotiation context from Supabase
- Opens with the scripted greeting, then runs the real-time voice negotiation
- Streams transcript lines to the `negotiations-webhook` Edge Function
- Triggers summarisation when the call ends

## Estimated Costs

| Item                  | Cost              |
|-----------------------|-------------------|
| GPU instance (spot)   | ~$0.50/hr         |
| Twilio phone line     | ~$1/mo            |
| Twilio per-minute     | ~$0.014/min       |
| AI model inference    | $0 (self-hosted)  |

For a typical 5-minute negotiation call: ~$0.07 in Twilio fees + GPU time.

## Staging Validation Checklist

Before treating the local voice stack as production-ready, validate these scenarios in order:

1. Configuration and health
   - Confirm `PIPECAT_WS_URL`, Twilio credentials, `WEBHOOK_BASE_URL`, and Supabase service credentials are set.
   - Confirm the `speaches`, `vllm`, `csm-tts`, and `pipecat` containers are healthy.
   - Confirm `negotiations-start` returns a real `call_id`.

2. Happy-path outbound call
   - Start a negotiation from the app with a controlled staging phone number.
   - Verify the call is placed and the agent opens with the scripted greeting.
   - Verify `negotiations.status` moves from `pending` to `calling` to `completed`.

3. Transcript flow
   - Confirm transcript rows are inserted into `call_transcript_lines` during the call.
   - Confirm duplicate transcript batches are not inserted twice.
   - Confirm the live transcript UI updates during the call.

4. Failure-path testing
   - Test an invalid or unreachable phone number and verify the negotiation ends with `failed`.
   - Test a no-answer scenario and verify it is categorized as `no_answer`.
   - Temporarily break the webhook URL or correlation inputs and verify logs point to transcript correlation or delivery failure.

5. Summarization and savings
   - Confirm `negotiations-summarise` runs after call completion.
   - Confirm `outcome`, `agreed_discount`, and `follow_up_email` are saved back to `negotiations`.
   - If a successful discount is agreed, confirm a `negotiation_saving` anomaly is inserted.

6. Logging review
   - Review structured logs from `negotiations-start`, `negotiations-webhook`, `negotiations-summarise`, and the voice webhook client.
   - Confirm failures are categorized clearly as configuration, provider launch, webhook delivery, transcript correlation, no-answer, or summarization failures.
