"""Request/response schemas for pricing-service.

CardDetails validates the inbound POST /estimate body. EstimateResult doubles
as both the Claude structured-output schema (passed as output_format to
client.messages.parse) and the shape returned to the caller, so the two can
never drift apart.
"""

from typing import List, Literal

from pydantic import BaseModel, Field

RARITIES = ("COMMON", "UNCOMMON", "RARE", "ULTRA_RARE", "SECRET_RARE")
CONDITIONS = ("MINT", "NEAR_MINT", "LIGHTLY_PLAYED", "DAMAGED")


class CardDetails(BaseModel):
    name: str = Field(min_length=1)
    set: str = Field(min_length=1)
    rarity: Literal["COMMON", "UNCOMMON", "RARE", "ULTRA_RARE", "SECRET_RARE"]
    condition: Literal["MINT", "NEAR_MINT", "LIGHTLY_PLAYED", "DAMAGED"]


class PriceEstimate(BaseModel):
    low: float
    high: float
    currency: str


class SimilarCard(BaseModel):
    name: str
    set: str
    reason: str


class EstimateResult(BaseModel):
    priceEstimate: PriceEstimate
    reasoning: str
    similarCards: List[SimilarCard] = Field(min_length=2, max_length=3)
