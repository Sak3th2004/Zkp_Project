"""Webhook delivery task — sends webhook payloads with retry logic."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

from api.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="deliver_webhook", max_retries=5, default_retry_delay=60)
def deliver_webhook(
    self,
    webhook_id: str,
    delivery_id: str,
    url: str,
    secret: str,
    event_type: str,
    payload: dict,
):
    """Deliver a webhook payload to the configured endpoint.

    Uses HMAC-SHA256 signature for payload verification.
    Retries up to 5 times with exponential backoff.
    """
    try:
        import httpx

        body = json.dumps(payload, separators=(",", ":"))
        timestamp = str(int(time.time()))
        signature_input = f"{timestamp}.{body}"
        signature = hmac.new(
            secret.encode(), signature_input.encode(), hashlib.sha256
        ).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-ZKP-Signature": f"t={timestamp},v1={signature}",
            "X-ZKP-Event": event_type,
            "X-ZKP-Delivery-Id": delivery_id,
            "User-Agent": "ZKProofAPI-Webhooks/1.0",
        }

        resp = httpx.post(url, content=body, headers=headers, timeout=10)

        return {
            "delivery_id": delivery_id,
            "status": "delivered" if resp.is_success else "failed",
            "response_status": resp.status_code,
            "attempts": self.request.retries + 1,
        }

    except Exception as exc:
        # Retry with exponential backoff
        retry_delay = 60 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=retry_delay)
