import asyncio
import math
import time
import os
from contextlib import asynccontextmanager
from typing import Optional, Tuple

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pyrogram import Client

# ─── CONFIG ───────────────────────────────────────────────────
API_ID          = int(os.environ.get("TELEGRAM_API_ID", "38432903"))
API_HASH        = os.environ.get("TELEGRAM_API_HASH", "c4d395153850472118de00e8c84aed54")
SESSION_STRING  = os.environ.get("PYROGRAM_SESSION_STRING", "")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_KEY", "")

TEST_CHANNEL_ID = -1003569793885
TEST_MESSAGE_ID = 3
CHUNK_SIZE      = 1024 * 1024   # 1 MB per chunk
CATALOG_TTL     = 300           # 5 minutes cache TTL
INITIAL_BUFFER  = 512 * 1024  # 512KB — enough to start playing instantly

# ─── STATE ────────────────────────────────────────────────────
tg: Optional[Client] = None
catalog_cache   = {"data": None, "timestamp": 0}
video_map       = {}   # uuid → {channel_id, message_id}
message_cache   = {}   # "channelid_msgid" → message object
resolved_channels = set()

# ─── CORS HEADERS (added to every streaming response manually) ─
CORS_HEADERS = {
    "Access-Control-Allow-Origin":   "*",
    "Access-Control-Allow-Headers":  "*",
    "Access-Control-Allow-Methods":  "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers": (
        "Content-Range, Accept-Ranges, Content-Length, Content-Type"
    ),
}

# ─── TELEGRAM HELPERS ─────────────────────────────────────────
async def resolve_channel(channel_id: int | str) -> bool:
    """Introduce Pyrogram to a channel so get_messages() works."""
    cid = int(str(channel_id))
    if cid in resolved_channels:
        return True
    try:
        await tg.get_chat(cid)
        resolved_channels.add(cid)
        print(f"[NexusEdu] Resolved channel {cid}")
        return True
    except Exception as e:
        print(f"[NexusEdu] Could not resolve {cid}: {e}")
        return False


async def preload_channels():
    """Load all channels from dialogs on startup."""
    try:
        async for dialog in tg.get_dialogs():
            try:
                cid = dialog.chat.id
                resolved_channels.add(cid)
            except Exception:
                pass
        print(f"[NexusEdu] Resolved {len(resolved_channels)} channel(s) from dialogs.")
    except Exception as e:
        print(f"[NexusEdu] Dialog preload error: {e}")


async def get_message(channel_id: int, message_id: int):
    """Fetch and cache a Telegram message."""
    key = f"{channel_id}_{message_id}"
    if key not in message_cache:
        msg = await tg.get_messages(channel_id, message_id)
        message_cache[key] = msg
    return message_cache[key]


async def get_file_info(channel_id: int, message_id: int) -> Tuple[int, str]:
    """
    Returns (file_size_bytes, mime_type).
    Handles both video and document media types.
    Videos uploaded as FILES in Telegram appear as 'document' type —
    we detect this and force video/mp4 MIME type for browser playback.
    """
    msg = await get_message(channel_id, message_id)

    if msg.video:
        return msg.video.file_size, "video/mp4"

    if msg.document:
        mime = msg.document.mime_type or "video/mp4"
        # Force video MIME even if Telegram classified as generic document
        if "video" not in mime.lower():
            mime = "video/mp4"
        return msg.document.file_size, mime

    return 0, "video/mp4"


# ─── SUPABASE FETCH ───────────────────────────────────────────
async def fetch_supabase(path: str, client: httpx.AsyncClient) -> list:
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    r = await client.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


async def fetch_all_videos(client: httpx.AsyncClient) -> list:
    """Paginated fetch — handles 1,458+ videos without hitting row limits."""
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    all_videos = []
    offset = 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/videos"
            f"?is_active=eq.true&order=display_order"
            f"&offset={offset}&limit=1000"
        )
        r = await client.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        all_videos.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return all_videos

async def _prewarm_all(video_items: list):
    """
    Background task: pre-fetches Telegram messages for all videos
    so they are in message_cache before any user clicks play.
    This eliminates the 2-3 second get_messages() delay on first play.
    Fetches in small batches to avoid Telegram rate limiting.
    """
    print(f"[NexusEdu] Pre-warming {len(video_items)} video message(s)...")
    fetched = 0
    errors  = 0

    for video_id, info in video_items:
        channel_id_str = info.get("channel_id", "")
        message_id     = info.get("message_id", 0)

        if not channel_id_str or not message_id:
            continue

        key = f"{channel_id_str}_{message_id}"
        if key in message_cache:
            continue  # already cached, skip

        try:
            channel_id = int(channel_id_str)
            await resolve_channel(channel_id)
            msg = await tg.get_messages(channel_id, message_id)
            if msg and not msg.empty:
                message_cache[key] = msg
                fetched += 1
        except Exception as e:
            errors += 1
            print(f"[NexusEdu] Pre-warm failed for {key}: {e}")

        # Small delay between fetches to avoid Telegram rate limiting
        await asyncio.sleep(0.3)

    print(f"[NexusEdu] Pre-warm complete: {fetched} cached, {errors} errors.")

# ─── CATALOG BUILD ────────────────────────────────────────────
async def refresh_catalog():
    global catalog_cache, video_map

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[NexusEdu] Supabase not configured — skipping catalog load.")
        return

    try:
        async with httpx.AsyncClient() as client:
            subjects = await fetch_supabase(
                "subjects?is_active=eq.true&order=display_order", client)
            cycles   = await fetch_supabase(
                "cycles?is_active=eq.true&order=display_order", client)
            chapters = await fetch_supabase(
                "chapters?is_active=eq.true&order=display_order", client)
            videos   = await fetch_all_videos(client)

        # Build video_map for O(1) stream lookups by UUID
        new_map = {}
        for v in videos:
            new_map[v["id"]] = {
                "channel_id": v.get("telegram_channel_id", ""),
                "message_id": v.get("telegram_message_id", 0),
            }
        video_map = new_map

        # Resolve all Telegram channels found in cycles table
        unique_channels = {
            c.get("telegram_channel_id")
            for c in cycles
            if c.get("telegram_channel_id")
        }
        for cid in unique_channels:
            await resolve_channel(cid)

        # Assemble nested hierarchy: subjects → cycles → chapters → videos
        result = []
        for subj in subjects:
            s_cycles = sorted(
                [c for c in cycles if c["subject_id"] == subj["id"]],
                key=lambda x: x.get("display_order", 0),
            )
            subj_data = {**subj, "cycles": []}

            for cyc in s_cycles:
                c_chapters = sorted(
                    [ch for ch in chapters if ch["cycle_id"] == cyc["id"]],
                    key=lambda x: x.get("display_order", 0),
                )
                cyc_data = {**cyc, "chapters": []}

                for chap in c_chapters:
                    c_videos = sorted(
                        [v for v in videos if v["chapter_id"] == chap["id"]],
                        key=lambda x: x.get("display_order", 0),
                    )
                    chap_data = {
                        **chap,
                        "videos": [
                            {
                                "id":       v["id"],
                                "title":    v["title"],
                                "duration": v.get("duration", "00:00:00"),
                                "size_mb":  v.get("size_mb", 0),
                            }
                            for v in c_videos
                        ],
                    }
                    cyc_data["chapters"].append(chap_data)

                subj_data["cycles"].append(cyc_data)

            result.append(subj_data)

        catalog_cache = {
            "data":      {"subjects": result, "total_videos": len(videos)},
            "timestamp": time.time(),
        }
        print(f"[NexusEdu] Catalog loaded: {len(videos)} video(s).")

        # Pre-warm message cache for all videos so first play is instant.
        # Run as background task — does not block catalog from serving.
        asyncio.create_task(_prewarm_all(list(video_map.items())))

    except Exception as e:
        print(f"[NexusEdu] Catalog load error: {e}")


# ─── LIFESPAN (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global tg

    print("[NexusEdu] Starting Telegram client...")
    tg = Client(
        "nexusedu_session",
        api_id=API_ID,
        api_hash=API_HASH,
        session_string=SESSION_STRING,
        in_memory=True,
    )
    await tg.start()
    print("[NexusEdu] Telegram client started.")

    await preload_channels()
    await resolve_channel(TEST_CHANNEL_ID)
    await refresh_catalog()

    yield  # ← server runs here

    print("[NexusEdu] Stopping Telegram client...")
    await tg.stop()


# ─── APP ──────────────────────────────────────────────────────
app = FastAPI(title="NexusEdu Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Range", "Accept-Ranges",
        "Content-Length", "Content-Type",
    ],
)


# ─── STREAMING CORE ───────────────────────────────────────────
async def _stream_telegram(
    channel_id: int, message_id: int,
    start: int, end: int, total: int
):
    """
    Async generator that pulls 1MB chunks from Telegram and yields bytes.
    Handles:
      - Correct chunk offset for byte-accurate seeking
      - Skipping leading bytes in first chunk for non-aligned Range starts
      - Stopping exactly at the requested end byte
    """
    chunk_offset = start // CHUNK_SIZE
    skip_bytes   = start % CHUNK_SIZE
    needed       = math.ceil((end - start + 1 + skip_bytes) / CHUNK_SIZE)

    msg = await get_message(channel_id, message_id)

    bytes_sent  = 0
    target      = end - start + 1
    first_chunk = True

    async for chunk in tg.stream_media(
        msg, offset=chunk_offset, limit=needed
    ):
        data = bytes(chunk)

        # Skip leading bytes of first chunk for byte-aligned range start
        if first_chunk and skip_bytes:
            data        = data[skip_bytes:]
            first_chunk = False

        # Trim last chunk to exact requested length
        remaining = target - bytes_sent
        if len(data) > remaining:
            data = data[:remaining]

        if not data:
            break

        bytes_sent += len(data)
        yield data

        if bytes_sent >= target:
            break


def _parse_range(range_header: str, total: int) -> Tuple[int, int]:
    """Parse 'bytes=X-Y' or 'bytes=X-' into (start, end)."""
    val   = range_header.replace("bytes=", "")
    parts = val.split("-")
    start = int(parts[0]) if parts[0] else 0
    end   = int(parts[1]) if len(parts) > 1 and parts[1] else total - 1
    end   = min(end, total - 1)
    return start, end


# ─── ENDPOINTS ────────────────────────────────────────────────

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"service": "NexusEdu Backend", "status": "running"}


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    connected = tg is not None and tg.is_connected
    return {
        "status":            "ok" if connected else "degraded",
        "telegram":          "connected" if connected else "disconnected",
        "videos_cached":     len(video_map),
        "channels_resolved": len(resolved_channels),
        "catalog_age_seconds": (
            round(time.time() - catalog_cache["timestamp"])
            if catalog_cache["timestamp"] else None
        ),
    }


@app.get("/api/debug")
async def debug():
    info = {
        "telegram_connected":     False,
        "test_channel_resolved":  int(str(TEST_CHANNEL_ID)) in resolved_channels,
        "test_message_found":     False,
        "test_message_has_media": False,
        "resolved_channels":      [str(c) for c in resolved_channels],
        "channels_count":         len(resolved_channels),
        "videos_cached":          len(video_map),
        "messages_cached":        len(message_cache),
        "catalog_age_seconds":    (
            round(time.time() - catalog_cache["timestamp"])
            if catalog_cache["timestamp"] else None
        ),
        "catalog_loaded":         catalog_cache["data"] is not None,
        "errors":                 [],
    }

    try:
        info["telegram_connected"] = tg.is_connected
    except Exception as e:
        info["errors"].append(f"telegram check: {e}")

    try:
        await resolve_channel(TEST_CHANNEL_ID)
        info["test_channel_resolved"] = True
        msg = await get_message(TEST_CHANNEL_ID, TEST_MESSAGE_ID)
        if msg and not msg.empty:
            info["test_message_found"] = True
            media = msg.video or msg.document
            if media:
                info["test_message_has_media"] = True
                info["media_type"]   = "video" if msg.video else "document"
                info["file_size_mb"] = round(media.file_size / 1024 / 1024, 1)
    except Exception as e:
        info["errors"].append(f"message check: {e}")

    try:
        me = await tg.get_me()
        info["logged_in_as"] = f"{me.first_name} (ID: {me.id})"
    except Exception as e:
        info["errors"].append(f"get_me: {e}")

    return JSONResponse(info)


@app.get("/api/catalog")
async def catalog():
    now = time.time()
    if (
        catalog_cache["data"] is None
        or now - catalog_cache["timestamp"] > CATALOG_TTL
    ):
        await refresh_catalog()
    return catalog_cache["data"] or {"subjects": [], "total_videos": 0}


@app.get("/api/refresh")
async def force_refresh():
    await refresh_catalog()
    return {"status": "refreshed", "videos": len(video_map)}


@app.get("/api/warmup")
async def warmup():
    if not video_map:
        return JSONResponse({"status": "ignored", "reason": "no videos mapped"})
    asyncio.create_task(_prewarm_all(list(video_map.items())))
    return JSONResponse({"status": "started", "videos": len(video_map)})


@app.get("/api/prefetch/{video_id}")
async def prefetch_video(video_id: str):
    if video_id not in video_map:
        return JSONResponse({"status": "ignored", "reason": "not found"})
    
    info = video_map[video_id]
    channel_id_str = info.get("channel_id", "")
    message_id = info.get("message_id", 0)
    
    if not channel_id_str or not message_id:
        return JSONResponse({"status": "ignored", "reason": "no telegram link"})
        
    key = f"{channel_id_str}_{message_id}"
    if key in message_cache:
        return JSONResponse({"status": "cached", "reason": "already cached"})
        
    try:
        channel_id = int(channel_id_str)
        await resolve_channel(channel_id)
        msg = await tg.get_messages(channel_id, message_id)
        if msg and not msg.empty:
            message_cache[key] = msg
            return JSONResponse({"status": "success", "reason": "fetched"})
    except Exception as e:
        return JSONResponse({"status": "error", "reason": str(e)})
        
    return JSONResponse({"status": "error", "reason": "unknown"})


@app.get("/api/stream/{video_id}")
async def stream_video(video_id: str, request: Request):
    # ── Lookup video in map ────────────────────────────────────
    if video_id not in video_map:
        await refresh_catalog()
    if video_id not in video_map:
        raise HTTPException(404, "Video not found")

    info       = video_map[video_id]
    channel_id = int(info["channel_id"])
    message_id = int(info["message_id"])

    if not channel_id or not message_id:
        raise HTTPException(400, "Video not linked to Telegram — add message_id and channel_id in admin panel")

    await resolve_channel(channel_id)

    try:
        total, mime_type = await get_file_info(channel_id, message_id)
        if not total:
            raise HTTPException(500, "Could not read file size from Telegram")

        range_header = request.headers.get("range")

        if range_header:
            # ── Seeking request (HTTP 206) ─────────────────────
            start, end = _parse_range(range_header, total)
            length = end - start + 1
            headers = {
                **CORS_HEADERS,
                "Content-Range":  f"bytes {start}-{end}/{total}",
                "Accept-Ranges":  "bytes",
                "Content-Length": str(length),
                "Content-Type":   mime_type,
            }
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, start, end, total),
                status_code=206,
                headers=headers,
            )
        else:
            # ── Initial request — serve first 10MB as HTTP 206 ─
            # This forces the browser to start playing immediately
            # from the first 10MB buffer, then it automatically
            # sends Range requests for the rest. Without this,
            # the browser tries to download the full 600MB before
            # playing, which times out on free hosting.
            initial_end = min(total - 1, INITIAL_BUFFER - 1)
            length      = initial_end - 0 + 1
            headers = {
                **CORS_HEADERS,
                "Content-Range":  f"bytes 0-{initial_end}/{total}",
                "Accept-Ranges":  "bytes",
                "Content-Length": str(length),
                "Content-Type":   mime_type,
            }
            return StreamingResponse(
                _stream_telegram(channel_id, message_id, 0, initial_end, total),
                status_code=206,
                headers=headers,
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Stream error for {video_id}: {e}")
        raise HTTPException(500, f"Stream error: {e}")


@app.get("/api/test-stream")
async def test_stream(request: Request):
    """Test endpoint — streams the hardcoded test video."""
    await resolve_channel(TEST_CHANNEL_ID)

    try:
        total, mime_type = await get_file_info(TEST_CHANNEL_ID, TEST_MESSAGE_ID)
        if not total:
            raise HTTPException(500, "Test message not found or has no media. Check Telegram channel.")

        range_header = request.headers.get("range")

        if range_header:
            start, end = _parse_range(range_header, total)
            length = end - start + 1
            return StreamingResponse(
                _stream_telegram(TEST_CHANNEL_ID, TEST_MESSAGE_ID,
                                 start, end, total),
                status_code=206,
                headers={
                    **CORS_HEADERS,
                    "Content-Range":  f"bytes {start}-{end}/{total}",
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(length),
                    "Content-Type":   mime_type,
                },
            )
        else:
            initial_end = min(total - 1, INITIAL_BUFFER - 1)
            length      = initial_end - 0 + 1
            return StreamingResponse(
                _stream_telegram(TEST_CHANNEL_ID, TEST_MESSAGE_ID,
                                 0, initial_end, total),
                status_code=206,
                headers={
                    **CORS_HEADERS,
                    "Content-Range":  f"bytes 0-{initial_end}/{total}",
                    "Accept-Ranges":  "bytes",
                    "Content-Length": str(length),
                    "Content-Type":   mime_type,
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Test stream error: {e}")
        raise HTTPException(500, f"Test stream error: {e}")


# ─── RUN ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("[NexusEdu] Starting server on port 8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)