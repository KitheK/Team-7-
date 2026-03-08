"""
FastAPI wrapper around Sesame CSM-1B for streaming TTS.
Exposes POST /tts that accepts text and returns PCM audio.
"""

import io
import os
import torch
import torchaudio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from transformers import AutoProcessor, AutoModelForCausalLM

device = os.environ.get("CSM_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
default_speaker = int(os.environ.get("CSM_SPEAKER_ID", "0"))
default_temperature = float(os.environ.get("CSM_TEMPERATURE", "0.55"))
default_top_p = float(os.environ.get("CSM_TOP_P", "0.85"))
default_max_new_tokens = int(os.environ.get("CSM_MAX_NEW_TOKENS", "1024"))

model = None
processor = None
SAMPLE_RATE = 24000


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor
    hf_token = os.environ.get("HF_TOKEN")
    print("Loading Sesame CSM-1B model...")
    processor = AutoProcessor.from_pretrained(
        "sesame/csm-1b", token=hf_token
    )
    model = AutoModelForCausalLM.from_pretrained(
        "sesame/csm-1b",
        token=hf_token,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    ).to(device)
    model.eval()
    print(f"CSM-1B loaded on {device}")
    yield
    del model, processor


app = FastAPI(lifespan=lifespan)


class TTSRequest(BaseModel):
    text: str
    speaker_id: int = default_speaker
    sample_rate: int = SAMPLE_RATE
    temperature: float = default_temperature
    top_p: float = default_top_p


@app.post("/tts")
async def synthesize(req: TTSRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        inputs = processor(
            text=req.text,
            return_tensors="pt",
        ).to(device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=default_max_new_tokens,
                do_sample=True,
                temperature=req.temperature,
                top_p=req.top_p,
            )

        audio_tensor = processor.decode(outputs[0])
        if isinstance(audio_tensor, dict):
            audio_tensor = audio_tensor.get("audio", audio_tensor.get("waveform", outputs[0]))
        if not isinstance(audio_tensor, torch.Tensor):
            audio_tensor = torch.tensor(audio_tensor)

        audio_tensor = audio_tensor.float().cpu()
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)

        # Resample if a different rate was requested
        if req.sample_rate != SAMPLE_RATE:
            audio_tensor = torchaudio.functional.resample(
                audio_tensor, SAMPLE_RATE, req.sample_rate
            )

        buf = io.BytesIO()
        torchaudio.save(buf, audio_tensor, req.sample_rate, format="wav")
        buf.seek(0)

        return StreamingResponse(buf, media_type="audio/wav")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "sesame/csm-1b",
        "device": device,
        "loaded": model is not None,
    }
