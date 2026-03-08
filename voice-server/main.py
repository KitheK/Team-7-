"""
Pipecat pipeline orchestrator for AI vendor negotiation calls.

Pipeline: Twilio WebSocket -> Silero VAD -> Distil-Whisper STT
          -> Llama 3.2 3B (vLLM) -> Sesame CSM-1B TTS -> Twilio

Receives the negotiation_id via query parameter from Twilio's
Media Stream webhook URL.
"""

import os
import asyncio
import json
import uuid
from urllib.parse import parse_qs, urlparse

import aiohttp
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.transports.services.twilio import TwilioTransport, TwilioParams
from pipecat.services.openai import OpenAILLMService
from pipecat.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import (
    TranscriptionFrame,
    LLMMessagesFrame,
    EndFrame,
)

from csm_tts_service import CSMTTSService
from negotiation_llm import build_system_prompt, fetch_negotiation, trim_context
from webhook_client import WebhookClient

STT_URL = os.environ.get("STT_URL", "http://speaches:8000")
LLM_URL = os.environ.get("LLM_URL", "http://vllm:8000/v1")
TTS_URL = os.environ.get("TTS_URL", "http://csm-tts:8003")
PIPELINE_HOST = os.environ.get("PIPELINE_HOST", "0.0.0.0")
PIPELINE_PORT = int(os.environ.get("PIPELINE_PORT", "8765"))


async def run_pipeline(
    websocket,
    negotiation_id: str,
    call_id: str,
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

    system_prompt = build_system_prompt(negotiation)
    messages = [{"role": "system", "content": system_prompt}]

    # Webhook client for Supabase transcript relay
    webhook = WebhookClient(call_id=call_id, negotiation_id=negotiation_id)
    await webhook.start()

    async with aiohttp.ClientSession() as session:
        # Transport: Twilio WebSocket
        transport = TwilioTransport(
            websocket=websocket,
            params=TwilioParams(audio_out_enabled=True),
        )

        # VAD: Silero for barge-in detection
        vad = SileroVADAnalyzer(
            sample_rate=8000,
            num_channels=1,
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
            aiohttp_session=session,
        )

        # Assemble the pipeline
        pipeline = Pipeline(
            [
                transport.input(),
                vad,
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

        # Event handlers for transcript relay
        @transport.event_handler("on_transcription")
        async def on_transcription(frame: TranscriptionFrame):
            text = frame.text if hasattr(frame, "text") else str(frame)
            webhook.add_transcript_line("vendor", text)

            messages.append({"role": "user", "content": text})
            trimmed = trim_context(messages)
            await task.queue_frame(LLMMessagesFrame(messages=trimmed))

        @llm.event_handler("on_llm_response")
        async def on_llm_response(text: str):
            webhook.add_transcript_line("agent", text)
            messages.append({"role": "assistant", "content": text})

        @transport.event_handler("on_client_disconnected")
        async def on_disconnect():
            logger.info(f"Call ended for negotiation {negotiation_id}")
            await webhook.send_call_ended()
            await task.queue_frame(EndFrame())

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
    call_id = params.get("call_id", [str(uuid.uuid4())])[0]

    if not negotiation_id:
        # Try to get it from the first Twilio message
        try:
            msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(msg)
            if data.get("event") == "start":
                custom_params = data.get("start", {}).get("customParameters", {})
                negotiation_id = custom_params.get("negotiation_id", "unknown")
                call_id = custom_params.get("call_id", call_id)
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
