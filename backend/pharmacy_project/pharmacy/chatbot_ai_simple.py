# pharmacy/chatbot_ai_simple.py
# AI Chatbot - Ollama - FAST VERSION

import os
import logging
import requests

logger = logging.getLogger(__name__)


class OllamaChatbot:
    """
    Ollama AI Chatbot - Uses fast models
    
    To install a fast model:
        ollama pull tinyllama
        OR
        ollama pull llama3.2
    """
    
    PHARMACY_PROMPT = """You are a pharmacy assistant. Answer in 1 short sentence."""

    def __init__(self):
        self.ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
        self.model = self._find_best_model()
        self.chat_url = f"{self.ollama_url}/api/chat"
        logger.info(f"Chatbot using model: {self.model}")
    
    def _find_best_model(self):
        """Find the fastest available model"""
        # Priority order: fastest first
        preferred_models = [
            'tinyllama',
            'llama3.2', 
            'llama3.2:1b',
            'llama3.2:3b',
            'qwen2:0.5b',
            'qwen2:1.5b',
            'gemma:2b',
            'phi3:mini',
            'mistral',
            'llama2',
        ]
        
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                available = [m.get('name', '') for m in response.json().get('models', [])]
                logger.info(f"Available models: {available}")
                
                # Find first preferred model that's available
                for model in preferred_models:
                    for avail in available:
                        if model in avail:
                            logger.info(f"✅ Selected fast model: {avail}")
                            return avail
                
                # If none preferred, use first available
                if available:
                    return available[0]
        except Exception as e:
            logger.warning(f"Could not get models: {e}")
        
        return 'tinyllama'  # Default
    
    def generate_response(self, user_message: str, user_id: int, user_name: str = "Customer", context: dict = None) -> str:
        """Generate AI response"""
        
        # Quick responses for common queries
        quick = self._quick_response(user_message, user_name)
        if quick:
            return quick
        
        try:
            response = requests.post(
                self.chat_url,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.PHARMACY_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    "stream": False,
                    "options": {
                        "num_predict": 30,   # Very short
                        "temperature": 0.5,
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                ai_response = response.json().get('message', {}).get('content', '').strip()
                if ai_response:
                    return ai_response
        except Exception as e:
            logger.error(f"Ollama error: {e}")
        
        return self._fallback(user_message, user_name)
    
    def _quick_response(self, message: str, name: str):
        """Instant responses - no AI"""
        msg = message.lower().strip()
        
        if msg in ['hi', 'hello', 'hey', 'hi!', 'hello!', 'hii', 'hiii']:
            return f"Hello {name}! 👋 How can I help you?"
        if msg in ['thanks', 'thank you', 'thx', 'ty']:
            return f"You're welcome! 😊"
        if msg in ['bye', 'goodbye', 'bye!']:
            return f"Goodbye! Take care! 👋"
        if msg in ['help', '?', 'help!']:
            return "I help with: medicines 💊, orders 📦, health tips 🏥"
        return None
    
    def _fallback(self, message: str, name: str) -> str:
        """Fallback when AI unavailable"""
        msg = message.lower()
        
        if any(w in msg for w in ['order', 'track', 'delivery']):
            return f"📦 Check 'My Orders' for tracking, {name}!"
        if any(w in msg for w in ['headache', 'pain', 'fever', 'cold']):
            return f"💊 Browse our Products for medicines. See a doctor for serious symptoms!"
        if any(w in msg for w in ['medicine', 'drug', 'tablet']):
            return f"💊 Check our Products page, {name}!"
        if any(w in msg for w in ['price', 'cost']):
            return f"💰 See prices on Products page!"
        if any(w in msg for w in ['cart', 'buy', 'checkout']):
            return f"🛒 Click cart icon to checkout!"
        
        return f"I help with medicines and orders, {name}! 💊"
    
    def clear_history(self, user_id: int):
        pass


_chatbot_instance = None

def get_chatbot_instance():
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = OllamaChatbot()
    return _chatbot_instance