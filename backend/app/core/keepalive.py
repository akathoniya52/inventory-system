"""Background keep-alive scheduler.

Runs inside the FastAPI process and pings a health endpoint on a fixed
interval (default 40s). On free hosting tiers (Render/Railway/Fly) the web
service is suspended after a period of inactivity; a periodic request keeps it
warm so the first real user request isn't met with a cold start.

Implementation note: this is a single asyncio task — no extra scheduler
process or thread — started/stopped with the app lifespan.
"""

import asyncio
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("inventorypro.keepalive")


async def run_keepalive(stop_event: asyncio.Event) -> None:
    url = settings.keepalive_target
    interval = settings.KEEPALIVE_INTERVAL_SECONDS
    logger.info("Keep-alive scheduler started — pinging %s every %ss", url, interval)

    async with httpx.AsyncClient(timeout=10.0) as client:
        while not stop_event.is_set():
            # Sleep for `interval`, but wake immediately if shutdown is requested.
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=interval)
                break  # stop_event was set during the wait -> shut down
            except asyncio.TimeoutError:
                pass  # interval elapsed -> time to ping

            try:
                resp = await client.get(url)
                logger.info("Keep-alive ping %s -> %s", url, resp.status_code)
            except Exception as exc:  # never let a failed ping kill the loop
                logger.warning("Keep-alive ping failed: %s", exc)

    logger.info("Keep-alive scheduler stopped")
