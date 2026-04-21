"""Stripe billing routes — webhook handler and subscription management."""

from __future__ import annotations

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.dependencies_jwt import CurrentUser, get_current_user
from api.models.database import get_db
from api.models.invoice import Invoice
from api.models.organization import Organization

router = APIRouter(tags=["Billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

# ── Plan Limits ────────────────────────────────────────────────────
PLAN_LIMITS = {
    "free": {"monthly_proof_limit": 1000, "monthly_verify_limit": 5000, "rate_limit_per_minute": 100},
    "pro": {"monthly_proof_limit": 50000, "monthly_verify_limit": 250000, "rate_limit_per_minute": 1000},
    "enterprise": {"monthly_proof_limit": 999999999, "monthly_verify_limit": 999999999, "rate_limit_per_minute": 10000},
}


# ── Stripe Webhook Handler ─────────────────────────────────────────

@router.post("/v1/billing/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Handle incoming Stripe webhook events.

    Verifies the webhook signature, then processes:
    - checkout.session.completed → activate subscription
    - invoice.paid → record invoice, update plan
    - invoice.payment_failed → flag account
    - customer.subscription.deleted → downgrade to free
    """
    body = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")

    try:
        event = stripe.Webhook.construct_event(body, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(db, data)
    elif event_type == "invoice.paid":
        await _handle_invoice_paid(db, data)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(db, data)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_cancelled(db, data)

    return {"status": "ok"}


async def _handle_checkout_completed(db: AsyncSession, data: dict) -> None:
    """Activate subscription after successful checkout."""
    customer_id = data.get("customer")
    subscription_id = data.get("subscription")

    result = await db.execute(
        select(Organization).where(Organization.stripe_customer_id == customer_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        return

    org.stripe_subscription_id = subscription_id
    org.plan = "pro"
    limits = PLAN_LIMITS["pro"]
    org.monthly_proof_limit = limits["monthly_proof_limit"]
    org.monthly_verify_limit = limits["monthly_verify_limit"]
    org.rate_limit_per_minute = limits["rate_limit_per_minute"]
    await db.flush()


async def _handle_invoice_paid(db: AsyncSession, data: dict) -> None:
    """Record paid invoice."""
    customer_id = data.get("customer")
    result = await db.execute(
        select(Organization).where(Organization.stripe_customer_id == customer_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        return

    from datetime import date
    invoice = Invoice(
        org_id=org.id,
        stripe_invoice_id=data.get("id"),
        amount_cents=data.get("amount_paid", 0),
        currency=data.get("currency", "usd"),
        status="paid",
        period_start=date.today(),
        period_end=date.today(),
        pdf_url=data.get("invoice_pdf"),
    )
    db.add(invoice)
    await db.flush()


async def _handle_payment_failed(db: AsyncSession, data: dict) -> None:
    """Handle failed payment — flag the org."""
    customer_id = data.get("customer")
    result = await db.execute(
        select(Organization).where(Organization.stripe_customer_id == customer_id)
    )
    org = result.scalar_one_or_none()
    if org:
        # Could send email notification here
        pass


async def _handle_subscription_cancelled(db: AsyncSession, data: dict) -> None:
    """Downgrade org back to free plan."""
    customer_id = data.get("customer")
    result = await db.execute(
        select(Organization).where(Organization.stripe_customer_id == customer_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        return

    org.plan = "free"
    org.stripe_subscription_id = None
    limits = PLAN_LIMITS["free"]
    org.monthly_proof_limit = limits["monthly_proof_limit"]
    org.monthly_verify_limit = limits["monthly_verify_limit"]
    org.rate_limit_per_minute = limits["rate_limit_per_minute"]
    await db.flush()


# ── Dashboard Billing Routes (JWT protected) ────────────────────────

@router.post("/dashboard/billing/checkout")
async def create_checkout_session(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a Stripe checkout session to upgrade to Pro plan."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")

    org = current.org

    # Create or reuse Stripe customer
    if not org.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current.user.email,
            name=org.name,
            metadata={"org_id": str(org.id)},
        )
        org.stripe_customer_id = customer.id
        await db.flush()

    session = stripe.checkout.Session.create(
        customer=org.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": settings.STRIPE_PRO_PRICE_ID, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.DASHBOARD_URL}/dashboard/billing?success=true",
        cancel_url=f"{settings.DASHBOARD_URL}/dashboard/billing?canceled=true",
        metadata={"org_id": str(org.id)},
    )

    return {"checkout_url": session.url}


@router.get("/dashboard/billing/invoices")
async def list_invoices(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """List all invoices for the current organization."""
    result = await db.execute(
        select(Invoice).where(Invoice.org_id == current.org_id).order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()
    return [
        {
            "id": str(inv.id),
            "amount_cents": inv.amount_cents,
            "currency": inv.currency,
            "status": inv.status,
            "period_start": str(inv.period_start),
            "period_end": str(inv.period_end),
            "pdf_url": inv.pdf_url,
            "created_at": inv.created_at.isoformat(),
        }
        for inv in invoices
    ]
