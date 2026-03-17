# pharmacy/chatbot_ai_simple.py
# AI Chatbot using OpenRouter API — with automatic model fallback

import os
import logging
import requests

logger = logging.getLogger(__name__)

# ── OpenRouter config ────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.environ.get(
    'OPENROUTER_API_KEY',
    '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'
)
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

# Models tried in order until one succeeds.
# Models marked no_system=True don't support system prompts (e.g. Gemma via Google AI Studio).
MODELS = [
    {"id": "google/gemini-2.0-flash-lite-001",          "no_system": False},
    {"id": "google/gemini-flash-1.5-8b",                "no_system": False},
    {"id": "meta-llama/llama-3.1-8b-instruct:free",     "no_system": False},
    {"id": "meta-llama/llama-3.2-3b-instruct:free",     "no_system": False},
    {"id": "mistralai/mistral-7b-instruct",             "no_system": False},
    {"id": "google/gemma-3-12b-it:free",                "no_system": True},
    {"id": "google/gemma-3-27b-it:free",                "no_system": True},
    {"id": "nousresearch/hermes-3-llama-3.1-405b:free", "no_system": False},
    {"id": "microsoft/phi-3-mini-128k-instruct:free",   "no_system": False},
]
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a helpful pharmacy assistant. "
    "Keep responses concise, friendly, and accurate. "
    "Only answer questions related to pharmacy, medicines, health, or orders."
)

# HTTP status codes / error patterns that mean "try next model"
RETRIABLE_CODES = {404, 429, 502, 503}


class OpenRouterChatbot:

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type":  "application/json",
            "HTTP-Referer":  "https://pharmacy-app.local",
            "X-Title":       "Pharmacy Assistant",
        }
        logger.info("OpenRouter chatbot initialized.")

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------
    def generate_response(self, user_message: str, user_id: int,
                          user_name: str = "Customer", context: dict = None) -> str:
        quick = self._quick_response(user_message, user_name)
        if quick:
            return quick

        for model in MODELS:
            result = self._call_api(model["id"], user_message, model["no_system"])
            if result is not None:
                logger.info(f"Response from: {model['id']}")
                return result

        logger.error("All OpenRouter models failed — using built-in fallback.")
        return self._fallback(user_message, user_name)

    # ------------------------------------------------------------------
    # Single API call — returns text or None
    # ------------------------------------------------------------------
    def _call_api(self, model_id: str, user_message: str, no_system: bool = False):
        try:
            if no_system:
                # Embed the instruction into the user message instead
                messages = [{"role": "user", "content": f"{SYSTEM_PROMPT}\n\nUser: {user_message}"}]
            else:
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_message},
                ]

            response = requests.post(
                OPENROUTER_URL,
                headers=self.headers,
                json={"model": model_id, "messages": messages,
                      "max_tokens": 200, "temperature": 0.7},
                timeout=30,
            )

            if response.status_code == 200:
                text = (response.json()
                        .get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                        .strip())
                return text or None

            # Decide whether to retry on next model
            if response.status_code in RETRIABLE_CODES:
                logger.warning(f"[{model_id}] {response.status_code} — skipping.")
                return None

            # 400 with "Provider returned error" is also retriable
            if response.status_code == 400:
                body = response.text
                if "Provider returned error" in body or "not a valid model" in body:
                    logger.warning(f"[{model_id}] 400 provider error — skipping.")
                    return None
                logger.error(f"[{model_id}] 400: {body[:300]}")
                return None

            logger.error(f"[{model_id}] {response.status_code}: {response.text[:300]}")
            return None

        except requests.exceptions.Timeout:
            logger.warning(f"[{model_id}] Timeout.")
            return None
        except Exception as e:
            logger.error(f"[{model_id}] Exception: {e}")
            return None

    # ------------------------------------------------------------------
    def _quick_response(self, message: str, name: str):
        msg = message.lower().strip().rstrip("!.")
        if msg in {"hi", "hello", "hey"}:
            return f"Hello {name}! How can I help you today?"
        if msg in {"thanks", "thank you", "thx"}:
            return f"You're welcome, {name}!"
        if msg in {"bye", "goodbye"}:
            return f"Goodbye {name}! Take care!"
        return None

    def _fallback(self, message: str, name: str) -> str:
        msg = message.lower()
        if any(w in msg for w in ["order", "track", "delivery"]):
            return f"Check your orders in the 'My Orders' section, {name}!"
        if any(w in msg for w in ["headache", "pain", "fever"]):
            return f"Check our Products page for medicines. For serious symptoms, please consult a doctor, {name}!"
        if any(w in msg for w in ["medicine", "drug", "tablet", "pill"]):
            return f"Browse our Products page to find medicines, {name}!"
        if any(w in msg for w in ["doctor", "consult"]):
            return f"Go to 'Ask Doctor' to consult with our doctors, {name}!"
        return f"I can help with medicines, orders, and health questions, {name}!"

    def clear_history(self, user_id: int):
        pass


# ---------------------------------------------------------------------------
_chatbot_instance = None

def get_chatbot_instance():
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = OpenRouterChatbot()
    return _chatbot_instance