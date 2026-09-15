"""Wraps the Claude API call that powers POST /estimate.

Uses client.messages.parse() with a Pydantic output_format so Claude's
response is constrained to (and validated against) EstimateResult directly -
the same "return ONLY valid JSON matching a defined schema" extraction
pattern used elsewhere, just enforced by the API instead of by a prompt
instruction alone.
"""

import anthropic

from schemas import CardDetails, EstimateResult

MODEL = "claude-sonnet-5"

# Deliberately capped: this is a short structured response (a price range, a
# paragraph of reasoning, 2-3 similar cards), not an open-ended generation -
# and this is the one service in Packr that spends real money per call.
MAX_TOKENS = 2048

SYSTEM_PROMPT = (
    "You are a trading card market pricing analyst for Packr, a trading-card "
    "marketplace. Given a card's name, set, rarity, and condition, estimate a "
    "realistic secondary-market price range in US dollars and suggest 2-3 "
    "similar cards a buyer considering this card might also like. Ground "
    "your estimate in general knowledge of collectible card market pricing. "
    "If a card is obscure or you are unsure, give a wider price range rather "
    "than a falsely precise one, and say so in your reasoning."
)

_client = anthropic.Anthropic()


def estimate_card_price(card: CardDetails) -> EstimateResult:
    user_content = (
        f"Card: {card.name}\n"
        f"Set: {card.set}\n"
        f"Rarity: {card.rarity}\n"
        f"Condition: {card.condition}"
    )

    response = _client.messages.parse(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
        output_format=EstimateResult,
    )

    return response.parsed_output
