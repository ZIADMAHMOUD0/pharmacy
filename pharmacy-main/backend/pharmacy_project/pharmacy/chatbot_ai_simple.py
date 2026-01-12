# pharmacy/chatbot_ai_simple.py
# AI Chatbot - Google Gemini (FREE)

import os
import json
import logging
import requests
import time
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)


class GeminiChatbot:
    """
    Google Gemini AI Chatbot (FREE)
    
    Setup:
    1. Go to https://aistudio.google.com/app/apikey
    2. Create API key (free)
    3. Set in settings.py: os.environ['GEMINI_API_KEY'] = 'your-key'
    
    Free tier limits:
    - 15 requests per minute (RPM)
    - 1 million tokens per minute
    - 1,500 requests per day
    """
    
    PHARMACY_PROMPT = """You are PharmaCare AI assistant. Help with medicines, orders, health tips.
Be brief (1-2 sentences). Use emojis. Customer: {user_name}"""

    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.model = "gemini-2.0-flash"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        self.conversation_history = {}
        self.last_request_time = 0
        self.min_request_interval = 4  # Minimum 4 seconds between requests (15 RPM = 1 per 4 sec)
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set!")
        else:
            logger.info(f"GeminiChatbot initialized with model: {self.model}")
    
    def _wait_for_rate_limit(self):
        """Ensure we don't exceed rate limits"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            wait_time = self.min_request_interval - elapsed
            logger.info(f"Rate limiting: waiting {wait_time:.1f}s")
            time.sleep(wait_time)
        self.last_request_time = time.time()
    
    def generate_response(self, user_message: str, user_id: int, user_name: str = "Customer", context: dict = None) -> str:
        if not self.api_key:
            logger.error("No API key configured")
            return self._smart_fallback(user_message, user_name)
        
        try:
            # Wait for rate limit
            self._wait_for_rate_limit()
            
            # Build simple prompt
            system_prompt = self.PHARMACY_PROMPT.format(user_name=user_name)
            
            # Add context if available
            context_str = ""
            if context:
                if context.get('recent_orders'):
                    orders_str = ", ".join([f"Order #{o['id']} ({o['status']})" for o in context['recent_orders'][:2]])
                    context_str += f" Recent orders: {orders_str}."
                if context.get('cart_items'):
                    context_str += f" Cart: {context['cart_items']} items."
            
            # Simple prompt format
            full_prompt = f"{system_prompt}{context_str}\n\nCustomer says: {user_message}\n\nRespond briefly:"
            
            # Build request body
            request_body = {
                "contents": [
                    {
                        "parts": [
                            {"text": full_prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1024,
                    "topP": 0.9
                }
            }
            
            # Make API request with retry
            max_retries = 2
            for attempt in range(max_retries + 1):
                response = requests.post(
                    f"{self.api_url}?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=request_body,
                    timeout=30
                )
                
                logger.info(f"Gemini API response status: {response.status_code} (attempt {attempt + 1})")
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for candidates
                    if 'candidates' not in result or len(result['candidates']) == 0:
                        logger.error("No candidates in response")
                        return self._smart_fallback(user_message, user_name)
                    
                    candidate = result['candidates'][0]
                    finish_reason = candidate.get('finishReason', '')
                    
                    if finish_reason == 'SAFETY':
                        logger.warning("Response blocked by safety filter")
                        return self._smart_fallback(user_message, user_name)
                    
                    # Extract text from content
                    content = candidate.get('content', {})
                    parts = content.get('parts', [])
                    
                    if not parts:
                        logger.warning(f"No parts in response. Finish reason: {finish_reason}")
                        return self._smart_fallback(user_message, user_name)
                    
                    # Extract text
                    ai_response = ""
                    for part in parts:
                        if 'text' in part:
                            ai_response += part['text']
                    
                    ai_response = ai_response.strip()
                    
                    if not ai_response:
                        logger.error("Empty text in response")
                        return self._smart_fallback(user_message, user_name)
                    
                    logger.info(f"AI Response: {ai_response[:100]}...")
                    
                    # Save to history
                    if user_id not in self.conversation_history:
                        self.conversation_history[user_id] = []
                    self.conversation_history[user_id].append({
                        'user': user_message,
                        'assistant': ai_response
                    })
                    
                    # Keep only last 5 exchanges
                    if len(self.conversation_history[user_id]) > 5:
                        self.conversation_history[user_id] = self.conversation_history[user_id][-5:]
                    
                    return ai_response
                
                elif response.status_code == 429:
                    # Rate limited - wait and retry
                    if attempt < max_retries:
                        wait_time = (attempt + 1) * 5  # 5s, 10s
                        logger.warning(f"Rate limited, waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                        continue
                    else:
                        logger.warning("Rate limited after all retries")
                        return self._smart_fallback(user_message, user_name)
                
                else:
                    logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return self._smart_fallback(user_message, user_name)
            
            return self._smart_fallback(user_message, user_name)
                
        except requests.exceptions.Timeout:
            logger.error("Gemini request timed out")
            return self._smart_fallback(user_message, user_name)
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return self._smart_fallback(user_message, user_name)
    
    def _smart_fallback(self, message: str, user_name: str) -> str:
        """Smart rule-based fallback responses when API fails"""
        msg = message.lower()
        
        # Greetings
        if any(w in msg for w in ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'السلام', 'مرحبا']):
            return f"Hello {user_name}! 👋 Welcome to PharmaCare! How can I help you today?"
        
        # Order related
        if any(w in msg for w in ['order', 'track', 'delivery', 'shipping', 'where is my']):
            return f"📦 Check your orders in 'My Orders' section, {user_name}! You'll see all order statuses there."
        
        # Headache / Pain
        if any(w in msg for w in ['headache', 'head ache', 'head pain']):
            return f"💊 For headaches, try Paracetamol or Ibuprofen. If it persists, consult a doctor, {user_name}!"
        
        # Fever
        if 'fever' in msg:
            return f"🌡️ For fever, Paracetamol helps. Stay hydrated! See a doctor if it's high, {user_name}."
        
        # Cold / Flu
        if any(w in msg for w in ['cold', 'flu', 'cough', 'runny nose', 'sore throat']):
            return f"🤧 Check our Cold & Flu products! Rest and drink fluids, {user_name}."
        
        # Pain
        if any(w in msg for w in ['pain', 'ache', 'hurt']):
            return f"💊 For pain relief, try Ibuprofen or Paracetamol. Check our Pain Relief section, {user_name}!"
        
        # Medicine queries
        if any(w in msg for w in ['medicine', 'drug', 'medication', 'tablet', 'pill']):
            return f"💊 Browse our Products page to find medicines, {user_name}! What do you need?"
        
        # Price queries
        if any(w in msg for w in ['price', 'cost', 'how much']):
            return f"💰 See all prices on our Products page, {user_name}. Which product interests you?"
        
        # Prescription
        if any(w in msg for w in ['prescription', 'doctor', 'rx']):
            return f"📋 Need a prescription? Use 'Ask Doctor' to consult with a doctor, {user_name}!"
        
        # Cart
        if any(w in msg for w in ['cart', 'checkout', 'buy']):
            return f"🛒 View your cart using the cart icon, {user_name}! Ready to checkout?"
        
        # Thanks
        if any(w in msg for w in ['thank', 'thanks', 'شكر']):
            return f"You're welcome, {user_name}! 😊 Anything else I can help with?"
        
        # Goodbye
        if any(w in msg for w in ['bye', 'goodbye']):
            return f"Goodbye, {user_name}! 👋 Stay healthy!"
        
        # Help
        if any(w in msg for w in ['help', 'support', 'what can you do']):
            return f"I help with: 💊 Medicines, 📦 Orders, 🏥 Health tips. What do you need, {user_name}?"
        
        # Medical history
        if any(w in msg for w in ['allergy', 'allergies', 'condition', 'medical history']):
            return f"📋 You can manage your medical history in the 'Medical History' section, {user_name}! Add allergies, conditions, and medications there."
        
        # Default
        return f"Hi {user_name}! 💊 I can help with medicines, orders, and health advice. What would you like to know?"
    
    def clear_history(self, user_id: int):
        """Clear conversation history for user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

_chatbot_instance = None

def get_chatbot_instance():
    """Get the chatbot instance (singleton)"""
    global _chatbot_instance
    
    if _chatbot_instance is None:
        logger.info("Creating new GeminiChatbot instance")
        _chatbot_instance = GeminiChatbot()
    
    return _chatbot_instance