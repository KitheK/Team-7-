"""
Pipecat pipeline orchestrator for AI vendor negotiation calls.

Pipeline: Twilio WebSocket -> Distil-Whisper STT
          -> Llama 3.2 3B (vLLM) -> Sesame CSM-1B TTS -> Twilio

Receives the negotiation_id via query parameter from Twilio's
Media Stream webhook URL.
"""

import os
import asyncio
import json
from urllib.parse import parse_qs, urlparse

import aiohttp
from loguru import logger

from pipecat.frames.frames import EndFrame, Frame, LLMMessagesFrame, TTSSpeakFrame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.services.openai import OpenAILLMService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.transports.services.twilio import TwilioTransport, TwilioParams

from csm_tts_service import CSMTTSService
from negotiation_llm import build_system_prompt, fetch_negotiation, trim_context
from webhook_client import WebhookClient

STT_URL = os.environ.get("STT_URL", "http://speaches:8000")
STT_MODEL = os.environ.get("STT_MODEL", "whisper-1")
LLM_URL = os.environ.get("LLM_URL", "http://vllm:8000/v1")
TTS_URL = os.environ.get("TTS_URL", "http://csm-tts:8003")
TTS_SPEAKER_ID = int(os.environ.get("CSM_SPEAKER_ID", "0"))
TTS_TEMPERATURE = float(os.environ.get("CSM_TEMPERATURE", "0.55"))
TTS_TOP_P = float(os.environ.get("CSM_TOP_P", "0.85"))
TTS_PLAYBACK_CHUNK_MS = int(os.environ.get("CSM_PLAYBACK_CHUNK_MS", "80"))
PIPELINE_HOST = os.environ.get("PIPELINE_HOST", "0.0.0.0")
PIPELINE_PORT = int(os.environ.get("PIPELINE_PORT", "8765"))


def normalize_openai_base_url(url: str) -> str:
    """Speaches exposes an OpenAI-compatible API; Pipecat expects the /v1 base path."""
    trimmed = url.rstrip("/")
    return trimmed if trimmed.endswith("/v1") else f"{trimmed}/v1"


class UserTurnProcessor(FrameProcessor):
    """Converts final transcription frames into LLM turns and transcript updates."""

    def __init__(self, messages: list[dict], webhook: WebhookClient, **kwargs):
        super().__init__(**kwargs)
        self._messages = messages
        self._webhook = webhook

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            text = frame.text.strip()
            if text:
                self._webhook.add_transcript_line("vendor", text)
                self._messages.append({"role": "user", "content": text})
                trimmed = trim_context(self._messages)
                self._messages[:] = trimmed
                await self.push_frame(LLMMessagesFrame(messages=trimmed), direction)
            return

        await self.push_frame(frame, direction)


async def run_pipeline(
    websocket,
    negotiation_id: str,
    call_id: str | None,
):
    """Build and run a Pipecat pipeline for a single negotiation call."""

    # Fetch negotiation context from Supabase
    negotiation = await fetch_negotiation(negotiation_id)
    if not negotiation:
        logger.error(f"Cannot find negotiation {negotiation_id}, using defaults")
        negotiation = {
            "vendor_name": "vendor",
            "tone": "collaborative",
            "target_discount": 15,
            "annual_spend": "N/A",
            "brief": {},
            "script": {},
        }

    canonical_call_id = negotiation.get("call_id") or call_id or negotiation_id
    if call_id and canonical_call_id != call_id:
        logger.info(
            f"Using canonical call_id from negotiation record: websocket={call_id}, stored={canonical_call_id}"
        )

    system_prompt = build_system_prompt(negotiation)
    messages = [{"role": "system", "content": system_prompt}]

    # Webhook client for Supabase transcript relay
    webhook = WebhookClient(call_id=canonical_call_id, negotiation_id=negotiation_id)
    await webhook.start()

    async with aiohttp.ClientSession() as session:
        # Transport: Twilio WebSocket
        transport = TwilioTransport(
            websocket=websocket,
            params=TwilioParams(audio_out_enabled=True),
        )

        # STT: Distil-Whisper via Speaches' OpenAI-compatible transcription API
        stt = OpenAISTTService(
            api_key="not-needed",
            base_url=normalize_openai_base_url(STT_URL),
            model=STT_MODEL,
        )

        # LLM: Llama 3.2 3B via vLLM (OpenAI-compatible API)
        llm = OpenAILLMService(
            api_key="not-needed",
            base_url=LLM_URL,
            model="meta-llama/Llama-3.2-3B-Instruct",
        )

        # TTS: Sesame CSM-1B via our custom service
        tts = CSMTTSService(
            base_url=TTS_URL,
            speaker_id=TTS_SPEAKER_ID,
            temperature=TTS_TEMPERATURE,
            top_p=TTS_TOP_P,
            playback_chunk_ms=TTS_PLAYBACK_CHUNK_MS,
            aiohttp_session=session,
        )

        user_turns = UserTurnProcessor(messages=messages, webhook=webhook)

        # Assemble the pipeline
        pipeline = Pipeline(
            [
                transport.input(),
                stt,
                user_turns,
                llm,
                tts,
                transport.output(),
            ]
        )

        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
            ),
        )

        @stt.event_handler("on_connected")
        async def on_stt_connected(service):
            logger.info(f"STT connected to {normalize_openai_base_url(STT_URL)}")

        @stt.event_handler("on_connection_error")
        async def on_stt_connection_error(service, error):
            logger.error(f"STT connection error: {error}")

        @llm.event_handler("on_llm_response")
        async def on_llm_response(text: str):
            webhook.add_transcript_line("agent", text)
            messages.append({"role": "assistant", "content": text})
            messages[:] = trim_context(messages)

        @transport.event_handler("on_client_disconnected")
        async def on_disconnect():
            logger.info(f"Call ended for negotiation {negotiation_id}")
            await webhook.send_call_ended()
            await task.queue_frame(EndFrame())

        opening_text = (
            (negotiation.get("script") or {}).get("opening")
            or f"Hello, this is the procurement team calling about our relationship with {negotiation.get('vendor_name', 'your team')}."
        ).strip()

        if opening_text:
            messages.append({"role": "assistant", "content": opening_text})
            webhook.add_transcript_line("agent", opening_text)
            await task.queue_frame(TTSSpeakFrame(opening_text))

        runner = PipelineRunner()
        try:
            await runner.run(task)
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            await webhook.send_call_failed(str(e))
        finally:
            await webhook.stop()


async def handle_websocket(websocket, path: str = ""):
    """Handle an incoming Twilio Media Stream WebSocket connection."""
    # Extract negotiation_id from the query string
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    negotiation_id = params.get("negotiation_id", [None])[0]
    call_id = params.get("call_id", [None])[0]

    if not negotiation_id:
        # Try to get it from the first Twilio message
        try:
            msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(msg)
            if data.get("event") == "start":
                start_data = data.get("start", {})
                custom_params = start_data.get("customParameters", {})
                negotiation_id = custom_params.get("negotiation_id", "unknown")
                call_id = custom_params.get("call_id") or start_data.get("callSid") or call_id
        except Exception as e:
            logger.error(f"Failed to read Twilio start message: {e}")
            negotiation_id = "unknown"

    logger.info(f"WebSocket connected: negotiation={negotiation_id}, call={call_id}")
    await run_pipeline(websocket, negotiation_id, call_id)


async def main():
    """Start the WebSocket server."""
    try:
        import websockets
        logger.info(f"Starting Pipecat voice server on ws://{PIPELINE_HOST}:{PIPELINE_PORT}")
        async with websockets.serve(handle_websocket, PIPELINE_HOST, PIPELINE_PORT):
            await asyncio.Future()  # run forever
    except ImportError:
        logger.error("websockets package not installed")
        raise


if __name__ == "__main__":
    asyncio.run(main())
