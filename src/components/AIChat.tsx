'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

// Add custom CSS for scrollbar styling
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
  }
  
  .ai-chat-messages::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(0, 245, 212, 0.8) 0%, rgba(155, 93, 229, 0.8) 100%);
  }

  .ai-chat-input::placeholder {
    color: rgba(255, 255, 255, 0.4) !important;
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
        className={`flex flex-col rounded-xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 24, 32, 0.98) 50%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(0, 245, 212, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '20px'
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
              className="w-6 h-6" 
              style={{ color: '#00f5d4' }}
            />
            <div className="absolute -bottom-1 -right-1">
              {getStatusIcon()}
            </div>
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ 
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '700'
              }}
            >
              Liqui AI Assistant
            </h3>
            <p 
              className="text-xs"
              style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px'
              }}
            >
              {getStatusText()}
            </p>
          </div>
        </div>
        {vaultAddress && (
          <div 
            className="text-xs font-mono"
            style={{ 
              color: 'rgba(0, 245, 212, 0.8)',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            Vault: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        className="ai-chat-messages flex-1 overflow-y-auto max-h-96 p-4 space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(16, 24, 32, 0.4) 50%, rgba(0, 0, 0, 0.2) 100%)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 245, 212, 0.3) rgba(0, 0, 0, 0.2)'
        }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                <div className={`rounded-lg px-4 py-2`}
                style={{
                  background: message.sender === 'user' 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(29, 78, 216, 0.3) 100%)'
                    : message.metadata?.error
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: message.sender === 'user' 
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : message.metadata?.error
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                  color: message.sender === 'user' 
                    ? '#ffffff'
                    : message.metadata?.error
                      ? '#fecaca'
                      : '#ffffff',
                  boxShadow: message.sender === 'user' 
                    ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                    : message.metadata?.error
                      ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: 'inherit',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontWeight: '400'
                    }}
                  >
                    {message.content}
                  </p>
                  {message.confidence !== undefined && message.sender === 'ai' && !message.metadata?.error && (
                    <div 
                      className="mt-2 flex items-center gap-2 text-xs"
                      style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                    >
                      <div 
                        className="flex-1 rounded-full h-1"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div 
                          className="h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${message.confidence * 100}%`,
                            background: 'linear-gradient(90deg, #9b5de5 0%, #00f5d4 100%)'
                          }}
                        />
                      </div>
                      <span>{Math.round(message.confidence * 100)}% confident</span>
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-2 py-1 rounded-md transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(0, 245, 212, 0.3)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '12px',
                        fontWeight: '500',
                        backdropFilter: 'blur(8px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(155, 93, 229, 0.1) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.3)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                      }}
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
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
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
                className="rounded-lg px-4 py-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div 
                  className="flex items-center gap-2"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00f5d4' }} />
                  <span className="text-sm">Liqui is thinking...</span>
                </div>
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
            onKeyPress={handleKeyPress}
            placeholder="Ask about vault optimization, rebalancing, predictions..."
            className="ai-chat-input flex-1 rounded-lg px-4 py-2 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '14px',
              backdropFilter: 'blur(10px)',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0, 245, 212, 0.5)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)';
              e.target.style.boxShadow = '0 0 20px rgba(0, 245, 212, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
            style={{
              background: !inputMessage.trim() || isLoading 
                ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.5) 0%, rgba(75, 85, 99, 0.6) 100%)'
                : 'linear-gradient(135deg, #00f5d4 0%, #10b981 50%, #0891b2 100%)',
              boxShadow: !inputMessage.trim() || isLoading 
                ? 'none'
                : '0 4px 15px rgba(0, 245, 212, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div 
          className="mt-2 text-xs"
          style={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '11px'
          }}
        >
          Press Enter to send • Chain ID: 713715 (SEI) • {agentStatus === 'online' ? (
            <span style={{ color: '#00f5d4' }}>AI Agent Connected</span>
          ) : (
            <span style={{ color: '#fbbf24' }}>Using Fallback Mode</span>
          )}
        </div>
      </div>
      </div>
    </>
  )
}