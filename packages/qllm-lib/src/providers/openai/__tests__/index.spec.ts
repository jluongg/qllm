// packages/qllm-lib/src/providers/__tests__/index.spec.ts

import { ChatMessage } from '../../../types';
import { getEmbeddingProvider, getLLMProvider } from '../../index';
import { OpenAIProvider } from '..';

jest.mock('..');

describe('getProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an instance of OpenAIProvider for valid provider name', () => {
    const provider = getLLMProvider('openai');
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should throw an error for an invalid provider name', () => {
    expect(() => getLLMProvider('invalid')).toThrow('Provider "invalid" not found.');
  });

  it('it should give me a list of models', async () => {
    const provider = getLLMProvider('openai');
    const models = await provider.listModels();
    console.log(models);
    expect(OpenAIProvider.prototype.listModels).toHaveBeenCalledTimes(1);
  });

  it('It should generate a chat completion', async () => {
    const provider = getLLMProvider('openai');
    const userMessage: ChatMessage = {
      role: 'user',
      content: {
        type: 'text',
        text: 'What is the capital of France?',
      },
    };
    const messages: ChatMessage[] = [userMessage];

    const options = {
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    };
    await provider.generateChatCompletion({ messages, options });
    expect(OpenAIProvider.prototype.generateChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('It should generate embeddings for a given text', async () => {
    const provider = getEmbeddingProvider('openai');
    const content = 'Hello, world!';
    const model = 'text-embedding-v1';
    const result = await provider.generateEmbedding({ model, content });
    console.log(result);
    expect(OpenAIProvider.prototype.generateEmbedding).toHaveBeenCalledTimes(1);
  });
});
