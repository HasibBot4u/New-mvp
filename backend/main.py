# FILE: backend/main.py
import os
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pyrogram import Client
import httpx

TELEGRAM_API_ID = int(os.environ.get("TELEGRAM_API_ID", "0"))
TELEGRAM_API_HASH = os.environ.get("TELEGRAM_API_HASH", "")
PYROGRAM_SESSION_STRING = os.environ.get("PYROGRAM_SESSION_STRING", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

tg = None
resolved_channels = set()
catalog_cache = {"data": None, "timestamp": 0}
video_map = {}
message_cache = {}
CHUNK_SIZE = 1024 * 1024
CATALOG_TTL = 300

async def resolve_channel(channel_id: str):
    if channel_id in resolved_channels:
        return True
    try:
        await tg.get_chat(int(channel_id))
        resolved_channels.add(channel_id)
        return True
    except Exception as e:
        print(f"Cannot resolve {channel_id}: {e}")
        return False

async def fetch_from_supabase():
    global video_map
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    async with httpx.AsyncClient() as client:
        # Fetch subjects
        res = await client.get(f"{SUPABASE_URL}/rest/v1/subjects?select=*&order=display_order.asc", headers=headers)
        res.raise_for_status()
        subjects = res.json()
        
        # Fetch cycles
        res = await client.get(f"{SUPABASE_URL}/rest/v1/cycles?select=*&order=display_order.asc", headers=headers)
        res.raise_for_status()
        cycles = res.json()
        
        # Fetch chapters
        res = await client.get(f"{SUPABASE_URL}/rest/v1/chapters?select=*&order=display_order.asc", headers=headers)
        res.raise_for_status()
        chapters = res.json()
        
        # Fetch videos (paginated)
        videos = []
        offset = 0
        limit = 1000
        while True:
            res = await client.get(f"{SUPABASE_URL}/rest/v1/videos?select=*&order=display_order.asc&offset={offset}&limit={limit}", headers=headers)
            res.raise_for_status()
            batch = res.json()
            videos.extend(batch)
            if len(batch) < limit:
                break
            offset += limit
            
        # Assemble hierarchy
        new_video_map = {}
        
        for subject in subjects:
            subject["cycles"] = [c for c in cycles if c["subject_id"] == subject["id"]]
            for cycle in subject["cycles"]:
                cycle["chapters"] = [ch for ch in chapters if ch["cycle_id"] == cycle["id"]]
                for chapter in cycle["chapters"]:
                    chapter["videos"] = [v for v in videos if v["chapter_id"] == chapter["id"]]
                    for video in chapter["videos"]:
                        new_video_map[str(video["id"])] = {
                            "channel_id": video.get("telegram_channel_id") or cycle.get("telegram_channel_id"),
                            "message_id": video.get("telegram_message_id")
                        }
                        
        video_map.clear()
        video_map.update(new_video_map)
        
        return {
            "subjects": subjects,
            "total_videos": len(videos)
        }

async def refresh_catalog():
    try:
        data = await fetch_from_supabase()
        catalog_cache["data"] = data
        catalog_cache["timestamp"] = time.time()
        
        # Resolve all channels
        for vid, info in video_map.items():
            if info["channel_id"]:
                await resolve_channel(str(info["channel_id"]))
                
        print(f"[NexusEdu] Catalog refreshed. {len(video_map)} videos loaded.")
    except Exception as e:
        print(f"[NexusEdu] Error refreshing catalog: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tg
    tg = Client("session", session_string=PYROGRAM_SESSION_STRING, api_id=TELEGRAM_API_ID, api_hash=TELEGRAM_API_HASH, in_memory=False, workdir="/tmp")
    await tg.start()
    print("[NexusEdu] Telegram client connected")
    
    await resolve_channel("-1003569793885")
    
    try:
        async for dialog in tg.get_dialogs(limit=100):
            if hasattr(dialog.chat, 'id'):
                resolved_channels.add(str(dialog.chat.id))
    except Exception as e:
        print(f"[NexusEdu] Error loading dialogs: {e}")
        
    await refresh_catalog()
    yield
    await tg.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"]
)

def parse_range(range_header: str, file_size: int):
    range_match = range_header.strip().split("=")[-1]
    start_str, end_str = range_match.split("-")
    start = int(start_str) if start_str else 0
    end = int(end_str) if end_str else file_size - 1
    if end >= file_size:
        end = file_size - 1
    return start, end

async def stream_telegram_video(message, start=0, end=None):
    total = message.video.file_size if message.video else message.document.file_size
    if end is None:
        end = total - 1
    length = end - start + 1
    
    chunk_offset = start // CHUNK_SIZE
    skip_bytes = start % CHUNK_SIZE
    
    bytes_sent = 0
    first_chunk = True
    
    async for chunk in tg.stream_media(message, offset=chunk_offset):
        data = bytes(chunk)
        if first_chunk and skip_bytes > 0:
            data = data[skip_bytes:]
            first_chunk = False
        if bytes_sent + len(data) > length:
            data = data[:length - bytes_sent]
        bytes_sent += len(data)
        yield data
        if bytes_sent >= length:
            break

@app.get("/")
async def root():
    return {"service": "NexusEdu Backend", "status": "running", "version": "2.0"}

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "telegram": "connected" if tg and tg.is_connected else "disconnected",
        "videos_cached": len(video_map),
        "channels_resolved": len(resolved_channels),
        "cache_age_seconds": int(time.time() - catalog_cache["timestamp"])
    }

@app.get("/api/catalog")
async def get_catalog():
    if time.time() - catalog_cache["timestamp"] > CATALOG_TTL:
        await refresh_catalog()
    return catalog_cache["data"]

@app.get("/api/refresh")
async def force_refresh():
    catalog_cache["timestamp"] = 0
    await refresh_catalog()
    return {"status": "refreshed", "videos": len(video_map)}

@app.get("/api/stream/{video_id}")
async def stream_video(video_id: str, request: Request):
    try:
        if video_id not in video_map:
            await refresh_catalog()
            if video_id not in video_map:
                raise HTTPException(404, "Video not found")
                
        info = video_map[video_id]
        channel_id = info.get("channel_id")
        message_id = info.get("message_id")
        
        if not channel_id or not message_id:
            raise HTTPException(400, "Video not linked to Telegram")
            
        await resolve_channel(str(channel_id))
        
        cache_key = f"{channel_id}_{message_id}"
        if cache_key in message_cache:
            message = message_cache[cache_key]
        else:
            message = await tg.get_messages(int(channel_id), int(message_id))
            if not message or message.empty:
                raise HTTPException(404, "Telegram message not found")
            message_cache[cache_key] = message
            
        file_size = message.video.file_size if message.video else message.document.file_size
        
        range_header = request.headers.get("range")
        if range_header:
            start, end = parse_range(range_header, file_size)
            status_code = 206
        else:
            start, end = 0, file_size - 1
            status_code = 200
            
        headers = {
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
        }
        if status_code == 206:
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            
        return StreamingResponse(
            stream_telegram_video(message, start, end),
            status_code=status_code,
            headers=headers,
            media_type="video/mp4"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Stream error: {e}")
        raise HTTPException(500, "Internal server error")

@app.get("/api/test-stream")
async def test_stream(request: Request):
    try:
        TEST_CHANNEL_ID = "-1003569793885"
        TEST_MESSAGE_ID = 3
        
        await resolve_channel(TEST_CHANNEL_ID)
        
        cache_key = f"{TEST_CHANNEL_ID}_{TEST_MESSAGE_ID}"
        if cache_key in message_cache:
            message = message_cache[cache_key]
        else:
            message = await tg.get_messages(int(TEST_CHANNEL_ID), TEST_MESSAGE_ID)
            if not message or message.empty:
                raise HTTPException(404, "Telegram message not found")
            message_cache[cache_key] = message
            
        file_size = message.video.file_size if message.video else message.document.file_size
        
        range_header = request.headers.get("range")
        if range_header:
            start, end = parse_range(range_header, file_size)
            status_code = 206
        else:
            start, end = 0, file_size - 1
            status_code = 200
            
        headers = {
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
        }
        if status_code == 206:
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            
        return StreamingResponse(
            stream_telegram_video(message, start, end),
            status_code=status_code,
            headers=headers,
            media_type="video/mp4"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[NexusEdu] Test stream error: {e}")
        raise HTTPException(500, "Internal server error")

@app.get("/api/debug")
async def debug():
    errors = []
    test_channel_resolved = False
    test_message_found = False
    test_message_has_media = False
    channel_title = None
    media_type = None
    file_size_mb = None
    logged_in_as = None
    
    try:
        me = await tg.get_me()
        logged_in_as = me.first_name if me else None
    except Exception as e:
        errors.append(f"get_me error: {e}")
        
    try:
        TEST_CHANNEL_ID = "-1003569793885"
        chat = await tg.get_chat(int(TEST_CHANNEL_ID))
        test_channel_resolved = True
        channel_title = chat.title
        
        message = await tg.get_messages(int(TEST_CHANNEL_ID), 3)
        if message and not message.empty:
            test_message_found = True
            if message.video:
                test_message_has_media = True
                media_type = "video"
                file_size_mb = message.video.file_size / (1024 * 1024)
            elif message.document:
                test_message_has_media = True
                media_type = "document"
                file_size_mb = message.document.file_size / (1024 * 1024)
    except Exception as e:
        errors.append(f"test message error: {e}")

    return {
        "telegram_connected": tg.is_connected if tg else False,
        "test_channel_resolved": test_channel_resolved,
        "test_message_found": test_message_found,
        "test_message_has_media": test_message_has_media,
        "channel_title": channel_title,
        "media_type": media_type,
        "file_size_mb": file_size_mb,
        "logged_in_as": logged_in_as,
        "video_map_size": len(video_map),
        "resolved_channels_count": len(resolved_channels),
        "errors": errors
    }
