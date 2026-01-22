import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { FiSend, FiUser, FiTrash2, FiRefreshCw, FiZap } from 'react-icons/fi';
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
    { label: '📦 Track Order', message: 'Where is my order?', color: 'from-teal-500 to-cyan-500' },
    { label: '🔍 Search Products', message: 'How do I search for products?', color: 'from-orange-500 to-amber-500' },
    { label: '💊 Medicine Info', message: 'Tell me about medicine safety', color: 'from-cyan-500 to-sky-500' },
    { label: '👨‍⚕️ Ask Doctor', message: 'How can I consult a doctor?', color: 'from-emerald-500 to-green-500' },
    { label: '🚚 Delivery', message: 'What are the delivery options?', color: 'from-violet-500 to-purple-500' },
    { label: '💡 Health Tip', message: 'Give me a health tip', color: 'from-rose-500 to-pink-500' },
  ];

  const formatMessage = (content) => {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '<span class="inline-block w-6 text-teal-500">•</span> ');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Header */}
      <div className="relative py-6 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 pattern-pharmacy opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-glow">
                  <span className="text-3xl">🤖</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">AI Assistant</h1>
                <p className="text-white/50 text-sm flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Powered by AI • Always here to help
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 hover:text-white transition-all border border-white/10"
              title="Clear Chat"
            >
              <FiTrash2 size={18} />
              <span className="hidden sm:inline font-medium">Clear Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 py-6 flex flex-col max-w-4xl">
        {/* Messages */}
        <div className="flex-1 bg-white rounded-3xl shadow-soft p-6 overflow-y-auto mb-6 border border-slate-100" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 animate-fade-in-up ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white'
                }`}>
                  {message.role === 'user' ? <FiUser size={18} /> : '🤖'}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl rounded-tr-md shadow-lg shadow-teal-500/20'
                    : 'bg-slate-50 text-slate-700 rounded-2xl rounded-tl-md border border-slate-100'
                }`}>
                  <div className="p-4 text-sm sm:text-base leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white shadow-md">
                  🤖
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-md border border-slate-100">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <p className="text-sm text-slate-500 mb-3 flex items-center gap-2 font-medium">
            <FiZap className="text-amber-500" size={16} /> Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleSend(action.message)}
                disabled={loading}
                className="group px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                <span className="group-hover:scale-110 inline-block transition-transform">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-100">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="w-full p-4 pr-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none transition-all text-slate-800 placeholder-slate-400"
                rows="2"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[100px]"
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
          <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">🤖 AI-powered assistant</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-xs text-slate-400">For emergencies, call 911</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
