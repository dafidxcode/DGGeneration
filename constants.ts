import { ToolId } from "./types";
import { Music, Video, Image as ImageIcon, MessageSquareText, Mic } from "lucide-react";

export const APP_NAME = "DG Generator";
export const API_VERSION = "v1";

export const TOOLS: { id: ToolId; name: string; icon: any; description: string; modelName: string }[] = [
  {
    id: 'music',
    name: 'AI Musics',
    icon: Music,
    description: 'Generate full songs with lyrics using neural audio synthesis.',
    modelName: 'suno-v5-high-fidelity'
  },
  {
    id: 'video',
    name: 'AI Videos',
    icon: Video,
    description: 'High-fidelity video generation using Veo 3.1 architecture.',
    modelName: 'veo-3.1-fast-generate-preview'
  },
  {
    id: 'image',
    name: 'AI Images',
    icon: ImageIcon,
    description: 'Generate stunning images with Nano Banana or Google Imagen engines.',
    modelName: 'multi-model-engine'
  },

  // Imagen tool removed/merged into 'image'

  {
    id: 'tts',
    name: 'AI Voices',
    icon: Mic,
    description: 'Natural text-to-speech with emotive capabilities.',
    modelName: 'gemini-2.5-flash-preview-tts'
  }
];

export const MOCK_USER = {
  id: 'usr_8f92j29',
  name: 'Creative Pro',
  email: 'pro@dcgen.ai',
  avatarUrl: 'https://picsum.photos/id/64/100/100'
};