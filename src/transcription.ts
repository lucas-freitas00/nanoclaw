import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { WAMessage, WASocket } from '@whiskeysockets/baileys';

import { readEnvFile } from './env.js';
import { logger } from './logger.js';

interface TranscriptionConfig {
  model: string;
  enabled: boolean;
  fallbackMessage: string;
}

const DEFAULT_CONFIG: TranscriptionConfig = {
  model: 'whisper-1',
  enabled: true,
  fallbackMessage: '[Voice Message - transcription unavailable]',
};

/**
 * Transcribe an audio buffer using OpenAI Whisper API.
 * Channel-agnostic — works with any audio source.
 */
export async function transcribeAudioBuffer(
  audioBuffer: Buffer,
): Promise<string | null> {
  const env = readEnvFile(['OPENAI_API_KEY']);
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn('OPENAI_API_KEY not set in .env');
    return null;
  }

  try {
    const openaiModule = await import('openai');
    const OpenAI = openaiModule.default;
    const toFile = openaiModule.toFile;

    const openai = new OpenAI({ apiKey });

    const file = await toFile(audioBuffer, 'voice.ogg', {
      type: 'audio/ogg',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: DEFAULT_CONFIG.model,
      response_format: 'text',
    });

    // When response_format is 'text', the API returns a plain string
    return (transcription as unknown as string)?.trim() || null;
  } catch (err) {
    logger.error({ err }, 'OpenAI transcription failed');
    return null;
  }
}

export async function transcribeAudioMessage(
  msg: WAMessage,
  sock: WASocket,
): Promise<string | null> {
  if (!DEFAULT_CONFIG.enabled) {
    return DEFAULT_CONFIG.fallbackMessage;
  }

  try {
    const buffer = (await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: console as any,
        reuploadRequest: sock.updateMediaMessage,
      },
    )) as Buffer;

    if (!buffer || buffer.length === 0) {
      logger.error('Failed to download audio message');
      return DEFAULT_CONFIG.fallbackMessage;
    }

    logger.info({ bytes: buffer.length }, 'Downloaded audio message');

    const transcript = await transcribeAudioBuffer(buffer);
    return transcript || DEFAULT_CONFIG.fallbackMessage;
  } catch (err) {
    logger.error({ err }, 'Transcription error');
    return DEFAULT_CONFIG.fallbackMessage;
  }
}

export function isVoiceMessage(msg: WAMessage): boolean {
  return msg.message?.audioMessage?.ptt === true;
}
