import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { FiSend, FiUser, FiTrash2, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Hello! 👋 I'm your **PharmaCare AI Assistant**. I can help you with:

• 🔍 **Product Search** - Find medicines and health products
• 📦 **Order Tracking** - Check your order status
• 💊 **Medicine Info** - Dosage, side effects, and more
• 👨‍⚕️ **Doctor Consultations** - How to ask our doctors
• 🚚 **Delivery & Returns** - Shipping and refund info
• 💡 **Health Tips** - Daily wellness advice

Just type your question or try one of the quick options below!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (customMessage = null) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({ message: messageToSend });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again or contact our support team.' 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Chat cleared! 🔄 How can I help you today?' 
      }
    ]);
    toast.success('Chat cleared');
  };

  const quickActions = [
    { label: '📦 Track Order', message: 'Where is my order?' },
    { label: '🔍 Search Products', message: 'How do I search for products?' },
    { label: '💊 Medicine Info', message: 'Tell me about medicine safety' },
    { label: '👨‍⚕️ Ask Doctor', message: 'How can I consult a doctor?' },
    { label: '🚚 Delivery Info', message: 'What are the delivery options?' },
    { label: '💡 Health Tip', message: 'Give me a health tip' },
  ];

  const formatMessage = (content) => {
    // Convert markdown-like formatting to HTML
    let formatted = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Line breaks
      .replace(/\n/g, '<br/>')
      // Bullet points with emojis
      .replace(/• /g, '<span class="inline-block w-6">•</span> ');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Header */}
      <div 
        className="relative py-6 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/images/doctors-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PharmaCare AI Assistant</h1>
                <p className="text-white/70 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online - Powered by AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-2"
                title="Clear Chat"
              >
                <FiTrash2 size={18} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 py-4 flex flex-col max-w-4xl">
        {/* Messages */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 sm:p-6 overflow-y-auto mb-4" style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '400px' }}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 animate-fade-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                    : 'bg-gradient-to-br from-green-500 to-teal-500 text-white'
                }`}>
                  {message.role === 'user' ? <FiUser size={18} /> : '🤖'}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                }`}>
                  <div className="text-sm sm:text-base leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                  🤖
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-md shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <FiMessageSquare size={14} /> Quick actions:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleSend(action.message)}
                disabled={loading}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-gray-800"
                rows="2"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[100px]"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin" size={20} />
              ) : (
                <>
                  <FiSend size={18} />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            🤖 AI-powered assistant • For medical emergencies, please call 911
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;