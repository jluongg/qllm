/**
 * @fileoverview Implements the reducer pattern for managing conversation state changes.
 * This module contains the core logic for handling all conversation-related actions
 * in an immutable way, following Redux-like patterns.
 * 
 * @module conversation-reducer
 * @author QLLM Team
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Conversation,
  ConversationId,
  ConversationMessage,
  ConversationMetadata,
  CreateConversationOptions,
  ProviderId,
} from '../types';
import {
  ConversationError,
  ConversationNotFoundError,
  InvalidConversationOperationError,
} from '../types';

/**
 * Defines all possible actions that can be performed on a conversation.
 * Each action type corresponds to a specific operation and includes
 * the necessary payload data for that operation.
 * 
 * @typedef {Object} ConversationAction
 */
export type ConversationAction =
  | { type: 'CREATE_CONVERSATION'; payload: CreateConversationOptions }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: ConversationId; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: ConversationId }
  | {
      type: 'ADD_MESSAGE';
      payload: { id: ConversationId; message: Omit<ConversationMessage, 'id'> };
    }
  | {
      type: 'SET_METADATA';
      payload: { id: ConversationId; metadata: Partial<ConversationMetadata> };
    }
  | { type: 'ADD_PROVIDER'; payload: { id: ConversationId; providerId: ProviderId } }
  | { type: 'REMOVE_PROVIDER'; payload: { id: ConversationId; providerId: ProviderId } }
  | { type: 'CLEAR_HISTORY'; payload: ConversationId }
  | { type: 'IMPORT_CONVERSATION'; payload: string };

/**
 * Handles state transitions for conversations based on dispatched actions.
 * Implements a pure reducer pattern where each action produces a new state
 * without modifying the existing state.
 * 
 * @param {Map<ConversationId, Conversation>} state - Current conversation state
 * @param {ConversationAction} action - Action to process
 * @returns {Map<ConversationId, Conversation>} New conversation state
 * @throws {ConversationNotFoundError} When trying to operate on a non-existent conversation
 * @throws {ConversationError} When conversation operations fail
 * @throws {InvalidConversationOperationError} When attempting invalid operations
 * 
 * @example
 * ```typescript
 * const newState = conversationReducer(currentState, {
 *   type: 'CREATE_CONVERSATION',
 *   payload: { metadata: { title: 'New Chat' } }
 * });
 * ```
 */
export const conversationReducer = (
  state: Map<ConversationId, Conversation>,
  action: ConversationAction,
): Map<ConversationId, Conversation> => {
  switch (action.type) {
    case 'CREATE_CONVERSATION': {
      const id = uuidv4();
      const now = new Date();
      const conversation: Conversation = {
        id,
        messages: [],
        metadata: {
          createdAt: now,
          updatedAt: now,
          title: action.payload.metadata?.title || `Conversation ${id}`,
          description: action.payload.metadata?.description || '',
          ...action.payload.metadata,
        },
        activeProviders: new Set(action.payload.providerIds || []),
      };
      if (action.payload.initialMessage) {
        conversation.messages.push({
          id: uuidv4(),
          role: 'user',
          content: {
            type: 'text',
            text: action.payload.initialMessage,
          },
          timestamp: now,
          providerId: action.payload.providerIds?.[0] || '',
          options: {},
        });
      }
      return new Map(state).set(id, conversation);
    }

    case 'UPDATE_CONVERSATION': {
      const { id, updates } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        ...updates,
        metadata: {
          ...conversation.metadata,
          ...updates.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'DELETE_CONVERSATION': {
      const newState = new Map(state);
      newState.delete(action.payload);
      return newState;
    }

    case 'ADD_MESSAGE': {
      const { id, message } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const newMessage: ConversationMessage = {
        ...message,
        id: uuidv4(),
        timestamp: new Date(),
      };
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        activeProviders: new Set(conversation.activeProviders).add(message.providerId),
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'SET_METADATA': {
      const { id, metadata } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        metadata: {
          ...conversation.metadata,
          ...metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'ADD_PROVIDER': {
      const { id, providerId } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      const updatedConversation: Conversation = {
        ...conversation,
        activeProviders: new Set(conversation.activeProviders).add(providerId),
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'REMOVE_PROVIDER': {
      const { id, providerId } = action.payload;
      const conversation = state.get(id);
      if (!conversation) throw new ConversationNotFoundError(id);
      if (!conversation.activeProviders.has(providerId)) {
        throw new InvalidConversationOperationError(
          `Provider ${providerId} is not active in conversation ${id}`,
        );
      }
      const updatedProviders = new Set(conversation.activeProviders);
      updatedProviders.delete(providerId);
      const updatedConversation: Conversation = {
        ...conversation,
        activeProviders: updatedProviders,
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(id, updatedConversation);
    }

    case 'CLEAR_HISTORY': {
      const conversation = state.get(action.payload);
      if (!conversation) throw new ConversationNotFoundError(action.payload);
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [],
        metadata: {
          ...conversation.metadata,
          updatedAt: new Date(),
        },
      };
      return new Map(state).set(action.payload, updatedConversation);
    }

    case 'IMPORT_CONVERSATION': {
      try {
        const parsedData = JSON.parse(action.payload) as Conversation;
        if (!isValidConversation(parsedData)) {
          throw new Error('Invalid conversation data structure');
        }
        return new Map(state).set(parsedData.id, parsedData);
      } catch (error) {
        throw new ConversationError(`Failed to import conversation: ${(error as Error).message}`);
      }
    }

    default:
      return state;
  }
};

/**
 * Type guard to validate if an object conforms to the Conversation interface.
 * Used primarily during conversation import operations.
 * 
 * @param {any} data - Data to validate
 * @returns {boolean} True if the data is a valid Conversation object
 */
function isValidConversation(data: any): data is Conversation {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    Array.isArray(data.messages) &&
    typeof data.metadata === 'object' &&
    data.activeProviders instanceof Set
  );
}
