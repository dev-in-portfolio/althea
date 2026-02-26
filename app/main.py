import uuid

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response

from .routes import create_router
from .security import RateLimiter, rate_limit_key
from .settings import load_settings

load_dotenv()
settings = load_settings()

app = FastAPI(title="SchemaGate", version="0.1.0")
rate_limiter = RateLimiter()


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "request_error", "detail": exc.detail, "requestId": request_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "detail": exc.errors(), "requestId": request_id},
    )


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


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


@app.middleware("http")
async def rate_limit_guard(request: Request, call_next):
    if request.url.path in {"/health", "/health/db", "/docs", "/openapi.json", "/"}:
        return await call_next(request)
    key = rate_limit_key(request)
    if not rate_limiter.allow(key):
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limited", "detail": "Too many requests"},
        )
    return await call_next(request)


@app.get("/", include_in_schema=False)
async def root():
    html = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SchemaGate</title>
  </head>
  <body style="font-family:system-ui; padding:2rem; max-width:900px;">
    <h1>SchemaGate API</h1>
    <p>API-only service. Store schemas, validate and normalize payloads.</p>

    <h2>Quick Links</h2>
    <ul>
      <li><a href="/docs">/docs</a> (interactive docs)</li>
      <li><a href="/openapi.json">/openapi.json</a></li>
      <li><a href="/health">/health</a></li>
      <li><a href="/health/db">/health/db</a> (requires DATABASE_URL)</li>
    </ul>

    <h2>Notes</h2>
    <ul>
      <li>All non-health endpoints require <code>x-user-key</code>.</li>
      <li>Use <code>strict=true</code> on validate/normalize to treat unknown keys as errors.</li>
    </ul>

    <h2>Example</h2>
    <pre>curl -s -X POST http://localhost:8000/validate/events_v1 \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"id":"abc","name":"  Devin  ","age":"42"}'</pre>
  </body>
</html>
""".strip()
    return Response(content=html, media_type="text/html")


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/health/db")
async def health_db():
    if not settings.database_url:
        return {"ok": False, "error": "DATABASE_URL not configured"}
    try:
        with psycopg.connect(settings.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("select 1")
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


app.include_router(create_router(settings))
