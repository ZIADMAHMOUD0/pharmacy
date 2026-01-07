# pharmacy/chatbot_ai_simple.py
# AI Chatbot - Google Gemini (FREE)

import os
import json
import logging
import requests
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)


class GeminiChatbot:
    """
    Google Gemini AI Chatbot (FREE)
    
    Setup:
    1. Go to https://aistudio.google.com/app/apikey
    2. Create API key (free)
    3. Set in settings.py: os.environ['GEMINI_API_KEY'] = 'your-key'
    """
    
    PHARMACY_PROMPT = """You are PharmaCare AI, a helpful pharmacy assistant chatbot.

Your role is to help customers with:
- Finding medicines and health products
- Order tracking and status
- Medicine information (dosage, usage, side effects)
- General health tips and advice
- Prescription guidance

Important rules:
- Be friendly, professional, and empathetic
- For medical emergencies, always advise calling 911
- Don't diagnose conditions - recommend consulting a doctor
- Keep responses concise but helpful (2-3 sentences max)
- Use emojis occasionally to be friendly 💊

Customer name: {user_name}
"""

    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        # Using gemini-flash-latest - this works!
        self.model = "gemini-flash-latest"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        self.conversation_history = {}
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set!")
        else:
            logger.info(f"GeminiChatbot initialized with model: {self.model}")
    
    def generate_response(self, user_message: str, user_id: int, user_name: str = "Customer", context: dict = None) -> str:
        if not self.api_key:
            logger.error("No API key configured")
            return self._smart_fallback(user_message, user_name)
        
        try:
            # Build prompt with context
            system_prompt = self.PHARMACY_PROMPT.format(user_name=user_name)
            
            # Add context if available
            if context:
                if context.get('recent_orders'):
                    orders_str = ", ".join([f"Order #{o['id']} ({o['status']})" for o in context['recent_orders']])
                    system_prompt += f"\n\nCustomer's recent orders: {orders_str}"
                if context.get('cart_items'):
                    system_prompt += f"\nItems in cart: {context['cart_items']}"
            
            # Get conversation history
            history = self.conversation_history.get(user_id, [])
            
            # Build the full prompt
            full_prompt = system_prompt + "\n\n"
            
            # Add history (last 2 exchanges)
            for h in history[-4:]:
                full_prompt += f"Customer: {h['user']}\nAssistant: {h['assistant']}\n"
            
            full_prompt += f"Customer: {user_message}\nAssistant:"
            
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
                    "maxOutputTokens": 300
                }
            }
            
            # Make API request
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json=request_body,
                timeout=30
            )
            
            logger.info(f"Gemini API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract the response text
                try:
                    ai_response = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    logger.info(f"AI Response: {ai_response[:100]}...")
                except (KeyError, IndexError) as e:
                    logger.error(f"Failed to parse response: {result}")
                    return self._smart_fallback(user_message, user_name)
                
                # Save to history
                if user_id not in self.conversation_history:
                    self.conversation_history[user_id] = []
                self.conversation_history[user_id].append({
                    'user': user_message,
                    'assistant': ai_response
                })
                
                # Keep only last 10 exchanges
                if len(self.conversation_history[user_id]) > 10:
                    self.conversation_history[user_id] = self.conversation_history[user_id][-10:]
                
                return ai_response
            
            elif response.status_code == 429:
                logger.warning("Rate limited by Gemini API")
                return f"I'm a bit busy right now, {user_name}. Please try again in a moment! 😊"
            
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return self._smart_fallback(user_message, user_name)
                
        except requests.exceptions.Timeout:
            logger.error("Gemini request timed out")
            return f"I'm taking a bit longer to respond, {user_name}. Please try again! 🤔"
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return self._smart_fallback(user_message, user_name)
    
    def _smart_fallback(self, message: str, user_name: str) -> str:
        """Smart rule-based fallback responses when API fails"""
        msg = message.lower()
        
        # Greetings
        if any(w in msg for w in ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon']):
            return f"Hello {user_name}! 👋 Welcome to PharmaCare! I'm here to help you with medicines, orders, and health advice. What can I assist you with today?"
        
        # Order related
        if any(w in msg for w in ['order', 'track', 'delivery', 'shipping', 'where is my']):
            return f"📦 You can track your orders in the 'My Orders' section, {user_name}! There you'll see the status of all your orders."
        
        # Headache / Pain
        if any(w in msg for w in ['headache', 'head ache', 'head pain']):
            return f"💊 For headaches, common options include Paracetamol (Tylenol) or Ibuprofen (Advil). If headaches persist, please consult a doctor, {user_name}!"
        
        # Fever
        if 'fever' in msg:
            return f"🌡️ For fever, Paracetamol is commonly recommended. Stay hydrated and rest. If fever is high or persists, please see a doctor, {user_name}!"
        
        # Cold / Flu
        if any(w in msg for w in ['cold', 'flu', 'cough', 'runny nose', 'sore throat']):
            return f"🤧 For cold and flu symptoms, try our Cold & Flu section! Rest and stay hydrated. For severe symptoms, consult a doctor, {user_name}!"
        
        # Pain
        if any(w in msg for w in ['pain', 'ache', 'hurt']):
            return f"💊 For pain relief, Ibuprofen or Paracetamol are common choices. Check our Pain Relief category! For chronic pain, please consult a healthcare provider, {user_name}."
        
        # Medicine queries
        if any(w in msg for w in ['medicine', 'drug', 'medication', 'tablet', 'pill']):
            return f"💊 I'd be happy to help you find medicines, {user_name}! Browse our Products page or tell me what you need."
        
        # Price queries
        if any(w in msg for w in ['price', 'cost', 'how much']):
            return f"💰 You can see all prices on our Products page, {user_name}. Is there a specific product you'd like to know about?"
        
        # Prescription
        if any(w in msg for w in ['prescription', 'doctor', 'rx']):
            return f"📋 For prescription medicines, you'll need a valid prescription. Use our 'Ask Doctor' feature to consult with a doctor, {user_name}!"
        
        # Cart
        if any(w in msg for w in ['cart', 'checkout', 'buy']):
            return f"🛒 View your cart by clicking the cart icon. Ready to checkout? Make sure you've added all items you need, {user_name}!"
        
        # Thanks
        if any(w in msg for w in ['thank', 'thanks']):
            return f"You're welcome, {user_name}! 😊 Is there anything else I can help with?"
        
        # Goodbye
        if any(w in msg for w in ['bye', 'goodbye']):
            return f"Goodbye, {user_name}! 👋 Take care and stay healthy!"
        
        # Help
        if any(w in msg for w in ['help', 'support', 'what can you do']):
            return f"I can help with: 🔍 Finding medicines, 📦 Order tracking, 💊 Medicine info, 🏥 Health tips. What do you need, {user_name}?"
        
        # Default
        return f"Thanks for your message, {user_name}! I can help with medicines, orders, and health advice. What would you like to know? 💊"
    
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