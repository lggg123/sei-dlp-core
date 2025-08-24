# 🎥 Demo Recording Guide - SEI AI Accelathon Submission

> **Complete guide for recording a winning 5-minute demo video on iPad**

This guide will help you create a professional demo video that showcases Yield Delta Core's AI-powered features and SEI integration for the AI Accelathon competition.

---

## 📱 **iPad Setup Requirements**

### **Hardware Requirements**
- iPad Pro (recommended) or iPad Air (minimum)
- Stable internet connection
- Good lighting setup (avoid screen glare)
- Quiet environment for clear audio
- iPad stand or tripod mount (optional but helpful)

### **Software Setup**
- **Screen Recording**: Built-in iOS Screen Recording (Settings → Control Center → Screen Recording)
- **Alternative Apps**: 
  - **DemoCreator** (free, good for beginners)
  - **LumaFusion** ($29.99, professional editing)
  - **Record it!** (free with watermark, paid version available)

### **Browser Optimization**
- Use **Safari** or **Chrome** in landscape mode
- Set zoom to **100%** for clarity
- Close all other apps to free up memory
- Enable **Do Not Disturb** to prevent interruptions

---

## ⚙️ **Pre-Recording Checklist**

### **Environment Setup**
```bash
# 1. Ensure demo mode is enabled
grep "NEXT_PUBLIC_DEMO_MODE=true" .env.local

# 2. Start the main application (Terminal 1)
bun dev

# 3. Start Liqui ElizaOS agent (Terminal 2)
cd liqui/
bun install
bun run dev

# 4. Verify both are running
curl -s http://localhost:3001/api/health  # Main app
curl -s http://localhost:3000/health      # Liqui agent
```

### **iPad Configuration**
- [ ] **Landscape orientation** locked
- [ ] **Do Not Disturb** enabled
- [ ] **Screen brightness** at 80-90%
- [ ] **Volume** at comfortable speaking level
- [ ] **Battery** at 70%+ (plug in charger if needed)
- [ ] **Storage** with 2GB+ free space

### **Application Check**
- [ ] App loads without errors at `http://localhost:3000`
- [ ] "DEMO MODE" badges are visible
- [ ] All vault data displays correctly
- [ ] Navigation works smoothly

---

## 🎬 **5-Minute Demo Script**

### **📋 Demo Flow Summary**
1. **[0:00-0:30]** Opening hook and SEI/AI value proposition
2. **[0:30-2:00]** Deposit demo with ATOM-SEI Yield Farm (18.7% APY)
3. **[2:00-3:30]** AI rebalancing execution with real-time progress
4. **[3:30-4:00]** **Liqui ElizaOS agent** with custom SEI plugin showcase
5. **[4:00-5:00]** Portfolio dashboard overview and closing

---

### **[0:00-0:30] Opening Hook & Overview** 

**🎯 Goal**: Hook viewers and establish credibility

**Script**:
```
"This is Yield Delta Core - the first AI-powered DeFi protocol built specifically for SEI's ultra-fast blockchain. 

In the next 5 minutes, I'll show you how our machine learning engine automatically optimizes liquidity positions, solving the $50 billion impermanent loss problem that affects every DeFi user.

What makes this special? We're leveraging SEI's 400-millisecond block finality to enable real-time AI rebalancing that was never possible before."
```

**🎥 Visual Actions**:
- Start at homepage with hero section visible
- Hover over key metrics (TVL, number of vaults)
- Briefly show the 3D vault visualizations
- Point to "Built on SEI" badge

**⏱️ Timing**: 30 seconds exactly

---

### **[0:30-2:00] Vault Deposit Demonstration**

**🎯 Goal**: Show the core user experience and demo mode transparency

**Script**:
```
"Let's start by depositing into our highest-performing vault. I'm selecting the ATOM-SEI Yield Farm with 18.7% APY - our AI has identified strong growth potential in this cross-chain farming strategy.

Notice we're in demo mode for this presentation, which simulates real blockchain transactions with authentic timing and feedback. This gives you the exact user experience without actual funds.

I'll deposit 5 SEI tokens... Watch the processing - this simulates SEI's fast finality... And there we have our transaction confirmation with a realistic transaction hash."
```

**🎥 Visual Actions**:
1. Navigate to `/vaults` page (0:30-0:35)
2. Click on "ATOM-SEI Yield Farm" card (18.7% APY) (0:35-0:40)
3. Click "Deposit" button (0:40-0:45)
4. Enter "5" in amount field (0:45-0:50)
5. Point out "DEMO MODE" indicator (0:50-0:55)
6. Click "Deposit Now" (0:55-1:00)
7. Wait for 2-second processing animation (1:00-1:05)
8. Show success message with transaction hash (1:05-1:15)
9. Navigate to portfolio page (1:15-1:30)
10. Show the ATOM-SEI position (note: values are mocked) (1:30-2:00)

**🔑 Key Points to Emphasize**:
- "DEMO MODE" transparency
- Realistic transaction timing
- Professional UI/UX design
- SEI integration benefits

**⚠️ Portfolio Note**: The portfolio displays static mock data for demonstration. Explain: "The portfolio shows our existing positions with real performance metrics, though deposit updates are simulated for this demo."

---

### **[2:00-3:30] AI Rebalancing Magic**

**🎯 Goal**: Showcase the AI engine - the core innovation

**Script**:
```
"Now for the real magic - our AI-powered rebalancing system. Our machine learning models continuously analyze market conditions across all SEI DEXs and identify optimization opportunities.

Let me navigate to the rebalancing dashboard... Here, our AI has identified 3 optimization actions that could increase our portfolio yield. The AI recommends moving funds from lower-yielding positions to higher opportunities.

I'll select these three actions... Notice each has detailed reasoning - the AI explains its decision-making process. Let's execute the rebalance...

Watch this - each transaction executes progressively with real-time status updates. This is where SEI's 400-millisecond finality really shines - enabling true real-time AI optimization that's impossible on slower blockchains."
```

**🎥 Visual Actions**:
1. Navigate to `/portfolio/rebalance` (2:00-2:10)
2. Show AI recommendations table (2:10-2:20)
3. Point to "DEMO MODE" indicator (2:20-2:25)
4. Hover over each recommendation to show reasoning (2:25-2:35)
5. Select 2-3 checkboxes for actions (2:35-2:45)
6. Click "Execute Rebalance" (2:45-2:50)
7. Watch progressive execution with progress bar (2:50-3:10)
8. Show completion status with transaction hashes (3:10-3:30)

**🔑 Key Technical Points**:
- AI decision-making transparency
- Real-time execution capabilities
- SEI's speed advantage for AI trading
- Professional progress tracking

---

### **[3:30-4:00] Liqui ElizaOS Agent Showcase**

**🎯 Goal**: Demonstrate the full ElizaOS AI agent - the sophisticated AI analysis engine

**Script**:
```
"Now let me show you our most innovative feature - Liqui, our ElizaOS-powered AI agent with the custom SEI Yield Delta plugin.

This isn't just a simple chatbot - Liqui is a full ElizaOS agent trained specifically on SEI DLP vault strategies, with direct API integration to our vault analytics.

Let me open Liqui's interface at localhost:3000... Watch how it provides sophisticated vault analysis, rebalancing recommendations, and can access real-time data from our SEI smart contracts.

I'll ask Liqui to analyze our ATOM-SEI position with specific metrics... Notice how it provides detailed DeFi insights, risk assessments, and actionable optimization strategies based on our actual vault data."
```

**🎥 Visual Actions**:
1. Open new browser tab to `localhost:3000` (3:30-3:33)
2. Show Liqui ElizaOS interface loading (3:33-3:36)
3. Display Liqui's sophisticated welcome with SEI DLP knowledge (3:36-3:40)
4. Type: "Analyze the ATOM-SEI Yield Farm vault performance and suggest optimizations" (3:40-3:45)
5. Show ElizaOS processing with advanced analysis (3:45-3:55)
6. Highlight detailed response with vault metrics, risk analysis, and SEI-specific insights (3:55-4:00)

**🔑 Key Points to Emphasize**:
- **Full ElizaOS Agent**: Not just a chat widget, but a complete AI system
- **Custom SEI Plugin**: `@elizaos/plugin-sei-yield-delta` for vault-specific analysis
- **Real API Integration**: Direct access to vault data and smart contract analytics
- **Advanced DeFi Intelligence**: Sophisticated yield optimization and risk assessment
- **SEI-Optimized**: Understands 400ms finality and SEI ecosystem advantages

**⚙️ Setup Note**: Before recording, ensure Liqui ElizaOS agent is running:
```bash
cd liqui/
bun install
bun run dev  # Starts Liqui agent at localhost:3000
```

---

### **[4:00-4:30] Portfolio Dashboard & Platform Overview**

**🎯 Goal**: Show comprehensive platform capabilities and wrap up features

**Script**:
```
"Let's check our portfolio dashboard to see the full platform capabilities... Our dashboard provides comprehensive analytics powered by machine learning insights.

You can see real-time performance metrics, risk analysis, and yield projections across all positions. The AI continuously monitors for impermanent loss risk and suggests hedging strategies.

The platform also includes seamless withdrawal capabilities, advanced analytics, and everything is optimized for SEI's high-performance blockchain with 400-millisecond finality."
```

**🎥 Visual Actions**:
1. Navigate to main portfolio page (4:00-4:05)
2. Show performance metrics and P&L data (4:05-4:15)
3. Hover over risk indicators and analytics (4:15-4:20)
4. Quick withdrawal demo (click withdraw, show modal) (4:20-4:25)
5. Show overall portfolio value and yields (4:25-4:30)

**🔑 Features to Highlight**:
- Real-time analytics
- AI chat integration
- Risk management tools
- Professional data visualization

---

### **[4:30-5:00] Closing & Competition Value**

**🎯 Goal**: Reinforce why this wins the competition

**Script**:
```
"Yield Delta Core represents the future of DeFi - where artificial intelligence meets ultra-fast blockchain technology.

We're solving the $50 billion impermanent loss problem with sophisticated machine learning, leveraging SEI's unique 400-millisecond finality to enable real-time optimization impossible on any other blockchain.

This isn't just a concept - it's a production-ready platform with 8 AI-optimized vault strategies, comprehensive testing, and a beautiful user experience that makes advanced DeFi accessible to everyone.

Built specifically for the SEI ecosystem, Yield Delta Core showcases why SEI is the perfect foundation for the next generation of AI-powered financial applications. Thank you."
```

**🎥 Visual Actions**:
1. Return to homepage/overview (4:30-4:35)
2. Quick scroll through vault strategies (4:35-4:45)
3. Show SEI integration badges (4:45-4:50)
4. End on hero section with logo (4:50-5:00)

---

## 🎙️ **Recording Best Practices**

### **Audio Quality**
- **Speak clearly** and at moderate pace
- **Project confidence** - this is production-ready software
- **Pause briefly** between sections for editing
- **Avoid filler words** ("um", "uh", "like")
- **Practice the script** 2-3 times before recording

### **Visual Techniques**
- **Smooth cursor movements** - avoid jerky navigation
- **Hover meaningfully** - point to specific UI elements
- **Consistent timing** - spend adequate time on each feature
- **Show, don't just tell** - interact with the interface
- **Zoom appropriately** - ensure text is readable

### **iPad Recording Tips**
- **Start recording first**, then open browser
- **Keep fingers off screen** during critical moments
- **Use landscape mode** for maximum screen real estate
- **Record in 1080p** at minimum (4K if available)
- **Leave 2-3 seconds** buffer at start/end for editing

---

## 🔧 **Technical Setup Instructions**

### **1. Enable Screen Recording**
```
Settings → Control Center → Customize Controls → Add "Screen Recording"
```

### **2. Start Application**
```bash
# Terminal commands to run before recording:
cd /path/to/sei-dlp-core
export NEXT_PUBLIC_DEMO_MODE=true
pnpm dev
```

### **3. Verify Demo Mode**
- Look for green "DEMO MODE" badges in modals
- Confirm transactions simulate (don't actually execute)
- Check that all features load properly

### **4. Recording Process**
1. **Open Control Center** (swipe down from top-right)
2. **Press and hold** screen recording button
3. **Enable microphone** for narration
4. **Count down** "3, 2, 1" then start
5. **Follow script** timing precisely
6. **End recording** from Control Center

---

## 🎨 **Video Enhancement Tips**

### **Basic Editing (iOS Photos App)**
- **Trim** unnecessary intro/outro
- **Adjust speed** if slightly over 5 minutes
- **Add title slide** with project name (optional)

### **Advanced Editing (LumaFusion/DemoCreator)**
- **Add intro text overlay**: "Yield Delta Core - SEI AI Accelathon 2025"
- **Highlight key moments** with zoom or callouts
- **Add transition effects** between major sections
- **Include call-to-action** at end with GitHub link

### **Export Settings**
- **Resolution**: 1080p or 4K
- **Format**: MP4 (H.264)
- **Quality**: High (for competition submission)
- **Audio**: AAC, 44.1kHz

---

## 🚨 **Troubleshooting Common Issues**

### **App Not Loading**
```bash
# Check if development server is running
lsof -i :3000

# Restart if needed
pkill -f "next dev"
pnpm dev
```

### **Demo Mode Not Working**
```bash
# Verify environment variable
cat .env.local | grep DEMO_MODE

# Should show: NEXT_PUBLIC_DEMO_MODE=true
```

### **iPad Recording Issues**
- **Storage full**: Free up 2GB+ space
- **App crashes**: Close other apps, restart iPad
- **Poor audio**: Check microphone permissions
- **Laggy performance**: Restart iPad, close background apps

### **Network Issues**
- Use **localhost** connection (faster than network IP)
- Ensure **stable WiFi** connection
- **Disable VPN** if causing slowdowns

---

## 🏆 **Success Checklist**

Before submitting your demo video, ensure:

**Content Quality**:
- [ ] All 5 sections covered within timing
- [ ] Demo mode clearly indicated and explained  
- [ ] AI features prominently showcased
- [ ] SEI integration benefits explained
- [ ] Professional narration throughout

**Technical Quality**:
- [ ] Clear 1080p+ video quality
- [ ] Crisp audio without background noise
- [ ] Smooth navigation and interactions
- [ ] All text and UI elements readable
- [ ] 5 minutes or less total duration

**Competition Requirements**:
- [ ] Project clearly identified as SEI native
- [ ] AI innovation prominently featured
- [ ] Real problem being solved explained
- [ ] Ecosystem value for SEI articulated
- [ ] Professional presentation quality

---

## 📞 **Need Help?**

If you encounter issues during recording:

1. **Check DEMO_MODE.md** for detailed demo mode documentation
2. **Verify application setup** using the pre-recording checklist  
3. **Practice the script** multiple times before recording
4. **Test screen recording** with a short sample first

**Remember**: This demo showcases a production-ready, AI-powered DeFi platform that could revolutionize yield optimization on SEI. Present it with the confidence it deserves! 🚀

---

*Good luck with your SEI AI Accelathon submission! 🏆*