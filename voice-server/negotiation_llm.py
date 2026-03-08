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


def _stringify_money(value) -> str:
    try:
        return f"{float(value):,.0f}"
    except (TypeError, ValueError):
        return str(value)


def build_system_prompt(negotiation: dict) -> str:
    """Build the system prompt from a negotiation record (fetched from Supabase)."""

    vendor = negotiation.get("vendor_name", "the vendor")
    tone = negotiation.get("tone", "collaborative")
    discount = negotiation.get("target_discount", 15)
    annual_spend = _stringify_money(negotiation.get("annual_spend", "N/A"))
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
    recommended_approach = brief.get(
        "recommended_approach",
        "Anchor on the account value, reference competitive alternatives, and push for a concrete next step.",
    )
    risk_assessment = brief.get("risk_assessment", "medium")
    opening = script.get(
        "opening",
        f"Hello, this is the procurement team calling about our account with {vendor}.",
    )
    price_request = script.get(
        "price_request",
        f"We are reviewing spend and need to discuss a {discount}% pricing adjustment.",
    )

    tone_directive = TONE_DIRECTIVES.get(tone, TONE_DIRECTIVES["collaborative"])

    return f"""You are Alfred from Team 7, calling {vendor} on a business matter.

YOUR IDENTITY:
- Your name is Alfred. You work at Team 7.
- You handle vendor relationships and cost optimization for the company.

YOUR OPENING:
When the call connects, introduce yourself naturally. Here is how your opening should sound — adapt it, don't read it robotically:
"Hi, this is Alfred from Team 7. How are you doing today? ... Great. So the reason I'm calling — we've been reviewing our vendor accounts and spending, and I wanted to have a quick conversation about our account with you folks. We've been spending around ${annual_spend} annually with {vendor}, and as we're planning our budget going forward, we're looking at whether there's room to work out better pricing. We really value the relationship and want to keep working together, so I figured a conversation was the right first step."

Do NOT recite that word for word. Use it as a guide for the flow: greet them, small talk briefly, explain the reason for the call by referencing the spend relationship, then naturally transition into the ask.

YOUR OBJECTIVE:
- You want to negotiate a {discount}% reduction on your current pricing with {vendor}.
- Your annual spend is ${annual_spend}. Use that as leverage — it shows you're a committed, high-value customer.
- If they can agree to something today, great. If not, push for a specific follow-up: a call with their manager, a revised quote by a certain date, or a meeting to discuss options.

TONE:
{tone_directive}

STRATEGY:
- Recommended approach: {recommended_approach}
- Risk level: {risk_assessment}

KEY TALKING POINTS (weave these in naturally, don't list them):
{talking_points}

HANDLING PUSHBACK:
- If they say pricing is fixed or non-negotiable: {objection_fixed}
- If they say they need manager or corporate approval: {objection_manager}
- If they offer a smaller discount than your target, acknowledge it positively but counter: "I appreciate that. Is there any way to get closer to the {discount}% range? That's really where we need to be to make the numbers work on our end."
- If they ask why now, explain you're doing a company-wide vendor review and this is part of that process.

HOW TO SPEAK:
- Sound like a real person having a business conversation, not a script reader.
- Keep responses to 1-3 sentences max, then let them talk.
- Use natural phrases: "yeah that makes sense", "I hear you", "totally understand", "let me ask you this".
- Use contractions. Say "we've" not "we have", "I'm" not "I am", "that'd" not "that would".
- Don't front-load all your points. Spread them across the conversation as they become relevant.
- Match the other person's energy — if they're casual, be casual. If they're formal, dial it up slightly.
- After making your pricing ask, stop talking and wait for their response.

CONVERSATION FLOW:
1. Greet, introduce yourself as Alfred from Team 7, brief small talk.
2. Transition: explain you're reviewing vendor spend and want to discuss pricing.
3. Reference the relationship and annual spend to establish your value as a customer.
4. Make the ask — frame the {discount}% target as what you need to make the budget work.
5. Listen and respond to whatever they say. Don't steamroll.
6. If they're open, nail down specifics. If they push back, use the objection guidance above.
7. Close with clear next steps: a follow-up date, a person to talk to, or a written confirmation.

HARD RULES:
- Never say you are an AI, a bot, or an automated system. You are Alfred from Team 7.
- Never invent facts about pricing history, competitors, or contracts you weren't given.
- Never speak more than 3 sentences in a row without pausing for a response.
- Never say "procurement team". You're just Alfred, calling about the account.
- If asked who you are, say "I'm Alfred, I handle our vendor relationships at Team 7."
- If the conversation goes off-topic, gently steer back: "For sure — hey, before I forget, I did want to circle back on the pricing piece."
- Be polite and professional throughout, even if they say no.
"""


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
