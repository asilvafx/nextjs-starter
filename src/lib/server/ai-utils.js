// @/lib/server/ai-utils.js
'use server';

import { executeAIModel, getAllAIModels } from './admin.js';

/**
 * Server-side AI Utilities
 * These functions can only be used in server components and API routes
 */

/**
 * Execute AI model with validation and error handling
 * @param {string} modelId - The ID of the AI model to execute
 * @param {object} params - Parameters to pass to the model
 * @returns {Promise<object>} The result from the AI model
 */
export async function runAIModel(modelId, params = {}) {
    try {
        const result = await executeAIModel(modelId, params);
        return result;
    } catch (error) {
        console.error('Error running AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to run AI model'
        };
    }
}

/**
 * Get all enabled AI models
 * @returns {Promise<array>} List of enabled AI models
 */
export async function getEnabledAIModels() {
    try {
        const result = await getAllAIModels({ enabledOnly: true });
        if (result.success) {
            return result.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting enabled AI models:', error);
        return [];
    }
}

/**
 * Find AI model by name
 * @param {string} modelName - Name of the model to find
 * @returns {Promise<object|null>} The model or null if not found
 */
export async function findAIModelByName(modelName) {
    try {
        const result = await getAllAIModels();
        if (result.success) {
            const models = result.data || [];
            return models.find(model => 
                model.name.toLowerCase() === modelName.toLowerCase() || 
                model.modelId.includes(modelName)
            ) || null;
        }
        return null;
    } catch (error) {
        console.error('Error finding AI model:', error);
        return null;
    }
}

/**
 * Batch execute multiple AI models
 * @param {Array} modelRequests - Array of {modelId, params} objects
 * @returns {Promise<Array>} Array of results
 */
export async function runMultipleAIModels(modelRequests) {
    try {
        const promises = modelRequests.map(request => 
            executeAIModel(request.modelId, request.params)
        );
        
        const results = await Promise.allSettled(promises);
        
        return results.map((result, index) => ({
            modelId: modelRequests[index].modelId,
            success: result.status === 'fulfilled' && result.value.success,
            data: result.status === 'fulfilled' ? result.value.data : null,
            error: result.status === 'rejected' ? result.reason.message : 
                   (result.value && !result.value.success ? result.value.error : null)
        }));
        
    } catch (error) {
        console.error('Error running multiple AI models:', error);
        return modelRequests.map(request => ({
            modelId: request.modelId,
            success: false,
            data: null,
            error: error.message || 'Failed to execute model'
        }));
    }
}

/**
 * AI Model Templates for common use cases
 */
export const ServerAITemplates = {
    /**
     * Generate text content
     * @param {string} prompt - The text prompt
     * @param {object} options - Additional options
     */
    generateText: async (prompt, options = {}) => {
        const textModel = await findAIModelByName('gpt') || await findAIModelByName('llama');
        if (!textModel) {
            return { success: false, error: 'No text generation model found' };
        }
        
        return await runAIModel(textModel.id, {
            prompt,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500,
            ...options
        });
    },

    /**
     * Generate images
     * @param {string} prompt - The image prompt
     * @param {object} options - Image generation options
     */
    generateImage: async (prompt, options = {}) => {
        const imageModel = await findAIModelByName('stable-diffusion') || 
                          await findAIModelByName('dalle') || 
                          await findAIModelByName('midjourney');
        
        if (!imageModel) {
            return { success: false, error: 'No image generation model found' };
        }
        
        return await runAIModel(imageModel.id, {
            prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_inference_steps: options.steps || 20,
            guidance_scale: options.guidance || 7.5,
            ...options
        });
    },

    /**
     * Transcribe audio to text
     * @param {string} audioUrl - URL to the audio file
     * @param {object} options - Transcription options
     */
    transcribeAudio: async (audioUrl, options = {}) => {
        const whisperModel = await findAIModelByName('whisper');
        if (!whisperModel) {
            return { success: false, error: 'No audio transcription model found' };
        }
        
        return await runAIModel(whisperModel.id, {
            audio: audioUrl,
            language: options.language || 'en',
            task: options.task || 'transcribe',
            ...options
        });
    },

    /**
     * Analyze or classify content
     * @param {string} content - The content to analyze
     * @param {string} task - The analysis task
     * @param {object} options - Additional options
     */
    analyzeContent: async (content, task, options = {}) => {
        const analysisModel = await findAIModelByName('gpt') || await findAIModelByName('claude');
        if (!analysisModel) {
            return { success: false, error: 'No content analysis model found' };
        }
        
        const prompt = `Task: ${task}\n\nContent: ${content}\n\nProvide a detailed analysis:`;
        
        return await runAIModel(analysisModel.id, {
            prompt,
            temperature: options.temperature || 0.3,
            max_tokens: options.maxTokens || 1000,
            ...options
        });
    }
};

/**
 * Usage Examples:
 * 
 * // In an API route or server component:
 * import { runAIModel, ServerAITemplates } from '@/lib/server/ai-utils';
 * 
 * // Direct model execution
 * const result = await runAIModel('my_model_id', {
 *   prompt: 'Write a story',
 *   temperature: 0.8
 * });
 * 
 * // Using templates
 * const textResult = await ServerAITemplates.generateText('Write a poem about nature');
 * const imageResult = await ServerAITemplates.generateImage('A beautiful landscape');
 * 
 * // Multiple models
 * const results = await runMultipleAIModels([
 *   { modelId: 'text_model', params: { prompt: 'Hello' } },
 *   { modelId: 'image_model', params: { prompt: 'A cat' } }
 * ]);
 */