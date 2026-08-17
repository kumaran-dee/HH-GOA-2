# MSMARCO-XI Voice RAG Chatbot UI/UX

A modern, high-performance Retrieval-Augmented Generation (RAG) Chatbot grounded on the [AI4Bharat MSMARCO-XI](https://huggingface.co/datasets/ai4bharat/MSMARCO-XI) dataset with built-in **Voice Input (Speech-to-Text)** and **Voice Output (Text-to-Speech)** capabilities.

## 🚀 Key Features

- **Grounded Conversational RAG**: Answers user questions using vector similarity retrieval over AI4Bharat MSMARCO-XI passages (covering Artificial Intelligence, Quantum Computing, Healthcare, Clean Energy, Economics, and Indic NLP IR).
- **🎙️ Voice Input Support**: Speak queries directly using browser Web Speech API with real-time listening indicators and transcription fallback.
- **🔊 Voice Output (TTS)**: Listen to synthesized chatbot responses with interactive sound wave visualizers.
- **📚 Verified Dataset Citations**: Expandable citation cards displaying exact source passages, section titles, and similarity scores.
- **🛡️ Guardrails & Safety**: Pre-execution and context relevance checks that refuse off-topic questions while offering dataset suggestions.
- **🔍 Dataset Index Drawer**: Slide-over drawer to search, filter by domain/language, and inspect all indexed MSMARCO-XI passages.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Vanilla CSS glassmorphism
- **Icons**: Lucide React
- **Retrieval Engine**: TF-IDF + Cosine Similarity Vector Database
- **Dataset**: AI4Bharat MSMARCO-XI (`ai4bharat/MSMARCO-XI`)

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Production Build
npm run build
```

---
Repository: [https://github.com/kumaran-dee/HH-GOA-2.git](https://github.com/kumaran-dee/HH-GOA-2.git)
