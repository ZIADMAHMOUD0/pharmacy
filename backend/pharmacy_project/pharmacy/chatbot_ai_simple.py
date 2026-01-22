# pharmacy/chatbot_ai_simple.py
# Simple AI Chatbot using Ollama

import os
import logging
import requests

logger = logging.getLogger(__name__)


class OllamaChatbot:
    SYSTEM_PROMPT = "You are a helpful pharmacy assistant. Keep responses short and helpful."

    def __init__(self):
        self.ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
        self.model = self._find_model()
        self.chat_url = f"{self.ollama_url}/api/chat"
        logger.info(f"Chatbot initialized with model: {self.model}")
    
    def _find_model(self):
        preferred = ['tinyllama', 'phi3']
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                available = [m.get('name', '') for m in response.json().get('models', [])]
                for model in preferred:
                    for avail in available:
                        if model in avail.lower():
                            return avail
                for avail in available:
                    if 'llava' not in avail.lower() and 'moondream' not in avail.lower():
                        return avail
                if available:
                    return available[0]
        except Exception as e:
            logger.warning(f"Could not get models: {e}")
        return 'tinyllama'
    
    def generate_response(self, user_message: str, user_id: int, user_name: str = "Customer", context: dict = None) -> str:
        quick = self._quick_response(user_message, user_name)
        if quick:
            return quick
        try:
            response = requests.post(
                self.chat_url,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    "stream": False,
                    "options": {"num_predict": 100, "temperature": 0.7}
                },
                timeout=30
            )
            if response.status_code == 200:
                ai_response = response.json().get('message', {}).get('content', '').strip()
                if ai_response:
                    return ai_response
        except requests.exceptions.Timeout:
            logger.warning("Ollama timeout")
        except Exception as e:
            logger.error(f"Ollama error: {e}")
        return self._fallback(user_message, user_name)
    
    def _quick_response(self, message: str, name: str):
        msg = message.lower().strip()
        if msg in ['hi', 'hello', 'hey', 'hi!', 'hello!']:
            return f"Hello {name}! How can I help you today?"
        if msg in ['thanks', 'thank you', 'thx']:
            return f"You're welcome, {name}!"
        if msg in ['bye', 'goodbye']:
            return f"Goodbye {name}! Take care!"
        return None
    
    def _fallback(self, message: str, name: str) -> str:
        msg = message.lower()
        if any(w in msg for w in ['order', 'track', 'delivery']):
            return f"Check your orders in 'My Orders' section, {name}!"
        if any(w in msg for w in ['headache', 'pain', 'fever']):
            return f"Check our Products page for medicines. For serious symptoms, consult a doctor, {name}!"
        if any(w in msg for w in ['medicine', 'drug', 'tablet']):
            return f"Browse our Products page to find medicines, {name}!"
        if any(w in msg for w in ['doctor', 'consult']):
            return f"Go to 'Ask Doctor' to consult with our doctors, {name}!"
        return f"I can help with medicines, orders, and health questions, {name}!"
    
    def clear_history(self, user_id: int):
        pass


_chatbot_instance = None

def get_chatbot_instance():
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = OllamaChatbot()
    return _chatbot_instance
