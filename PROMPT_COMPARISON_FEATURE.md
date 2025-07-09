# ⚡ New Feature: Prompt Comparison

## 🎯 What It Does

**Compare 2 prompts across 5 models simultaneously** - Perfect for A/B testing prompts!

### ✨ Key Features:
- 📝 **Enter 2 prompts** to compare (baseline vs comparison)
- 🚀 **Concurrent testing** - All 10 requests (5 models × 2 prompts) run in parallel
- ⚡ **Real-time updates** - See results as they come in
- 📊 **Live comparison table** with speed, cost, and token metrics
- 🏆 **Overall statistics** - Which prompt wins on average?

## 🎛️ How to Use

1. **Start CLI**: `npm run dev`
2. **Select**: `⚡ Compare 2 Prompts`
3. **Enter Prompt 1**: Your baseline prompt
4. **Enter Prompt 2**: Your comparison prompt  
5. **Choose Mode**: Streaming or standard
6. **Watch Magic**: Real-time comparison table updates

## 📊 What You Get

### **Real-Time Comparison Table:**
```
Model              | P1 Status  | P1 Time | P1 Cost  | P2 Status  | P2 Time | P2 Cost  | Speed Diff | Cost Diff
openai/gpt-4o      | ✅ Done   | 1200ms  | $0.0045  | ✅ Done   | 800ms   | $0.0032  | 1.5x faster| 28% cheaper
anthropic/claude   | 🔄 Running| -       | -        | ⏳ Pending| -       | -        | -          | -
```

### **Overall Statistics:**
- ⚡ **Speed**: "Prompt 2 is 1.3x faster on average"
- 💰 **Cost**: "Prompt 1 is 15% cheaper on average"  
- 🎯 **Tokens**: "Prompt 2 uses 22% fewer tokens on average"

### **Response Comparison:**
- Side-by-side responses from both prompts
- Easy to compare quality and completeness

## 🚀 Perfect For:

- **A/B Testing Prompts** - Which version performs better?
- **Cost Optimization** - Which prompt is more economical?
- **Speed Testing** - Which prompt is faster across models?
- **Token Efficiency** - Which prompt uses fewer tokens?
- **Quality Comparison** - Compare response quality side-by-side

## 📈 Example Use Cases:

### **Prompt Optimization:**
- Prompt 1: "Explain quantum computing"
- Prompt 2: "Explain quantum computing in simple terms"
- **Result**: See which is faster, cheaper, and generates better responses

### **Format Testing:**
- Prompt 1: "Write a summary of this article"
- Prompt 2: "Write a bullet-point summary of this article"
- **Result**: Compare structured vs unstructured output efficiency

### **Length Testing:**
- Prompt 1: Long detailed prompt with examples
- Prompt 2: Short concise prompt
- **Result**: Does verbosity improve quality or just cost more?

## 🎯 Benefits:

✅ **Data-Driven Decisions** - Real performance metrics
✅ **Cost Awareness** - See exact cost differences  
✅ **Speed Optimization** - Find the fastest prompt variants
✅ **Quality vs Efficiency** - Balance quality with performance
✅ **Model Insights** - See how different models respond to prompt variations

**Ready to optimize your prompts with real data!** 🔥