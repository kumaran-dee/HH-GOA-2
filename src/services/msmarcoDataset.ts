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
// Covering English + 11 Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia, Assamese)
export const INITIAL_MSMARCO_DATASET: MSMARCOPassage[] = [
  // 1. English - Medical & Healthcare
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
  // 2. English - Quantum Computing
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
  // 3. English - Renewable Energy
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
  // 4. English - Artificial Intelligence
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
  // 5. English - Benchmark Documentation
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
  // 6. Hindi (hi)
  {
    id: "msmarco-p109",
    title: "कृत्रिम बुद्धिमत्ता और ट्रांसफार्मर मॉडल (Hindi Passage)",
    text: "ट्रांसफॉर्मर आर्किटेक्चर (Transformer Architecture) आधुनिक प्राकृतिक भाषा प्रसंस्करण (NLP) की रीढ़ है। इसे 2017 में वासवानी द्वारा पेश किया गया था। यह सेल्फ-अटेंशन (Self-Attention) तंत्र पर आधारित है जो वाक्यों के सभी शब्दों के बीच संबंधों की गणना एक साथ करता है। यह तकनीक गूगल के बर्ट (BERT) और ओपनएआई के जीपीटी (GPT) जैसे बड़े भाषा मॉडलों (LLMs) को संचालित करती है।",
    language: "hi",
    languageName: "Hindi (हिन्दी)",
    category: "Artificial Intelligence",
    metadata: {
      domain: "Machine Learning",
      sectionHeader: "Indic NLP Research",
      passageId: "p109",
      targetQuery: "ट्रांसफार्मर मॉडल क्या है?"
    }
  },
  // 7. Tamil (ta)
  {
    id: "msmarco-p110",
    title: "சூரிய ஒளி மின்சக்தி அமைப்புகள் (Tamil Passage)",
    text: "சூரிய ஒளிமின்னழுத்த (Photovoltaic) அமைப்புகள் சூரிய ஒளியை நேரடியாக மின்சாரமாக மாற்றுகின்றன. சிலிகான் போன்ற குறைக்கடத்தி பொருட்களைப் பயன்படுத்தி இந்த செல்கள் உருவாக்கப்படுகின்றன. நவீன ஒற்றை படிக (Monocrystalline) சோலார் பேனல்கள் 22% க்கும் அதிகமான ஆற்றல் செயல்திறனை வழங்குகின்றன. பேட்டரி சேமிப்புடன் இணைந்து இது பசுமை மின்சாரத்தை வழங்குகிறது.",
    language: "ta",
    languageName: "Tamil (தமிழ்)",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p110",
      targetQuery: "சூரிய சக்தி எவ்வாறு மின்சாரத்தை உருவாக்குகிறது?"
    }
  },
  // 8. Telugu (te)
  {
    id: "msmarco-p114",
    title: "రకం 2 మధుమేహం మరియు దాని లక్షణాలు (Telugu Passage)",
    text: "టైప్ 2 మధుమేహం (Type 2 Diabetes) అనేది ఇన్సులిన్ నిరోధకత కారణంగా రక్తంలో గ్లూకోజ్ స్థాయిలు పెరిగే దీర్ఘకాలిక పరిస్థితి. దీని లక్షణాలలో తీవ్రమైన దాహం, తరచుగా మూత్ర విసర్జన మరియు అలసట ఉంటాయి. క్రమమైన వ్యాయామం, సమతుల్య ఆహారం మరియు మెట్‌ఫార్మిన్ (Metformin) వంటి మందులతో దీనిని నియంత్రించవచ్చు.",
    language: "te",
    languageName: "Telugu (తెలుగు)",
    category: "Medical & Health",
    metadata: {
      domain: "Healthcare",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p114",
      targetQuery: "టైప్ 2 మధుమేహం అంటే ఏమిటి మరియు దాని చికిత్స ఏమిటి?"
    }
  },
  // 9. Bengali (bn)
  {
    id: "msmarco-p115",
    title: "কোয়ান্টাম কম্পিউটিং এবং কিউবিট (Bengali Passage)",
    text: "কোয়ান্টাম কম্পিউটিং কোয়ান্টাম মেকানিক্সের সুপারপজিশন এবং এন্ট্যাঙ্গেলমেন্ট নীতি ব্যবহার করে তথ্য প্রক্রিয়াজাতকরণ করে। ক্লাসিক্যাল বিট (০ বা ১) এর পরিবর্তে কোয়ান্টাম বিট (Qubit) একই সাথে দুটি অবস্থাতেই অবস্থান করতে পারে। এটি জটিল গাণিতিক এবং বৈজ্ঞানিক অনুসন্ধান দ্রুত সমাধান করতে সক্ষম।",
    language: "bn",
    languageName: "Bengali (বাংলা)",
    category: "Computer Science",
    metadata: {
      domain: "Physics & CS",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p115",
      targetQuery: "কোয়ান্টাম বিট বা কিউবিট কীভাবে কাজ করে?"
    }
  },
  // 10. Marathi (mr)
  {
    id: "msmarco-p116",
    title: "पुनर्नवीकरणीय ऊर्जा आणि सौर पॅनेल (Marathi Passage)",
    text: "सौर फोटोव्होल्टाइक (Photovoltaic) यंत्रणा सूर्याच्या प्रकाशाचे थेट विजेमध्ये रुपांतर करते. यासाठी सिलिकॉनसारख्या अर्धवाहकांचा वापर केला जातो. आधुनिक सौर पॅनेल उच्च कार्यक्षमतेसह हरित ऊर्जा निर्माण करतात, ज्यामुळे कार्बन उत्सर्जन कमी होण्यास मदत होते.",
    language: "mr",
    languageName: "Marathi (मराठी)",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p116",
      targetQuery: "सौर ऊर्जेपासून वीज कशी तयार होते?"
    }
  },
  // 11. Kannada (kn)
  {
    id: "msmarco-p117",
    title: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮತ್ತು ನೈಸರ್ಗಿಕ ಭಾಷಾ ಸಂಸ್ಕರಣೆ (Kannada Passage)",
    text: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Artificial Intelligence) ಮತ್ತು ನೈಸರ್ಗಿಕ ಭಾಷಾ ಸಂಸ್ಕರಣೆ (NLP) ತಂತ್ರಜ್ಞಾನಗಳು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ಮಾನವ ಭಾಷೆಯನ್ನು ಅರ್ಥೈಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ. ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಮಾದರಿಗಳು ಮತ್ತು ಆಳವಾದ ಕಲಿಕೆಯ (Deep Learning) ನೆಟ್‌ವರ್ಕ್‌ಗಳು ಆಧುನಿಕ ಭಾಷಾ ಮಾದರಿಗಳಿಗೆ ಬಲ ನೀಡುತ್ತವೆ.",
    language: "kn",
    languageName: "Kannada (ಕನ್ನಡ)",
    category: "Artificial Intelligence",
    metadata: {
      domain: "Machine Learning",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p117",
      targetQuery: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯಲ್ಲಿ ನೈಸರ್ಗಿಕ ಭಾಷಾ ಸಂಸ್ಕರಣೆಯ ಪಾತ್ರವೇನು?"
    }
  },
  // 12. Malayalam (ml)
  {
    id: "msmarco-p118",
    title: "പുനരുപയോഗ ഊർജ്ജവും സൗരോർജ്ജവും (Malayalam Passage)",
    text: "സൗരോർജ്ജ ഫോട്ടോവോൾട്ടായിക് സംവിധാനങ്ങൾ സൂര്യപ്രകാശത്തെ നേരിട്ട് വൈദ്യുതിയാക്കി മാറ്റുന്നു. സിലിക്കൺ അർദ്ധചാലകങ്ങൾ ഉപയോഗിച്ചാണ് സോളാർ സെല്ലുകൾ നിർമ്മിക്കുന്നത്. ഇത് ഹരിതഗൃഹ വാതക ഉദ്‌വമനം കുറയ്ക്കാനും പരിസ്ഥിതി സൗഹൃദ വൈദ്യുതി നൽകാനും സഹായിക്കുന്നു.",
    language: "ml",
    languageName: "Malayalam (മലയാളം)",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p118",
      targetQuery: "സൗരോർജ്ജ പാനലുകൾ എങ്ങനെ പ്രവർത്തിക്കുന്നു?"
    }
  },
  // 13. Gujarati (gu)
  {
    id: "msmarco-p119",
    title: "ટાઇપ 2 ડાયાબિટીસના કારણો અને નિદાન (Gujarati Passage)",
    text: "ટાઇપ 2 ડાયાબિટીસ એ ઇન્સ્યુલિન અવરોધને કારણે થતો એક ક્રોનિક રોગ છે, જેમાં લોહીમાં ગ્લુકોઝનું પ્રમાણ વધી જાય છે. વધુ પડતી તરસ લાગવી અને થાક અનુભવવો એ તેના મુખ્ય લક્ષણો છે. યોગ્ય આહાર, નિયમિત કસરત અને દવાઓ દ્વારા તેને નિયંત્રિત કરી શકાય છે.",
    language: "gu",
    languageName: "Gujarati (ગુજરાતી)",
    category: "Medical & Health",
    metadata: {
      domain: "Healthcare",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p119",
      targetQuery: "ટાઇપ 2 ડાયાબિટીસના લક્ષણો શું છે?"
    }
  },
  // 14. Punjabi (pa)
  {
    id: "msmarco-p120",
    title: "ਕੁਆਂਟਮ ਕੰਪਿਊਟਿੰਗ ਅਤੇ ਕਿਊਬਿਟਸ (Punjabi Passage)",
    text: "ਕੁਆਂਟਮ ਕੰਪਿਊਟਿੰਗ ਕੁਆਂਟਮ ਮੈਕੇਨਿਕਸ ਦੇ ਸਿਧਾਂਤਾਂ 'ਤੇ ਆਧਾਰਿਤ ਹੈ। ਪਰੰਪਰਾਗਤ ਬਿਟਸ (0 ਜਾਂ 1) ਦੀ ਬਜਾਏ, ਕੁਆਂਟਮ ਬਿਟਸ (Qubits) ਇੱਕੋ ਸਮੇਂ ਦੋਵੇਂ ਸਥਿਤੀਆਂ ਵਿੱਚ ਰਹਿ ਸਕਦੇ ਹਨ। ਇਹ ਤਕਨਾਲੋਜੀ ਜਟਿਲ ਗਣਨਾਵਾਂ ਨੂੰ ਬਹੁਤ ਤੇਜ਼ੀ ਨਾਲ ਹੱਲ ਕਰਨ ਦੀ ਸਮਰੱਥਾ ਰੱਖਦੀ ਹੈ।",
    language: "pa",
    languageName: "Punjabi (ਪੰਜਾਬੀ)",
    category: "Computer Science",
    metadata: {
      domain: "Physics & CS",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p120",
      targetQuery: "ਕੁਆਂਟਮ ਕੰਪਿਊਟਿੰਗ ਕੀ ਹੈ?"
    }
  },
  // 15. Odia (or)
  {
    id: "msmarco-p121",
    title: "ସୌର ଶକ୍ତି ଏବଂ ଫୋଟୋଭୋଲ୍ଟାଇକ୍ ସିଷ୍ଟମ୍ (Odia Passage)",
    text: "ସୌର ଫୋଟୋଭୋଲ୍ଟାଇକ୍ (Photovoltaic) ସିଷ୍ଟମ୍ ସୂର୍ଯ୍ୟ କିରଣକୁ ସିଧାସଳଖ ବିଦ୍ୟୁତ୍ ଶକ୍ତିରେ ରୂପାନ୍ତରିତ କରିଥାଏ। ସିଲିକନ୍ ଭଳି ଅର୍ଦ୍ଧପରିବାହୀ ପଦାର୍ଥ ବ୍ୟବହାର କରି ଏହି ସେଲଗୁଡ଼ିକ ତିଆରି ହୋଇଥାଏ, ଯାହା ପରିବେଶ ଅନୁକୂଳ ବିଦ୍ୟୁତ୍ ଯୋଗାଇଥାଏ।",
    language: "or",
    languageName: "Odia (ଓଡ଼ିଆ)",
    category: "Renewable Energy",
    metadata: {
      domain: "Clean Energy",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p121",
      targetQuery: "ସୌର ଶକ୍ତିରୁ କିପରି ବିଦ୍ୟୁତ୍ ଉତ୍ପନ୍ନ ହୁଏ?"
    }
  },
  // 16. Assamese (as)
  {
    id: "msmarco-p122",
    title: "কৃত্ৰিম বুদ্ধিমত্তা আৰু ভাষা প্ৰসংস্কৰণ (Assamese Passage)",
    text: "কৃত্ৰিম বুদ্ধিমত্তা (Artificial Intelligence) আৰু প্ৰাকৃতিক ভাষা প্ৰসংস্কৰণে (NLP) কম্পিউটাৰক মানুহৰ ভাষা বুজি পোৱাত সহায় কৰে। AI4Bharat ৰ MSMARCO-XI তথ্যসেটে ভাৰতীয় ভাষাসমূহৰ বাবে তথ্য পুনৰুদ্ধাৰ (IR) সহজ কৰি তুলিছে।",
    language: "as",
    languageName: "Assamese (অসমীয়া)",
    category: "Artificial Intelligence",
    metadata: {
      domain: "Machine Learning",
      sectionHeader: "Indic Multilingual Passage",
      passageId: "p122",
      targetQuery: "MSMARCO-XI তথ্যসেট কি?"
    }
  },
  // 17. English - HH Goa Resort Knowledge
  {
    id: "msmarco-p111",
    title: "HH Goa Resort Overview & Facilities",
    text: "HH Goa is a premier luxury beachfront resort located in North Goa along the Arabian Sea coastline. The resort features 120 ocean-view suites, a temperature-controlled infinity swimming pool, a full-service Ayurveda wellness spa, direct private beach access, a multi-cuisine seaside restaurant ('Aura'), complimentary high-speed Wi-Fi throughout the property, and 24/7 personalized concierge services.",
    language: "en",
    languageName: "English",
    category: "HH Goa Knowledge",
    metadata: {
      domain: "Hospitality & Tourism",
      sectionHeader: "Resort Facilities & Amenities",
      passageId: "p111",
      targetQuery: "Tell me about HH Goa and its facilities."
    }
  },
  {
    id: "msmarco-p112",
    title: "HH Goa Check-in & Check-out Policy",
    text: "At HH Goa, standard Check-in time begins at 2:00 PM (14:00 hrs) and standard Check-out time is until 11:00 AM (11:00 hrs). Express check-in is available via mobile app. Early check-in or late check-out requests can be accommodated based on room availability and may incur nominal charges. A valid government photo ID is required upon check-in.",
    language: "en",
    languageName: "English",
    category: "HH Goa Knowledge",
    metadata: {
      domain: "Hospitality & Tourism",
      sectionHeader: "Check-in Timings & Rules",
      passageId: "p112",
      targetQuery: "What are check-in and check-out timings at HH Goa?"
    }
  },
  {
    id: "msmarco-p113",
    title: "HH Goa Guest Activities & Water Sports",
    text: "HH Goa offers a diverse array of recreational activities for guests of all ages. Water sports include guided kayaking, jet skiing, banana boat rides, and parasailing organized by certified beach instructors. Onsite activities feature daily morning beachfront yoga sessions, beach volleyball tournaments, cooking masterclasses with head chefs, and evening catamaran sunset cruises along the Goa coastline.",
    language: "en",
    languageName: "English",
    category: "HH Goa Knowledge",
    metadata: {
      domain: "Hospitality & Tourism",
      sectionHeader: "Activities & Entertainment",
      passageId: "p113",
      targetQuery: "What activities are available at HH Goa?"
    }
  }
];

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "hh1",
    query: "What activities are available at HH Goa?",
    category: "HH Goa Knowledge",
    language: "en",
    expectedPassageId: "msmarco-p113"
  },
  {
    id: "hh2",
    query: "What are check-in timings at HH Goa?",
    category: "HH Goa Knowledge",
    language: "en",
    expectedPassageId: "msmarco-p112"
  },
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
    id: "q-hi",
    query: "ट्रांसफार्मर मॉडल क्या है? (Hindi)",
    category: "Indic NLP (Hindi)",
    language: "hi",
    expectedPassageId: "msmarco-p109"
  },
  {
    id: "q-ta",
    query: "சூரிய சக்தி எவ்வாறு மின்சாரத்தை உருவாக்குகிறது? (Tamil)",
    category: "Indic NLP (Tamil)",
    language: "ta",
    expectedPassageId: "msmarco-p110"
  },
  {
    id: "q-te",
    query: "టైప్ 2 మధుమేహం అంటే ఏమిటి? (Telugu)",
    category: "Indic NLP (Telugu)",
    language: "te",
    expectedPassageId: "msmarco-p114"
  },
  {
    id: "q-bn",
    query: "কোয়ান্টাম বিট বা কিউবিট কীভাবে কাজ করে? (Bengali)",
    category: "Indic NLP (Bengali)",
    language: "bn",
    expectedPassageId: "msmarco-p115"
  },
  {
    id: "q-mr",
    query: "सौर ऊर्जेपासून वीज कशी तयार होते? (Marathi)",
    category: "Indic NLP (Marathi)",
    language: "mr",
    expectedPassageId: "msmarco-p116"
  },
  {
    id: "q-kn",
    query: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯಲ್ಲಿ NLP ಪಾತ್ರವೇನು? (Kannada)",
    category: "Indic NLP (Kannada)",
    language: "kn",
    expectedPassageId: "msmarco-p117"
  },
  {
    id: "q-ml",
    query: "സൗരോർജ്ജ പാനലുകൾ എങ്ങനെ പ്രവർത്തിക്കുന്നു? (Malayalam)",
    category: "Indic NLP (Malayalam)",
    language: "ml",
    expectedPassageId: "msmarco-p118"
  },
  {
    id: "q-gu",
    query: "ટાઇપ 2 ડાયાબિટીસના લક્ષણો શું છે? (Gujarati)",
    category: "Indic NLP (Gujarati)",
    language: "gu",
    expectedPassageId: "msmarco-p119"
  },
  {
    id: "q-pa",
    query: "ਕੁਆਂਟਮ ਕੰਪਿਊਟਿੰਗ ਕੀ ਹੈ? (Punjabi)",
    category: "Indic NLP (Punjabi)",
    language: "pa",
    expectedPassageId: "msmarco-p120"
  },
  {
    id: "q-or",
    query: "ସୌର ଶକ୍ତିରୁ କିପରି ବିଦ୍ୟୁତ୍ ଉତ୍ପନ୍ନ ହୁଏ? (Odia)",
    category: "Indic NLP (Odia)",
    language: "or",
    expectedPassageId: "msmarco-p121"
  },
  {
    id: "q-as",
    query: "MSMARCO-XI তথ্যসেট কি? (Assamese)",
    category: "Indic NLP (Assamese)",
    language: "as",
    expectedPassageId: "msmarco-p122"
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


