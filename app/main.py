from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .routes import create_router
from .settings import load_settings

load_dotenv()
settings = load_settings()

app = FastAPI(title="SchemaGate", version="0.1.0")


@app.middleware("http")
async def request_size_guard(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH"}:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_body_bytes:
            return JSONResponse(
                status_code=413,
                content={"error": "payload_too_large", "detail": "Request body too large"},
            )
        body = await request.body()
        if len(body) > settings.max_body_bytes:
            return JSONResponse(
                status_code=413,
                content={"error": "payload_too_large", "detail": "Request body too large"},
            )
        request._body = body
    return await call_next(request)


@app.get("/health")
async def health():
    return {"ok": True}


app.include_router(create_router(settings))
