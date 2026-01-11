
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  GoogleGenAI, 
  Modality, 
  GenerateContentResponse,
  LiveServerMessage,
  Blob
} from "@google/genai";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  Loader2, 
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Volume2,
  XCircle
} from 'lucide-react';

// --- Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 glass border-r border-white/10 z-50">
    <div className="mb-12">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center neon-glow">
        <span className="font-bold text-white text-xl">N</span>
      </div>
    </div>
    <div className="flex-1 flex flex-col gap-8">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <LayoutDashboard size={24} />
      </button>
      <button 
        onClick={() => setActiveTab('chat')}
        className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <MessageSquare size={24} />
      </button>
      <button 
        onClick={() => setActiveTab('vision')}
        className={`p-3 rounded-xl transition-all ${activeTab === 'vision' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <ImageIcon size={24} />
      </button>
      <button 
        onClick={() => setActiveTab('live')}
        className={`p-3 rounded-xl transition-all ${activeTab === 'live' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <Mic size={24} />
      </button>
    </div>
  </nav>
);

const GroundingSources = ({ sources }: { sources: any[] }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((chunk, idx) => (
          chunk.web && (
            <a 
              key={idx} 
              href={chunk.web.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[11px] text-indigo-300 transition-colors border border-white/5"
            >
              <ExternalLink size={10} />
              <span className="max-w-[120px] truncate">{chunk.web.title || chunk.web.uri}</span>
            </a>
          )
        ))}
      </div>
    </div>
  );
};

// --- View: Dashboard ---
const Dashboard = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-8">
    <div className="text-center mb-16">
      <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
        Nexus AI Suite
      </h1>
      <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
        Experience the next generation of creative intelligence. Multi-modal, grounded, and real-time.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
      <div 
        onClick={() => setActiveTab('chat')}
        className="glass p-8 rounded-3xl hover:border-indigo-500/50 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
          <MessageSquare size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-3">Insight Chat</h3>
        <p className="text-gray-400 font-light leading-relaxed">
          Advanced reasoning powered by Gemini 3 Pro with real-time Google Search grounding.
        </p>
      </div>

      <div 
        onClick={() => setActiveTab('vision')}
        className="glass p-8 rounded-3xl hover:border-purple-500/50 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
          <ImageIcon size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-3">Vision Forge</h3>
        <p className="text-gray-400 font-light leading-relaxed">
          Stunning image generation and editing with customizable aspect ratios and high fidelity.
        </p>
      </div>

      <div 
        onClick={() => setActiveTab('live')}
        className="glass p-8 rounded-3xl hover:border-pink-500/50 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
          <Mic size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-3">Live Echo</h3>
        <p className="text-gray-400 font-light leading-relaxed">
          Ultra-low latency real-time voice interaction for natural human-like conversations.
        </p>
      </div>
    </div>
  </div>
);

// --- View: Chat ---
const ChatView = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: userMsg,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No response received.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      setMessages(prev => [...prev, { role: 'ai', text, sources }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to Nexus AI. Please check your network.", error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[90vh] flex flex-col pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="text-indigo-400" />
          Insight Chat
        </h2>
        <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-500">
          POWERED BY GEMINI-3-PRO
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
            <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p>Start a conversation with Nexus Insight...</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl p-5 ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-xl' 
                : 'glass text-gray-200'
            } ${m.error ? 'border-red-500/50' : ''}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              {m.sources && <GroundingSources sources={m.sources} />}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-3xl p-5 flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={20} />
              <span className="text-gray-400 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 pb-8">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything... (Search integrated)"
          className="flex-1 glass px-6 py-4 rounded-2xl outline-none focus:border-indigo-500/50 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white w-14 rounded-2xl flex items-center justify-center transition-all active:scale-95"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};

// --- View: Vision Forge ---
const VisionView = () => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResultImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-8 flex flex-col h-[90vh]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <ImageIcon className="text-purple-400" />
          Vision Forge
        </h2>
        <div className="flex gap-2">
          {['1:1', '16:9', '9:16'].map(ratio => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                aspectRatio === ratio ? 'bg-purple-600 text-white' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
        <div className="flex-1 glass rounded-3xl overflow-hidden relative group">
          {resultImage ? (
            <div className="h-full flex items-center justify-center bg-black/40">
              <img src={resultImage} className="max-h-full max-w-full object-contain" />
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = 'nexus-vision.png';
                  link.click();
                }}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <ExternalLink size={20} />
              </button>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-purple-400 animate-pulse font-medium">Forging Vision...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
              <ImageIcon size={64} className="opacity-20" />
              <p className="text-lg font-light">Your creation will appear here</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="glass p-6 rounded-3xl">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-4 block">Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination in detail..."
              className="w-full h-40 bg-white/5 rounded-xl p-4 outline-none focus:border-purple-500/30 transition-all resize-none mb-6"
            />
            <button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Maximize2 size={20} />}
              Generate Vision
            </button>
          </div>
          
          <div className="glass p-6 rounded-3xl flex-1">
             <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4">Tips</h4>
             <ul className="text-sm text-gray-400 space-y-3 font-light">
               <li className="flex items-start gap-2">
                 <div className="w-1 h-1 bg-purple-500 rounded-full mt-2" />
                 Mention specific lighting (e.g., cinematic, neon)
               </li>
               <li className="flex items-start gap-2">
                 <div className="w-1 h-1 bg-purple-500 rounded-full mt-2" />
                 Add art styles (e.g., cyberpunk, oil painting)
               </li>
               <li className="flex items-start gap-2">
                 <div className="w-1 h-1 bg-purple-500 rounded-full mt-2" />
                 Describe textures and materials
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Live Echo ---
const LiveEchoView = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startLive = async () => {
    try {
      setIsConnecting(true);
      setStatus("Initializing...");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus("Listening...");
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => [...prev.slice(-10), `AI: ${text}`]);
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live error:", e);
            setStatus("Error occurred");
            stopLive();
          },
          onclose: () => {
            setStatus("Closed");
            stopLive();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect");
      setIsConnecting(false);
    }
  };

  const stopLive = () => {
    setIsActive(false);
    setStatus("Idle");
    if (sessionRef.current) {
      // sessionRef.current.close(); // Implicitly handled by cleanup usually
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 h-[90vh] flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Mic className="text-pink-400" />
          Live Echo
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs font-mono uppercase text-gray-400">{status}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative mb-16">
          <div className={`absolute -inset-8 bg-pink-500/20 rounded-full blur-3xl transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`w-48 h-48 rounded-full glass flex items-center justify-center relative z-10 border-2 transition-all duration-500 ${isActive ? 'border-pink-500 scale-110 neon-glow' : 'border-white/10'}`}>
            {isActive ? (
              <div className="flex gap-1.5 items-end h-16">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : (
              <Mic size={64} className="text-gray-600" />
            )}
          </div>
        </div>

        <div className="w-full max-w-lg mb-12 h-32 glass rounded-2xl p-4 overflow-y-auto flex flex-col-reverse text-sm font-light text-gray-400">
           {transcript.length > 0 ? transcript.slice().reverse().map((t, i) => (
             <div key={i} className="mb-1 py-1 border-b border-white/5">{t}</div>
           )) : <div className="text-center opacity-30 mt-8 italic">Capturing live conversation...</div>}
        </div>

        <div className="flex gap-6">
          {!isActive ? (
            <button 
              onClick={startLive}
              disabled={isConnecting}
              className="px-10 py-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
            >
              {isConnecting ? <Loader2 className="animate-spin" /> : <Volume2 />}
              Initialize Live Link
            </button>
          ) : (
            <button 
              onClick={stopLive}
              className="px-10 py-4 bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-400 font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
            >
              <XCircle size={20} />
              Terminate Link
            </button>
          )}
        </div>
      </div>

      <div className="glass p-6 rounded-2xl w-full max-w-xl text-center mb-8">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-[0.2em] mb-2">Technical Note</p>
        <p className="text-sm text-gray-400 font-light">
          Uses native PCM streaming at 16kHz/24kHz for near-zero latency. Perfect for natural dialogues, language practice, or hands-free search.
        </p>
      </div>
    </div>
  );
};

// --- Root Application ---

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-20 p-8 transition-opacity duration-300">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'vision' && <VisionView />}
        {activeTab === 'live' && <LiveEchoView />}
      </main>

      <div className="fixed bottom-6 right-8 text-[10px] text-gray-600 font-mono tracking-widest uppercase pointer-events-none">
        NEXUS CORE V1.0 // GENAI REVOLUTION
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
