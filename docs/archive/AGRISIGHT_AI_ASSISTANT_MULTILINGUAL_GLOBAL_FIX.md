# AgriSight — AI Assistant Global, Multilingual & Voice Repair Specification

## Mission

Repair and upgrade the existing AgriSight AI Assistant into a reliable, farmer-first, multilingual agricultural assistant.

The assistant must become:

**AVAILABLE ANYWHERE → CONTEXT-AWARE → MULTILINGUAL → VOICE-CAPABLE → GROUNDED → SIMPLE**

Do NOT replace the entire AgriSight architecture.

Do NOT break the existing scan, crop, field, risk, authentication, or dashboard systems.

Use the existing assistant/backend implementation wherever possible and fix what is broken.

---

# 1. CORE REQUIREMENT

The AgriSight AI Assistant must work consistently in:

- English
- Hindi
- Bengali

The complete interaction must follow the selected language.

Examples:

### English

```text
English UI
→ English voice input
→ English text
→ AI understands English
→ English answer
→ English voice output
```

### Hindi

```text
Hindi UI
→ Hindi voice input
→ Hindi text
→ AI understands Hindi
→ Hindi answer
→ Hindi voice output
```

### Bengali

```text
Bengali UI
→ Bengali voice input
→ Bengali text
→ AI understands Bengali
→ Bengali answer
→ Bengali voice output
```

Do not make the assistant bilingual only in the UI.

The actual AI conversation must be multilingual.

---

# 2. FIRST: AUDIT THE CURRENT ASSISTANT

Before changing anything, inspect the current implementation.

Find:

- Assistant frontend
- Assistant API route
- FastAPI assistant route
- `assistant.py`
- Gemini service
- Existing context injection
- Existing language system
- Voice input implementation
- Voice output implementation
- Conversation state
- Message persistence if present
- Suggested prompts
- Grounded/Guidance badges
- Evidence system
- Decision rationale system

Identify exactly why the current assistant is not working correctly.

Do not guess.

Trace:

```text
USER
↓
ASSISTANT UI
↓
LANGUAGE
↓
VOICE/TEXT INPUT
↓
API
↓
FASTAPI
↓
CONTEXT RETRIEVAL
↓
GEMINI
↓
STRUCTURED RESPONSE
↓
FRONTEND
↓
VOICE OUTPUT
```

Fix the actual broken links.

---

# 3. MULTILINGUAL AI CONTRACT

Every assistant request must explicitly carry the selected language.

Example:

```json
{
  "message": "আমার টমেটো গাছে পাতা হলুদ হচ্ছে কেন?",
  "language": "bn"
}
```

Hindi:

```json
{
  "message": "मेरे टमाटर के पौधे की पत्तियाँ पीली क्यों हो रही हैं?",
  "language": "hi"
}
```

English:

```json
{
  "message": "Why are my tomato leaves turning yellow?",
  "language": "en"
}
```

The backend must never assume English.

---

# 4. GEMINI LANGUAGE INSTRUCTION

The assistant's Gemini prompt must explicitly enforce the selected language.

For Bengali:

```text
The user's selected language is Bengali (bn).

Understand the user's message in Bengali.

Respond entirely in natural, easy-to-understand Bengali.

Do not return English explanations unless a technical/scientific term genuinely needs its standard English form.

Keep agricultural terminology understandable for farmers.

All recommendations, reasoning, warnings, summaries, follow-up questions and explanations must be Bengali.
```

Hindi must have an equivalent Hindi instruction.

English must return English.

Do not translate the final answer after generation if Gemini can directly generate the selected language.

---

# 5. MIXED-LANGUAGE INPUT

Farmers may naturally mix languages.

Examples:

```text
"আমার tomato গাছের পাতা yellow হচ্ছে কেন?"
```

or:

```text
"मेरे tomato के leaves पीले हो रहे हैं क्यों?"
```

The assistant should understand natural code-switching.

If the selected application language is Bengali:

→ respond in Bengali.

If Hindi:

→ respond in Hindi.

If English:

→ respond in English.

Do not fail simply because a crop name or agricultural term is in English.

---

# 6. LANGUAGE DETECTION

The assistant should use BOTH:

1. Selected application language
2. Actual user input language

Do not blindly override the user's language.

Preferred logic:

```text
User-selected language exists?
        ↓
YES
        ↓
Use it as response language
        ↓
Detect/understand input language automatically
        ↓
Process mixed-language speech/text
```

If automatic detection is confident and the user has not explicitly locked a language, the assistant may adapt.

But the user's explicit language selector always has priority.

---

# 7. LANGUAGE SWITCHING DURING CHAT

If the user switches language during a conversation:

Example:

```text
User:
Why are my leaves yellow?

Assistant:
...

User:
এটার জন্য আমি কী করতে পারি?
```

The assistant should understand that the second message is Bengali.

If the user selected Bengali, respond Bengali.

If the user selected English, respond English unless the user explicitly asks for Bengali.

Never lose conversation context during a language switch.

---

# 8. VOICE INPUT — ROBUST IMPLEMENTATION

The current voice input must be fixed.

It should not stop prematurely.

Implement a stable speech-recognition lifecycle:

```text
IDLE
↓
REQUESTING PERMISSION
↓
LISTENING
↓
INTERIM RESULT
↓
FINAL RESULT
↓
PROCESSING
↓
COMPLETE
```

Handle:

- `onstart`
- `onresult`
- `onend`
- `onerror`
- interim results
- final results
- permission
- microphone availability
- browser compatibility
- manual stop
- unexpected end

Do not restart infinitely.

If recognition ends unexpectedly while the user is actively speaking, restart safely where supported.

If the user presses Stop:

```text
manualStop = true
```

and do not restart.

---

# 9. VOICE LANGUAGE

Use Indian language codes:

```text
English → en-IN
Hindi → hi-IN
Bengali → bn-IN
```

Selected language controls recognition.

English:

```text
recognition.lang = "en-IN"
```

Hindi:

```text
recognition.lang = "hi-IN"
```

Bengali:

```text
recognition.lang = "bn-IN"
```

Show live recognition.

Example:

```text
🎙 Listening...

আমার ধান গাছে পাতা হলুদ হচ্ছে...
```

The recognized text should appear in the chat input before sending where appropriate.

---

# 10. VOICE OUTPUT

Use matching TTS language:

```text
English → en-IN
Hindi → hi-IN
Bengali → bn-IN
```

Find the best available matching browser/device voice.

Do not silently speak Bengali text using an English voice.

If the device lacks the requested voice:

1. Find the closest matching voice.
2. Preserve the correct language.
3. If unavailable, show a localized text-only fallback.

---

# 11. VOICE CONVERSATION MODE

Add a simple optional voice conversation mode.

Flow:

```text
Tap microphone
↓
Speak
↓
Live transcript
↓
Stop
↓
Assistant processes
↓
Assistant responds
↓
Automatically play response
```

The user should be able to disable auto-play.

Provide:

```text
🎙 Speak
🔊 Play
⏸ Pause
⏹ Stop
```

Do not force voice mode on users.

---

# 12. FARMER-FIRST LANGUAGE

The assistant must not sound like a research paper.

Avoid unnecessarily technical responses.

Instead of:

```text
The pathogen exhibits epiphytic colonization under elevated relative humidity...
```

Prefer:

```text
অতিরিক্ত আর্দ্রতার কারণে এই রোগের ঝুঁকি বাড়তে পারে।
```

The assistant should explain:

- What happened
- Why it may be happening
- What to check
- What action to take
- When to check again

Use short paragraphs and bullets.

---

# 13. CONTEXT-AWARE AGRICULTURAL INTELLIGENCE

The existing assistant already attempts to use actual user context.

Make this reliable.

The assistant should use, where available:

```text
User
↓
Fields
↓
Crops
↓
Growth stage
↓
Recent scans
↓
Disease history
↓
Risk
↓
Weather
↓
Interventions
↓
Follow-up
```

The assistant must not invent context.

If information is unavailable, say so.

Example:

```text
I don't have your field location yet.
```

not:

```text
Your field has 85% humidity.
```

unless actual data exists.

---

# 14. CONTEXT RETRIEVAL

Audit `assistant.py` and related services.

Verify that queries correctly retrieve:

- User-owned fields
- User-owned crops
- Recent analyses
- Current crop status
- Field information
- Disease history
- Weather data
- Interventions

Maintain strict user isolation.

Never retrieve another user's data.

---

# 15. GROUNDED VS GUIDANCE

Keep the existing distinction.

Every assistant response should internally classify information as:

```text
GROUNDED
```

when based on actual available AgriSight data.

or:

```text
GUIDANCE
```

when it is general agricultural guidance.

Example:

```text
GROUNDED

Your latest tomato scan showed moderate risk.
```

versus:

```text
GUIDANCE

In general, avoid prolonged leaf wetness.
```

Do not falsely label general advice as observed farm data.

---

# 16. EVIDENCE SYSTEM

Keep the existing evidence tags.

When the assistant references actual data, show useful evidence.

Examples:

```text
Latest scan
3 days ago
Tomato
Moderate risk
```

or:

```text
Weather
High humidity
```

Evidence must come from actual retrieved data.

Do not fabricate evidence.

---

# 17. DECISION RATIONALE

Keep the existing rationale drawer.

When useful, allow:

```text
Why am I seeing this advice?
```

Then show simple reasoning.

Example Bengali:

```text
এই পরামর্শ দেওয়ার কারণ:

• আপনার শেষ স্ক্যানে মাঝারি ঝুঁকি দেখা গেছে
• গত কয়েকদিনে আর্দ্রতা বেশি ছিল
• একই ফসলে আগে একই ধরনের সমস্যা দেখা গেছে
```

Hindi:

```text
यह सलाह देने के कारण:

• आपकी पिछली स्कैन में मध्यम जोखिम मिला
• पिछले कुछ दिनों में नमी अधिक रही
• इसी फसल में पहले भी ऐसी समस्या देखी गई
```

---

# 18. RESPONSE STRUCTURE

Keep responses easy to scan.

Recommended:

```text
SHORT ANSWER

WHY

WHAT TO DO

WHEN TO CHECK AGAIN
```

Do not force this structure when a simple answer is better.

For complicated questions, use:

```text
What I found
Why
What you should do
What to watch
```

---

# 19. SAFETY + AGRICULTURAL RESPONSIBILITY

The assistant must not confidently invent disease diagnoses.

When uncertain:

```text
I can't confirm this from the available information.
```

Provide useful next steps:

- Retake a clearer image
- Check nearby leaves
- Provide crop stage
- Provide field conditions
- Consult an agronomist when necessary

Do not claim certainty without evidence.

---

# 20. GLOBAL ASSISTANT ACCESS

The assistant should be accessible throughout AgriSight.

A farmer should NOT need to navigate to `/assistant` every time.

Implement a persistent assistant entry point.

Preferred desktop:

```text
                         APP
┌──────────────────────────────────────────────┐
│ Main content                              🤖 │
│                                            │ │
│                                            │ │
│                                            │ │
│                                      AI    │ │
│                                  Assistant │ │
└──────────────────────────────────────────────┘
```

Use a floating assistant button on the right side.

When opened:

```text
┌────────────────────────────────────┐
│ AgriSight Assistant          ×     │
├────────────────────────────────────┤
│                                    │
│  Ask about your crops...           │
│                                    │
│  [🎙 Speak]                        │
│                                    │
│  [Send]                            │
└────────────────────────────────────┘
```

Do not permanently occupy large screen space.

---

# 21. MOBILE ASSISTANT

On mobile, do NOT use a large permanent side panel.

Use a floating assistant button or compact bottom-right entry.

When opened:

```text
┌──────────────────────────────┐
│ AgriSight Assistant      ×   │
├──────────────────────────────┤
│                              │
│ Your conversation            │
│                              │
│                              │
│ 🎙 Speak       Send          │
└──────────────────────────────┘
```

Prefer a bottom sheet or near-full-screen assistant on small screens.

It must not block critical controls.

---

# 22. ASSISTANT AVAILABLE EVERYWHERE

The global assistant entry point should be available on:

- Dashboard
- Crops
- Crop detail
- Fields
- Field detail
- Scan
- Analysis
- History
- Comparison
- Other primary application pages

Do not add a duplicate assistant button to every component.

Create one reusable global component.

For example:

```text
GlobalAssistantLauncher
GlobalAssistantPanel
```

Mount it at the application/layout level.

---

# 23. CONTEXT-AWARE GLOBAL ASSISTANT

The assistant should know the current page context when appropriate.

Examples:

On a crop page:

```text
You are viewing:
Tomato
North Field
```

Suggested prompts:

```text
Why is this crop at risk?
What changed recently?
What should I do next?
```

On a field page:

```text
You are viewing:
North Field
```

Suggested prompts:

```text
What needs attention here?
Show recent problems
Explain this field's risk
```

On an analysis page:

```text
You are viewing:
Tomato scan
Moderate risk
```

Suggested prompts:

```text
Explain this result
What should I do?
Should I scan again?
```

Do not expose technical context IDs.

---

# 24. ASSISTANT OPEN/CLOSE BEHAVIOR

Opening the assistant should be instant.

Requirements:

- Smooth open animation
- Smooth close animation
- Escape key closes on desktop
- Back gesture works on mobile
- Focus moves to input
- Keyboard remains usable
- No page layout jumping
- No accidental navigation
- Preserve conversation state while navigating where practical

Use subtle animations only.

---

# 25. SUGGESTED PROMPTS

Suggestions must be localized.

English:

```text
What needs attention today?
Why is my crop at risk?
What should I do next?
```

Hindi:

```text
आज किस चीज़ पर ध्यान देना चाहिए?
मेरी फसल जोखिम में क्यों है?
मुझे आगे क्या करना चाहिए?
```

Bengali:

```text
আজ কোন বিষয়ের দিকে নজর দেওয়া দরকার?
আমার ফসল ঝুঁকিতে কেন?
আমার এখন কী করা উচিত?
```

Suggestions should adapt to current context.

---

# 26. ASSISTANT MEMORY / CONVERSATION

Preserve the current conversation while the panel remains open.

If the existing backend supports conversation history, use it correctly.

Do not expose sensitive data unnecessarily.

Do not create permanent long-term memory unless the existing product explicitly supports it.

---

# 27. STREAMING / RESPONSE UX

If streaming is supported by the existing backend:

Use it.

Show:

```text
Assistant is thinking...
```

in the selected language.

Do not show a generic English loading message in Hindi/Bengali.

If streaming is not supported:

Use a clean loading state.

Never freeze the UI.

---

# 28. ERROR STATES

Assistant errors must be localized.

English:

```text
I couldn't answer that right now.
Please try again.
```

Hindi:

```text
मैं अभी इसका उत्तर नहीं दे पा रहा हूँ।
कृपया फिर से प्रयास करें।
```

Bengali:

```text
আমি এই মুহূর্তে এর উত্তর দিতে পারছি না।
দয়া করে আবার চেষ্টা করুন।
```

Provide Retry.

Do not expose stack traces.

---

# 29. NETWORK RESILIENCE

The assistant should respond appropriately to offline state.

If offline:

```text
You're offline.
The assistant needs an internet connection for new AI responses.
```

Translate this message.

Do not repeatedly send failed requests.

Disable Send while offline.

---

# 30. MOBILE VOICE UX

Test:

```text
Mobile
↓
Open assistant
↓
Tap microphone
↓
Speak Bengali
↓
Transcript appears
↓
Send
↓
Bengali response
↓
Tap/auto-play
↓
Bengali voice
```

Repeat for Hindi and English.

Do not assume desktop browser behavior will work on mobile.

---

# 31. BROWSER COMPATIBILITY

Check speech recognition support.

If unsupported:

```text
Voice input isn't supported in this browser.
You can type your question instead.
```

This must be localized.

Do not make the entire assistant unusable because voice is unavailable.

---

# 32. PERFORMANCE

The global assistant must not slow every page.

Use:

- Lazy loading
- Dynamic import where appropriate
- Shared context
- Minimal global state
- No repeated API calls
- No repeated Gemini requests
- No repeated speech initialization

Do not mount heavy assistant resources unnecessarily on every route.

---

# 33. ACCESSIBILITY

The global assistant must support:

- Keyboard navigation
- Screen readers
- Focus management
- Accessible labels
- Large touch targets
- High contrast
- Reduced motion

Assistant launcher:

```text
aria-label="Open AgriSight Assistant"
```

translated/accessible appropriately where the framework supports it.

---

# 34. DO NOT OVERDESIGN

The assistant should feel premium but simple.

Avoid:

- Huge chatbot windows
- Excessive animations
- Neon AI graphics
- Robot characters everywhere
- Large floating objects
- Complicated controls
- Too many buttons
- Technical terminology

The assistant should feel like:

**a helpful agricultural worker/consultant beside the farmer**

not:

**a futuristic chatbot demo.**

---

# 35. LANGUAGE PERSISTENCE

If the farmer chooses Bengali, the global assistant must remain Bengali across navigation.

Example:

```text
Dashboard Bengali
↓
Open Assistant
↓
Bengali
↓
Go to Crop
↓
Open Assistant
↓
Still Bengali
```

Same for Hindi and English.

---

# 36. LANGUAGE + VOICE END-TO-END CONTRACT

Create one shared language configuration.

Example conceptual structure:

```text
languageConfig = {
  en: {
    speechRecognition: "en-IN",
    speechSynthesis: "en-IN"
  },
  hi: {
    speechRecognition: "hi-IN",
    speechSynthesis: "hi-IN"
  },
  bn: {
    speechRecognition: "bn-IN",
    speechSynthesis: "bn-IN"
  }
}
```

Do not duplicate these values across multiple components.

---

# 37. TEST CASES

### Test 1 — English Text

```text
Language = English
Input = "Why are my tomato leaves yellow?"
Expected = English answer
```

### Test 2 — Hindi Text

```text
Language = Hindi
Input = "मेरे टमाटर के पत्ते पीले क्यों हो रहे हैं?"
Expected = Hindi answer
```

### Test 3 — Bengali Text

```text
Language = Bengali
Input = "আমার টমেটো গাছের পাতা হলুদ হচ্ছে কেন?"
Expected = Bengali answer
```

### Test 4 — Bengali Voice

```text
Language = Bengali
Voice = Bengali
Expected:
bn-IN recognition
→ Bengali transcript
→ Bengali AI
→ Bengali response
→ Bengali TTS
```

### Test 5 — Hindi Voice

```text
Language = Hindi
Voice = Hindi
Expected:
hi-IN recognition
→ Hindi transcript
→ Hindi AI
→ Hindi response
→ Hindi TTS
```

### Test 6 — English Voice

```text
Language = English
Voice = English
Expected:
en-IN recognition
→ English transcript
→ English AI
→ English response
→ English TTS
```

### Test 7 — Mixed Language

```text
"আমার tomato গাছের leaves yellow হচ্ছে কেন?"
```

Expected:

- Understand correctly
- Respond in selected language

---

# 38. GLOBAL ASSISTANT TEST

Verify the assistant launcher appears on:

- Dashboard
- Crops
- Crop detail
- Fields
- Field detail
- Scan
- Analysis
- Comparison
- History

Desktop:

```text
Floating launcher on right
```

Mobile:

```text
Floating launcher / bottom-sheet entry
```

It must never cover:

- Scan button
- Save button
- Camera controls
- Navigation
- Critical field controls

---

# 39. REGRESSION CHECK

After fixing the assistant, verify:

- Authentication
- Dashboard
- Crops
- Fields
- Scan
- AI analysis
- Comparison
- History
- Risk
- Weather
- Interventions
- Multilingual system
- Voice system
- Mobile navigation

Do not break existing functionality.

---

# 40. IMPLEMENTATION ORDER

Follow this order:

1. Audit current assistant architecture
2. Fix assistant API/backend communication
3. Fix context retrieval
4. Fix Gemini prompt/language propagation
5. Fix structured assistant response
6. Fix Bengali/Hindi/English text conversation
7. Fix voice recognition
8. Fix voice language selection
9. Fix TTS language selection
10. Add robust voice lifecycle
11. Create reusable global assistant launcher
12. Add desktop floating assistant
13. Add mobile assistant/bottom sheet
14. Add page-aware context
15. Localize suggestions
16. Localize errors/loading
17. Add accessibility
18. Test all languages
19. Test voice
20. Test mobile
21. Run regression

---

# 41. FINAL ACCEPTANCE CHECKLIST

## AI Assistant

- [ ] Assistant opens reliably
- [ ] Text input works
- [ ] AI response works
- [ ] Context retrieval works
- [ ] Crop context works
- [ ] Field context works
- [ ] Scan context works
- [ ] Risk context works
- [ ] Evidence works
- [ ] Rationale works
- [ ] Grounded/Guidance works
- [ ] Suggestions work

## Multilingual

- [ ] English complete
- [ ] Hindi complete
- [ ] Bengali complete
- [ ] AI responds in selected language
- [ ] Mixed-language input understood
- [ ] Language persists
- [ ] Suggestions translated
- [ ] Errors translated
- [ ] Loading translated

## Voice

- [ ] English recognition
- [ ] Hindi recognition
- [ ] Bengali recognition
- [ ] No premature stopping
- [ ] Interim results
- [ ] Manual stop
- [ ] Permission handling
- [ ] English TTS
- [ ] Hindi TTS
- [ ] Bengali TTS
- [ ] Correct fallback

## Global Access

- [ ] Desktop launcher
- [ ] Mobile launcher
- [ ] Dashboard
- [ ] Crops
- [ ] Crop detail
- [ ] Fields
- [ ] Field detail
- [ ] Scan
- [ ] Analysis
- [ ] Comparison
- [ ] History

## UX

- [ ] Simple
- [ ] Fast
- [ ] Farmer-friendly
- [ ] No unnecessary UI
- [ ] No critical controls blocked
- [ ] Accessible
- [ ] Mobile-friendly
- [ ] Reduced-motion support

---

# 42. FINAL COMMAND TO THE AGENT

Do not simply make the assistant visually better.

Make it **actually reliable**.

Trace the complete pipeline and fix every broken connection.

Do not fake responses.

Do not use hardcoded demo answers.

Do not silently fall back to English.

Do not fabricate crop, field, weather, disease, or scan context.

Do not break existing AgriSight features.

The assistant should become a **global agricultural companion** that is always available but never intrusive.

The final experience should be:

```text
ANY PAGE
   ↓
OPEN AGRISIGHT ASSISTANT
   ↓
TYPE OR SPEAK
   ↓
ASSISTANT UNDERSTANDS THE LANGUAGE
   ↓
ASSISTANT UNDERSTANDS THE CURRENT FARM CONTEXT
   ↓
GROUNDED AGRICULTURAL ANSWER
   ↓
ANSWER IN THE SAME SELECTED LANGUAGE
   ↓
OPTIONAL VOICE PLAYBACK IN THAT LANGUAGE
```

Most important:

> **Do not make the farmer learn another complicated AI tool.**

The assistant should feel like a simple agricultural helper that is always one tap away.

Keep the interface simple.

Put the intelligence in the system behind it.

Make Bengali, Hindi, and English equally important.

Do not treat English as the “real” language and Hindi/Bengali as translations.

All three must be first-class languages.
