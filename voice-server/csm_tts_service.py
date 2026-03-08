"""
Custom Pipecat TTSService that calls the local Sesame CSM-1B FastAPI server.
Follows the same pattern as Pipecat's built-in PiperHttpTTSService and XTTSService.
"""

import os
import aiohttp
from pipecat.services.ai_services import TTSService
from pipecat.frames.frames import (
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
    ErrorFrame,
)
from loguru import logger

# Twilio expects 8kHz mulaw, but we produce 24kHz PCM from CSM-1B
# and let the transport layer handle conversion.
CSM_SAMPLE_RATE = 24000
DEFAULT_PLAYBACK_CHUNK_MS = int(os.environ.get("CSM_PLAYBACK_CHUNK_MS", "80"))


class CSMTTSService(TTSService):
    """Pipecat TTS service that delegates to a local Sesame CSM-1B FastAPI server."""

    def __init__(
        self,
        *,
        base_url: str = "http://csm-tts:8003",
        speaker_id: int = 0,
        sample_rate: int = CSM_SAMPLE_RATE,
        temperature: float = 0.55,
        top_p: float = 0.85,
        playback_chunk_ms: int = DEFAULT_PLAYBACK_CHUNK_MS,
        aiohttp_session: aiohttp.ClientSession,
        **kwargs,
    ):
        super().__init__(sample_rate=sample_rate, **kwargs)
        self._base_url = base_url.rstrip("/")
        self._speaker_id = speaker_id
        self._temperature = temperature
        self._top_p = top_p
        self._playback_chunk_ms = max(40, playback_chunk_ms)
        self._session = aiohttp_session

    def can_generate_metrics(self) -> bool:
        return True

    async def run_tts(self, text: str) -> None:
        """Generate speech from text via the CSM-1B server and yield audio frames."""
        logger.debug(f"CSM TTS generating: {text[:80]}...")

        await self.push_frame(TTSStartedFrame())

        try:
            async with self._session.post(
                f"{self._base_url}/tts",
                json={
                    "text": text,
                    "speaker_id": self._speaker_id,
                    "sample_rate": self._sample_rate,
                    "temperature": self._temperature,
                    "top_p": self._top_p,
                },
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"CSM TTS error {resp.status}: {error_text}")
                    await self.push_frame(ErrorFrame(f"CSM TTS error: {error_text}"))
                    return

                # Read the WAV response in chunks and yield raw audio frames.
                # Skip the 44-byte WAV header to get raw PCM data.
                data = await resp.read()
                header_size = 44
                pcm_data = data[header_size:] if len(data) > header_size else data

                # Yield audio in ~100ms chunks for smooth streaming
                chunk_size = int(self._sample_rate * 2 * (self._playback_chunk_ms / 1000.0))
                for i in range(0, len(pcm_data), chunk_size):
                    chunk = pcm_data[i : i + chunk_size]
                    await self.push_frame(
                        TTSAudioRawFrame(
                            audio=chunk,
                            sample_rate=self._sample_rate,
                            num_channels=1,
                        )
                    )

        except aiohttp.ClientError as e:
            logger.error(f"CSM TTS connection error: {e}")
            await self.push_frame(ErrorFrame(f"CSM TTS connection error: {e}"))
        except Exception as e:
            logger.error(f"CSM TTS unexpected error: {e}")
            await self.push_frame(ErrorFrame(f"CSM TTS error: {e}"))

        await self.push_frame(TTSStoppedFrame())
