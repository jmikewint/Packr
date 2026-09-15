import os

from dotenv import load_dotenv

load_dotenv()

import anthropic
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pydantic import ValidationError

from claude_client import estimate_card_price
from schemas import CardDetails

REQUIRED_ENV_VARS = ["ANTHROPIC_API_KEY"]
missing = [name for name in REQUIRED_ENV_VARS if not os.environ.get(name)]
if missing:
    raise RuntimeError(f"Missing required environment variable(s): {', '.join(missing)}")

app = Flask(__name__)

# The frontend calls this service directly from the browser (not server-side),
# so it needs CORS enabled - default to the frontend's local dev origin.
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
CORS(app, origins=[FRONTEND_ORIGIN])

# This is the one Packr service that spends real money per call (each
# /estimate hit is a Claude API call), so the ceiling on it is deliberately
# tight - well below the app-wide default.
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["60 per hour"],
    storage_uri="memory://",
)


@app.get("/")
def root():
    return jsonify(service="pricing-service", status="running")


@app.post("/estimate")
@limiter.limit("10 per minute")
def estimate():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify(error="Request body must be valid JSON"), 400

    try:
        card = CardDetails.model_validate(payload)
    except ValidationError as exc:
        return jsonify(error="Validation failed", details=exc.errors()), 400

    try:
        result = estimate_card_price(card)
    except anthropic.RateLimitError:
        return jsonify(error="Pricing provider is rate limited - try again shortly"), 503
    except anthropic.APIConnectionError:
        return jsonify(error="Could not reach pricing provider"), 503
    except anthropic.APIStatusError as exc:
        app.logger.exception("Claude API returned an error")
        status = 503 if exc.status_code >= 500 else 502
        return jsonify(error="Pricing provider returned an error"), status
    except Exception:
        app.logger.exception("Unexpected error generating price estimate")
        return jsonify(error="Failed to generate price estimate"), 500

    return jsonify(result.model_dump()), 200


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(error="Rate limit exceeded", detail=str(e.description)), 429


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4003))
    app.run(host="0.0.0.0", port=port)
