'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

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
    <div className={`flex flex-col bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6 text-purple-400" />
            <div className="absolute -bottom-1 -right-1">
              {getStatusIcon()}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Liqui AI Assistant</h3>
            <p className="text-xs text-gray-400">{getStatusText()}</p>
          </div>
        </div>
        {vaultAddress && (
          <div className="text-xs text-gray-400 font-mono">
            Vault: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : message.metadata?.error 
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500/20 text-white border border-blue-500/20' 
                    : message.metadata?.error
                      ? 'bg-red-500/10 text-red-200 border border-red-500/20'
                      : 'bg-white/5 text-white border border-white/10'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.confidence !== undefined && message.sender === 'ai' && !message.metadata?.error && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <div className="flex-1 bg-white/10 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-blue-400 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${message.confidence * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(message.confidence * 100)}% confident</span>
                    </div>
                  )}
                  {(message.metadata?.aiEngineUsed as boolean) && (
                    <div className="mt-1 text-xs text-green-400">
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
                      className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
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
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Liqui is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about vault optimization, rebalancing, predictions..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all duration-200"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg flex items-center justify-center text-white transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Chain ID: 713715 (SEI) • {agentStatus === 'online' ? 'AI Agent Connected' : 'Using Fallback Mode'}
        </div>
      </div>
    </div>
  )
}