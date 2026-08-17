export interface MSMARCOPassage {
  id: string;
  title: string;
  text: string;
  language: string;
  languageName: string;
  category: string;
  metadata: {
    domain: string;
    sectionHeader: string;
    passageId: string;
    targetQuery?: string;
  };
}

export interface SampleQuery {
  id: string;
  query: string;
  category: string;
  language: string;
  expectedPassageId: string;
  isOffTopic?: boolean;
}

// Curated representative dataset passages derived from AI4Bharat MSMARCO-XI benchmark
export const INITIAL_MSMARCO_DATASET: MSMARCOPassage[] = [
  {
    id: "msmarco-p101",
    title: "Definition and Causes of Type 2 Diabetes",
    text: "Type 2 diabetes is a chronic metabolic condition characterized by high blood glucose levels resulting from insulin resistance and relative insulin deficiency. Symptoms include increased thirst, frequent urination, unexplained weight loss, and fatigue. Risk factors include obesity, physical inactivity, genetics, and age. Diagnosis is usually confirmed via Fasting Blood Glucose test or HbA1c test exceeding 6.5%. Treatment focuses on dietary changes, regular physical exercise, oral antihyperglycemic drugs such as metformin, and insulin therapy when required.",
    language: "en",
    languageName: "English",
    category: "Medical & Health",
    metadata: {
      domain: "Healthcare",
      sectionHeader: "Pathophysiology & Diagnostics",
      passageId: "p101",
      targetQuery: "What causes type 2 diabetes and how is it diagnosed?"
    }
  },
  {
    id: "msmarco-p102",
    title: "Quantum Computing Principles and Qubits",
    text: "Quantum computing utilizes the fundamental principles of quantum mechanics, such as superposition and entanglement, to process complex data. Unlike classical bits that represent either a 0 or 1, quantum bits (qubits) can exist in a superposition of both states simultaneously. Superconducting circuits and trapped ions are two leading physical implementations of qubits. Quantum algorithms like Shor's algorithm for integer factorization and Grover's algorithm for database search demonstrate exponential and quadratic speedups over classical computing paradigms.",
    language: "en",
    languageName: "English",
    category: "Computer Science",
    metadata: {
      domain: "Physics & CS",
      sectionHeader: "Quantum Physics Applications",
      passageId: "p102",
      targetQuery: "How do quantum bits differ from classical bits?"
    }
  },
  {
    id: "msmarco-p103",
    title: "Renewable Energy Technologies & Solar Photovoltaic Systems",
    text: "Solar photovoltaic (PV) systems convert sunlight directly into electricity using semiconductor materials like silicon. When photons strike solar cells, electrons are knocked loose, creating an electric current. Modern high-efficiency monocrystalline PV panels achieve solar conversion efficiencies exceeding 22%. Combined with battery energy storage systems (BESS) such as lithium iron phosphate (LFP) cells, solar energy can supply continuous zero-emission grid power, significantly mitigating greenhouse gas emissions.",
    language: "en",
    languageName: "English",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Photovoltaic Engineering",
      passageId: "p103",
      targetQuery: "How do solar photovoltaic panels generate electricity?"
    }
  },
  {
    id: "msmarco-p104",
    title: "Transformer Architecture in Deep Learning",
    text: "The Transformer architecture, introduced by Vaswani et al. in 2017 ('Attention Is All You Need'), relies entirely on multi-head self-attention mechanisms to compute representations of its input and output without using sequence-aligned recurrent neural networks (RNNs) or convolution. Key components include Multi-Head Attention, Positional Encoding, Feed-Forward Neural Networks, and Residual Connections with Layer Normalization. Transformers power modern Large Language Models (LLMs) such as BERT, GPT, and LLaMA.",
    language: "en",
    languageName: "English",
    category: "Artificial Intelligence",
    metadata: {
      domain: "Machine Learning",
      sectionHeader: "Neural Network Architectures",
      passageId: "p104",
      targetQuery: "What is the Transformer architecture in deep learning?"
    }
  },
  {
    id: "msmarco-p105",
    title: "Photosynthesis and Plant Physiology",
    text: "Photosynthesis is the chemical process by which green plants, algae, and cyanobacteria convert light energy into chemical energy stored in glucose. The overall reaction combines carbon dioxide and water using light energy absorbed by chlorophyll pigment inside chloroplasts to produce glucose and oxygen gas: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2. Photosynthesis consists of light-dependent reactions occurring in thylakoid membranes and light-independent Calvin cycle reactions taking place in the stroma.",
    language: "en",
    languageName: "English",
    category: "Biology",
    metadata: {
      domain: "Botany",
      sectionHeader: "Biochemical Pathways",
      passageId: "p105",
      targetQuery: "What is the chemical reaction for photosynthesis?"
    }
  },
  {
    id: "msmarco-p106",
    title: "Causes and Consequences of Inflation in Macroeconomics",
    text: "Inflation is the sustained increase in the general price level of goods and services in an economy over a period of time, leading to a decrease in purchasing power per unit of currency. Central banks measure inflation primarily using the Consumer Price Index (CPI) and Personal Consumption Expenditures (PCE). Demand-pull inflation occurs when aggregate demand exceeds supply, while cost-push inflation stems from rising production costs like wages or raw materials. Central banks utilize monetary policy instruments, primarily interest rates, to control inflation targets near 2%.",
    language: "en",
    languageName: "English",
    category: "Economics",
    metadata: {
      domain: "Macroeconomics",
      sectionHeader: "Monetary Policy",
      passageId: "p106",
      targetQuery: "What causes inflation and how do central banks control it?"
    }
  },
  {
    id: "msmarco-p107",
    title: "AI4Bharat MSMARCO-XI Indic IR Benchmark",
    text: "MSMARCO-XI is a premier cross-lingual Information Retrieval benchmark designed by AI4Bharat. It extends the MS MARCO passage retrieval dataset across 11 Indian languages, including Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia, and Assamese. The benchmark evaluates dense vector retrieval, cross-lingual representation alignment, bi-encoder ranking, and retrieval-augmented generation (RAG) performance across structurally diverse Indic languages.",
    language: "en",
    languageName: "English",
    category: "Dataset Documentation",
    metadata: {
      domain: "Information Retrieval",
      sectionHeader: "AI4Bharat Benchmark Overview",
      passageId: "p107",
      targetQuery: "What is MSMARCO-XI dataset and who developed it?"
    }
  },
  {
    id: "msmarco-p108",
    title: "Space Exploration & James Webb Space Telescope",
    text: "The James Webb Space Telescope (JWST) is an infrared space observatory deployed by NASA, ESA, and CSA in December 2021. Operating at the Sun-Earth L2 Lagrange point approximately 1.5 million kilometers from Earth, JWST features a 6.5-meter beryllium primary mirror coated with gold. Its primary scientific objectives include observing the first galaxies formed after the Big Bang, investigating stellar nursery formations, and analyzing exoplanet atmospheres for biosignatures.",
    language: "en",
    languageName: "English",
    category: "Astronomy",
    metadata: {
      domain: "Astrophysics",
      sectionHeader: "Space Telescopes",
      passageId: "p108",
      targetQuery: "Where is James Webb Space Telescope located and what are its goals?"
    }
  },
  {
    id: "msmarco-p109",
    title: "कृत्रिम बुद्धिमत्ता और ट्रांसफार्मर मॉडल (Hindi Passage)",
    text: "ट्रांसफॉर्मर आर्किटेक्चर (Transformer Architecture) आधुनिक प्राकृतिक भाषा प्रसंस्करण (NLP) की रीढ़ है। इसे 2017 में वासवानी द्वारा पेश किया गया था। यह सेल्फ-अटेंशन (Self-Attention) तंत्र पर आधारित है जो वाक्यों के सभी शब्दों के बीच संबंधों की गणना एक साथ करता है। यह तकनीक गूगल के बर्ट (BERT) और ओपनएआई के जीपीटी (GPT) जैसे बड़े भाषा मॉडलों (LLMs) को संचालित करती है।",
    language: "hi",
    languageName: "Hindi",
    category: "Artificial Intelligence",
    metadata: {
      domain: "Machine Learning",
      sectionHeader: "Indic NLP Research",
      passageId: "p109",
      targetQuery: "ट्रांसफार्मर मॉडल क्या है?"
    }
  },
  {
    id: "msmarco-p110",
    title: "சூரிய ஒளி மின்சக்தி அமைப்புகள் (Tamil Passage)",
    text: "சூரிய ஒளிமின்னழுத்த (Photovoltaic) அமைப்புகள் சூரிய ஒளியை நேரடியாக மின்சாரமாக மாற்றுகின்றன. சிலிகான் போன்ற குறைக்கடத்தி பொருட்களைப் பயன்படுத்தி இந்த செல்கள் உருவாக்கப்படுகின்றன. நவீன ஒற்றை படிக (Monocrystalline) சோலார் பேனல்கள் 22% க்கும் அதிகமான ஆற்றல் செயல்திறனை வழங்குகின்றன. பேட்டரி சேமிப்புடன் இணைந்து இது பசுமை மின்சாரத்தை வழங்குகிறது.",
    language: "ta",
    languageName: "Tamil",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p110",
      targetQuery: "சூரிய சக்தி எவ்வாறு மின்சாரத்தை உருவாக்குகிறது?"
    }
  }
];

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "q1",
    query: "What is the Transformer architecture in deep learning?",
    category: "Artificial Intelligence",
    language: "en",
    expectedPassageId: "msmarco-p104"
  },
  {
    id: "q2",
    query: "What is MSMARCO-XI dataset and who developed it?",
    category: "Dataset Benchmark",
    language: "en",
    expectedPassageId: "msmarco-p107"
  },
  {
    id: "q3",
    query: "How do quantum bits differ from classical bits?",
    category: "Quantum Computing",
    language: "en",
    expectedPassageId: "msmarco-p102"
  },
  {
    id: "q4",
    query: "What causes type 2 diabetes and how is it diagnosed?",
    category: "Healthcare",
    language: "en",
    expectedPassageId: "msmarco-p101"
  },
  {
    id: "q5",
    query: "How do solar photovoltaic panels generate electricity?",
    category: "Clean Energy",
    language: "en",
    expectedPassageId: "msmarco-p103"
  },
  {
    id: "q6",
    query: "Where is James Webb Space Telescope located?",
    category: "Astronomy",
    language: "en",
    expectedPassageId: "msmarco-p108"
  },
  {
    id: "q7",
    query: "ट्रांसफार्मर मॉडल क्या है? (Transformer in Hindi)",
    category: "Indic NLP",
    language: "hi",
    expectedPassageId: "msmarco-p109"
  },
  {
    id: "q-off1",
    query: "Can you give me a recipe for baking chocolate chip cookies?",
    category: "Off-Topic Guardrail Test",
    language: "en",
    expectedPassageId: "none",
    isOffTopic: true
  }
];
