"""
Async HTTP client that relays transcript lines and call events
to the Supabase negotiations-webhook Edge Function.
"""

import os
import asyncio
import aiohttp
from loguru import logger

WEBHOOK_BASE_URL = os.environ.get("WEBHOOK_BASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


class WebhookClient:
    """Batches transcript lines and POSTs them to the negotiations-webhook."""

    def __init__(self, call_id: str, negotiation_id: str):
        self._call_id = call_id
        self._negotiation_id = negotiation_id
        self._webhook_url = f"{WEBHOOK_BASE_URL}/negotiations-webhook"
        self._queue: asyncio.Queue[dict] = asyncio.Queue()
        self._session: aiohttp.ClientSession | None = None
        self._task: asyncio.Task | None = None
        self._timestamp_counter = 0

    async def start(self):
        self._session = aiohttp.ClientSession()
        self._task = asyncio.create_task(self._flush_loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._session:
            await self._session.close()

    def add_transcript_line(self, speaker: str, text: str):
        """Queue a transcript line for batched sending."""
        if not text.strip():
            return
        self._timestamp_counter += 1
        self._queue.put_nowait({
            "text": text,
            "speaker": speaker,
            "timestamp": self._timestamp_counter * 1000,
        })

    async def send_call_ended(self):
        """Notify the webhook that the call has completed."""
        await self._post({
            "call_id": self._call_id,
            "status": "completed",
            "completed": True,
        })

    async def send_call_failed(self, reason: str = "error"):
        """Notify the webhook that the call failed."""
        await self._post({
            "call_id": self._call_id,
            "status": "failed",
        })

    async def _flush_loop(self):
        """Drain the queue every 500ms and POST batched transcript lines."""
        while True:
            await asyncio.sleep(0.5)
            lines = []
            while not self._queue.empty():
                try:
                    lines.append(self._queue.get_nowait())
                except asyncio.QueueEmpty:
                    break

            if lines:
                await self._post({
                    "call_id": self._call_id,
                    "status": "in-progress",
                    "transcripts": [
                        {
                            "user": line["speaker"],
                            "text": line["text"],
                            "timestamp": line["timestamp"],
                        }
                        for line in lines
                    ],
                })

    async def _post(self, payload: dict):
        if not self._session or not self._webhook_url:
            logger.warning("Webhook client not configured, skipping POST")
            return

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }

        try:
            async with self._session.post(
                self._webhook_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status >= 400:
                    body = await resp.text()
                    logger.error(f"Webhook POST failed {resp.status}: {body}")
        except Exception as e:
            logger.error(f"Webhook POST error: {e}")
