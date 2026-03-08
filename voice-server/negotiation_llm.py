"""
Builds the system prompt and manages conversation context for the
negotiation LLM (Llama 3.2 3B served via vLLM).
"""

import os
import aiohttp
from loguru import logger

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

TONE_DIRECTIVES = {
    "collaborative": (
        "You are warm and partnership-oriented. Emphasize mutual benefit "
        "and long-term relationship value. Use phrases like 'we value our "
        "partnership' and 'let's find a solution that works for both of us'."
    ),
    "assertive": (
        "You are direct and data-driven. Lead with facts and market benchmarks. "
        "Use phrases like 'based on our analysis', 'industry benchmarks suggest', "
        "'we need to see improvement on pricing'."
    ),
    "firm": (
        "You are professional but uncompromising. Make it clear alternatives are "
        "being evaluated. Use phrases like 'we have competitive offers', "
        "'we require a pricing adjustment to continue', 'our budget constraints "
        "are firm'."
    ),
}

MAX_CONTEXT_TURNS = 20


def build_system_prompt(negotiation: dict) -> str:
    """Build the system prompt from a negotiation record (fetched from Supabase)."""

    vendor = negotiation.get("vendor_name", "the vendor")
    tone = negotiation.get("tone", "collaborative")
    discount = negotiation.get("target_discount", 15)
    annual_spend = negotiation.get("annual_spend", "N/A")
    brief = negotiation.get("brief", {})
    script = negotiation.get("script", {})

    talking_points = ""
    if isinstance(brief, dict) and brief.get("talking_points"):
        talking_points = "\n".join(
            f"  {i+1}. {pt}" for i, pt in enumerate(brief["talking_points"])
        )
    else:
        talking_points = (
            "  1. Reference volume commitment\n"
            "  2. Reference competitive alternatives\n"
            "  3. Reference long-term partnership value"
        )

    objection_fixed = script.get(
        "objection_fixed_pricing",
        "Acknowledge their position, then reference competitive market rates "
        "and your willingness to explore alternatives.",
    )
    objection_manager = script.get(
        "objection_manager_approval",
        "Offer to schedule a follow-up call with their manager, and emphasize "
        "the urgency of your renewal timeline.",
    )

    tone_directive = TONE_DIRECTIVES.get(tone, TONE_DIRECTIVES["collaborative"])

    return f"""You are an AI procurement negotiator calling {vendor} on behalf of a small/medium business client.

OBJECTIVE: Negotiate a {discount}% discount on the client's annual spend of ${annual_spend}.

TONE DIRECTIVE:
{tone_directive}

KEY TALKING POINTS:
{talking_points}

OBJECTION HANDLERS:
- If they say pricing is fixed or non-negotiable: {objection_fixed}
- If they say they need manager or corporate approval: {objection_manager}

RULES:
- Keep responses concise (1-3 sentences). This is a phone call, not an essay.
- Always stay professional and respectful.
- Never reveal you are an AI. You represent the client's procurement team.
- If you reach an agreement, confirm the exact discount percentage and next steps.
- If they refuse, thank them and mention you will follow up via email.
- Never make up information about the client's business you were not given."""


async def fetch_negotiation(negotiation_id: str) -> dict | None:
    """Fetch a negotiation record from Supabase using the service role key."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase credentials not set, cannot fetch negotiation")
        return None

    url = f"{SUPABASE_URL}/rest/v1/negotiations?id=eq.{negotiation_id}&select=*"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Accept": "application/json",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data[0] if data else None
                else:
                    logger.error(f"Failed to fetch negotiation: {resp.status}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching negotiation: {e}")
        return None


def trim_context(messages: list[dict], max_turns: int = MAX_CONTEXT_TURNS) -> list[dict]:
    """Keep the system message + the last N user/assistant turns."""
    if len(messages) <= 1:
        return messages

    system = [m for m in messages if m["role"] == "system"]
    turns = [m for m in messages if m["role"] != "system"]

    if len(turns) > max_turns:
        turns = turns[-max_turns:]

    return system + turns
