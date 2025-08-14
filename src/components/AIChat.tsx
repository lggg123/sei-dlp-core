'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

// Enhanced CSS for animations, interactions, and accessibility
const chatScrollbarStyles = `
  .ai-chat-messages::-webkit-scrollbar {
    width: 6px;
  }
  
  .ai-chat-messages::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  .ai-chat-messages::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(0, 245, 212, 0.6) 0%, rgba(155, 93, 229, 0.6) 100%);
    border-radius: 3px;
    transition: all 0.3s ease;
  }
  
  .ai-chat-messages::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(0, 245, 212, 0.8) 0%, rgba(155, 93, 229, 0.8) 100%);
    box-shadow: 0 0 10px rgba(0, 245, 212, 0.4);
  }

  /* Smooth scrolling */
  .ai-chat-messages {
    scroll-behavior: smooth;
  }

  /* Message entrance animations */
  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes messagePulse {
    0% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    50% {
      box-shadow: 0 4px 20px rgba(0, 245, 212, 0.2), 0 0 30px rgba(0, 245, 212, 0.1);
    }
    100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  /* Typing indicator animation */
  @keyframes typingDots {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }

  .typing-dot {
    animation: typingDots 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }

  /* Enhanced hover effects for chat messages */
  .chat-message {
    animation: messageSlideIn 0.4s ease-out;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chat-message:hover {
    transform: translateY(-2px);
  }

  .chat-message:hover .message-bubble {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 245, 212, 0.15) !important;
  }

  /* Avatar pulse animation */
  @keyframes avatarPulse {
    0% {
      box-shadow: 0 0 10px rgba(0, 245, 212, 0.3);
    }
    50% {
      box-shadow: 0 0 20px rgba(0, 245, 212, 0.5), 0 0 30px rgba(0, 245, 212, 0.2);
    }
    100% {
      box-shadow: 0 0 10px rgba(0, 245, 212, 0.3);
    }
  }

  .ai-avatar {
    animation: avatarPulse 2s ease-in-out infinite;
  }

  /* Button hover and focus enhancements */
  .send-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .send-button:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 245, 212, 0.6) !important;
  }

  .send-button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  /* Input focus glow effect */
  @keyframes inputGlow {
    0% {
      box-shadow: 0 0 5px rgba(0, 245, 212, 0.2);
    }
    50% {
      box-shadow: 0 0 20px rgba(0, 245, 212, 0.4), 0 0 30px rgba(0, 245, 212, 0.1);
    }
    100% {
      box-shadow: 0 0 5px rgba(0, 245, 212, 0.2);
    }
  }

  .input-focused {
    animation: inputGlow 2s ease-in-out infinite;
  }

  /* Mobile responsiveness - Enhanced */
  @media (max-width: 768px) {
    .ai-chat-messages {
      max-height: 70vh;
      padding: 12px;
    }

    .chat-message {
      margin-bottom: 12px;
    }

    .message-bubble {
      max-width: 85% !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    .ai-chat-input {
      font-size: 16px !important; /* Prevents zoom on iOS */
      padding: 12px 16px !important;
      min-height: 44px !important; /* Better touch target */
    }

    .send-button {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
    }

    /* Reduce animations on mobile for better performance */
    .chat-message:hover {
      transform: none;
    }

    .ai-avatar {
      animation: none;
    }

    .input-focused {
      animation: none;
    }

    /* Better mobile layout for status text */
    .ai-chat-status {
      font-size: 10px !important;
      line-height: 1.3 !important;
      padding: 0 8px !important;
    }
  }

  @media (max-width: 480px) {
    .ai-chat-messages {
      padding: 8px;
      max-height: 60vh;
    }

    .message-bubble {
      max-width: 90% !important;
      padding: 10px 14px !important;
      font-size: 13px !important;
    }

    .ai-chat-input {
      padding: 10px 14px !important;
    }

    .send-button {
      width: 40px !important;
      height: 40px !important;
    }
  }

  .ai-chat-input::placeholder {
    color: rgba(255, 255, 255, 0.4) !important;
    font-style: normal !important;
  }
  
  /* Enhanced input styling to override any external CSS */
  .ai-chat-override .ai-chat-input {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
    font-size: 14px !important;
  }
  
  /* Enhanced text styling to ensure readability */
  .ai-chat-override .ai-chat-messages p {
    color: #ffffff !important;
    border: none !important;
    outline: none !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
    line-height: 1.6 !important;
    word-spacing: 0.05em !important;
  }
  
  /* Status text styling */
  .ai-chat-override .ai-chat-status {
    color: rgba(255, 255, 255, 0.5) !important;
    font-size: 11px !important;
    border: none !important;
    outline: none !important;
  }
  
  /* Prevent unwanted borders on all AI chat elements */
  .ai-chat-override *,
  .ai-chat-override *:before,
  .ai-chat-override *:after {
    border: none !important;
    outline: none !important;
    box-sizing: border-box !important;
  }
  
  /* Ensure proper text wrapping */
  .ai-chat-override .ai-chat-status span {
    display: inline-block !important;
    word-break: normal !important;
    white-space: nowrap !important;
  }
`;

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  confidence?: number
  actions?: string[]
  suggestions?: string[]
  metadata?: Record<string, unknown>
}

interface AIChatProps {
  vaultAddress?: string
  className?: string
  initialMessage?: string
  context?: {
    currentPage?: string
    vaultData?: Record<string, unknown> | unknown[]
    userPreferences?: Record<string, unknown>
  }
}

export default function AIChat({ 
  vaultAddress, 
  className = '',
  initialMessage = "Hello! I'm Liqui, your SEI DLP AI assistant. How can I help optimize your vault today?",
  context = {}
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: initialMessage,
      sender: 'ai',
      timestamp: new Date(),
      confidence: 1.0
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Enhanced auto-scroll with smooth behavior
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current && chatContainerRef.current) {
        const chatContainer = chatContainerRef.current
        const isNearBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100
        
        // Only auto-scroll if user is near the bottom or it's a new message
        if (isNearBottom || messages.length === 1) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end' 
          })
        }
      }
    }

    // Delay scroll to allow for message animation
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages])

  // Check agent status on mount
  useEffect(() => {
    checkAgentStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkAgentStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAgentStatus = async () => {
    try {
      const response = await fetch('/api/eliza/chat')
      const data = await response.json()
      setAgentStatus(data.agentStatus || 'offline')
    } catch (error) {
      console.log('[AIChat] Agent status check failed:', error);
      setAgentStatus('offline')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)
    
    // Add a slight delay to show typing indicator
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const response = await fetch('/api/eliza/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          vaultAddress,
          context: {
            ...context,
            currentPage: 'vaults'
          },
          chainId: 713715
        })
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.message,
          sender: 'ai',
          timestamp: new Date(),
          confidence: data.data.confidence,
          actions: data.data.actions,
          suggestions: data.data.suggestions,
          metadata: data.data.metadata
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Update agent status based on response
        if (data.data.metadata?.processingSource === 'eliza-agent') {
          setAgentStatus('online')
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the AI agent is running on localhost:3000.`,
        sender: 'ai',
        timestamp: new Date(),
        confidence: 0,
        metadata: { error: true }
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputFocus = () => {
    setIsInputFocused(true)
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    inputRef.current?.focus()
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'online':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'offline':
        return <AlertCircle className="w-3 h-3 text-red-400" />
      default:
        return <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
    }
  }

  const getStatusText = () => {
    switch (agentStatus) {
      case 'online':
        return 'AI Agent Online'
      case 'offline':
        return 'AI Agent Offline (Using Fallback)'
      default:
        return 'Checking AI Agent...'
    }
  }

  return (
    <>
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: chatScrollbarStyles }} />
      
      <div 
        className={`ai-chat-override flex flex-col rounded-xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 24, 32, 0.98) 50%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4"
        style={{
          borderBottom: '1px solid rgba(0, 245, 212, 0.3)',
          background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.1) 0%, rgba(155, 93, 229, 0.05) 100%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot 
              className={`w-6 h-6 transition-all duration-300 ${agentStatus === 'online' ? 'ai-avatar' : ''}`}
              style={{ color: '#00f5d4' }}
            />
            <div className="absolute -bottom-1 -right-1 transition-all duration-300">
              {getStatusIcon()}
            </div>
          </div>
          <div>
            <h3 
              className="font-bold tracking-tight"
              style={{ 
                color: '#ffffff',
                fontSize: '17px',
                fontWeight: '800',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #ffffff 0%, #00f5d4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Liqui AI Assistant
            </h3>
            <p 
              className="text-xs font-medium"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '12px',
                fontWeight: '500',
                marginTop: '2px'
              }}
            >
              {getStatusText()}
            </p>
          </div>
        </div>
        {vaultAddress && (
          <div 
            className="text-xs font-mono px-3 py-1 rounded-full"
            style={{ 
              color: '#00f5d4',
              fontSize: '11px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.1) 0%, rgba(155, 93, 229, 0.05) 100%)',
              border: '1px solid rgba(0, 245, 212, 0.3)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 245, 212, 0.1)'
            }}
          >
            Vault: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="ai-chat-messages flex-1 overflow-y-auto max-h-96 p-4 space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(16, 24, 32, 0.4) 50%, rgba(0, 0, 0, 0.2) 100%)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 245, 212, 0.3) rgba(0, 0, 0, 0.2)'
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`chat-message flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${index * 0.1}s` }}
            role="article"
            aria-label={`${message.sender === 'user' ? 'User' : 'AI Assistant'} message`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'text-blue-400' 
                    : message.metadata?.error 
                      ? 'text-red-400'
                      : 'text-purple-400'
                }`}
                style={{
                  background: message.sender === 'user' 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0.4) 100%)'
                    : message.metadata?.error 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 245, 212, 0.3) 0%, rgba(155, 93, 229, 0.4) 100%)',
                  border: message.sender === 'user' 
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : message.metadata?.error 
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(0, 245, 212, 0.4)',
                  boxShadow: message.sender === 'user' 
                    ? '0 0 10px rgba(59, 130, 246, 0.3)'
                    : message.metadata?.error 
                      ? '0 0 10px rgba(239, 68, 68, 0.3)'
                      : '0 0 10px rgba(0, 245, 212, 0.3)'
                }}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div 
                  className="message-bubble rounded-lg px-4 py-2"
                  style={{
                  background: message.sender === 'user' 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(29, 78, 216, 0.45) 100%)'
                    : message.metadata?.error
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: message.sender === 'user' 
                    ? '1px solid rgba(59, 130, 246, 0.6)'
                    : message.metadata?.error
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                  color: message.sender === 'user' 
                    ? '#ffffff'
                    : message.metadata?.error
                      ? '#fecaca'
                      : '#ffffff',
                  boxShadow: message.sender === 'user' 
                    ? '0 4px 15px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)'
                    : message.metadata?.error
                      ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(12px)' // Enhanced blur for better readability
                }}>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: '#ffffff !important',
                      fontSize: '14px',
                      lineHeight: '1.65',
                      fontWeight: message.sender === 'user' ? '500' : '400',
                      letterSpacing: '0.01em',
                      wordSpacing: '0.02em',
                      textShadow: message.sender === 'user' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 2px rgba(0, 0, 0, 0.2)', // Better text clarity for all messages
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased'
                    }}
                  >
                    {message.content}
                  </p>
                  {message.confidence !== undefined && message.sender === 'ai' && !message.metadata?.error && (
                    <div 
                      className="mt-3 flex items-center gap-3 text-xs"
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <div 
                        className="flex-1 rounded-full h-1.5 relative overflow-hidden"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.08)',
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500 ease-out relative"
                          style={{ 
                            width: `${message.confidence * 100}%`,
                            background: 'linear-gradient(90deg, #9b5de5 0%, #00f5d4 100%)',
                            boxShadow: '0 0 8px rgba(0, 245, 212, 0.4)'
                          }}
                        >
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)'
                            }}
                          />
                        </div>
                      </div>
                      <span 
                        className="font-medium"
                        style={{
                          color: message.confidence > 0.8 ? '#00f5d4' : message.confidence > 0.6 ? '#fbbf24' : '#f59e0b',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {Math.round(message.confidence * 100)}% confident
                      </span>
                    </div>
                  )}
                  {(message.metadata?.aiEngineUsed as boolean) && (
                    <div 
                      className="mt-1 text-xs"
                      style={{ 
                        color: '#00f5d4',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      ⚡ Powered by SEI DLP AI Engine
                    </div>
                  )}
                </div>
              </div>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(0, 245, 212, 0.3)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        letterSpacing: '0.01em'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(155, 93, 229, 0.1) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 245, 212, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.3)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }}
                      aria-label={`Use suggestion: ${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message flex justify-start" role="status" aria-label="AI is typing">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center ai-avatar"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.3) 0%, rgba(155, 93, 229, 0.4) 100%)',
                  border: '1px solid rgba(0, 245, 212, 0.4)',
                  color: '#00f5d4',
                  boxShadow: '0 0 10px rgba(0, 245, 212, 0.3)'
                }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div 
                className="message-bubble rounded-lg px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isTyping ? (
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
                    </div>
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Liqui is thinking...</span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00f5d4' }} />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        className="p-4"
        style={{
          borderTop: '1px solid rgba(0, 245, 212, 0.3)',
          background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.05) 0%, rgba(155, 93, 229, 0.03) 100%)'
        }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              handleInputFocus();
              e.target.style.borderColor = 'rgba(0, 245, 212, 0.5)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)';
              e.target.style.boxShadow = '0 0 20px rgba(0, 245, 212, 0.2)';
            }}
            onBlur={(e) => {
              handleInputBlur();
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="Ask about vault optimization, rebalancing, predictions..."
            className={`ai-chat-input flex-1 rounded-lg px-4 py-2 transition-all duration-300 ${isInputFocused ? 'input-focused' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%) !important',
              border: '1px solid rgba(255, 255, 255, 0.2) !important',
              color: '#ffffff !important',
              fontSize: '14px !important',
              backdropFilter: 'blur(10px)',
              outline: 'none'
            }}
            disabled={isLoading}
            aria-label="Chat input"
            aria-describedby="chat-input-help"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white disabled:cursor-not-allowed"
            style={{
              background: !inputMessage.trim() || isLoading 
                ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.5) 0%, rgba(75, 85, 99, 0.6) 100%)'
                : 'linear-gradient(135deg, #00f5d4 0%, #10b981 50%, #0891b2 100%)',
              boxShadow: !inputMessage.trim() || isLoading 
                ? 'none'
                : '0 4px 15px rgba(0, 245, 212, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            aria-label={isLoading ? 'Sending message...' : 'Send message'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div 
          id="chat-input-help"
          className="mt-2 text-xs ai-chat-status"
          style={{ 
            color: 'rgba(255, 255, 255, 0.5) !important',
            fontSize: '11px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            overflow: 'hidden',
            maxWidth: '100%',
            whiteSpace: 'normal',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center',
            paddingLeft: '4px', // Fix text cutoff on left side
            paddingRight: '4px' // Ensure right side spacing as well
          }}
          role="status"
          aria-live="polite"
        >
          <span>Press Enter to send</span>
          <span aria-hidden="true">•</span>
          <span>Chain ID: 713715 (SEI)</span>
          <span aria-hidden="true">•</span>
          {agentStatus === 'online' ? (
            <span style={{ color: '#00f5d4' }} aria-label="AI Agent status: Connected">AI Agent Connected</span>
          ) : (
            <span style={{ color: '#fbbf24' }} aria-label="AI Agent status: Using fallback mode">Using Fallback Mode</span>
          )}
        </div>
      </div>
      </div>
    </>
  )
}