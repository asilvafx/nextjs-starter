// @/lib/ai-utils.js
'use client';

/**
 * AI Utilities - Easy AI model calling from frontend
 * These functions provide a simple interface for calling AI models
 */

/**
 * Execute an AI model from client-side code
 * @param {string} modelId - The ID of the AI model to execute
 * @param {object} params - Parameters to pass to the model
 * @returns {Promise<object>} The result from the AI model
 */
export async function callAIModel(modelId, params = {}) {
    try {
        const response = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                modelId,
                params
            })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calling AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to call AI model'
        };
    }
}

/**
 * Get status of a Replicate prediction
 * @param {string} predictionId - The Replicate prediction ID
 * @returns {Promise<object>} The prediction status and results
 */
export async function getAIPredictionStatus(predictionId) {
    try {
        const response = await fetch(`/api/ai/prediction/${predictionId}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting prediction status:', error);
        return {
            success: false,
            error: error.message || 'Failed to get prediction status'
        };
    }
}

/**
 * Wait for a prediction to complete with polling
 * @param {string} predictionId - The Replicate prediction ID
 * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 5 minutes)
 * @param {number} pollInterval - How often to check status in milliseconds (default: 2 seconds)
 * @returns {Promise<object>} The final prediction result
 */
export async function waitForPrediction(predictionId, maxWaitTime = 300000, pollInterval = 2000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        const status = await getAIPredictionStatus(predictionId);
        
        if (!status.success) {
            return status;
        }
        
        const prediction = status.data;
        
        if (prediction.status === 'succeeded') {
            return {
                success: true,
                data: prediction
            };
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
            return {
                success: false,
                error: prediction.error || 'Prediction failed'
            };
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    return {
        success: false,
        error: 'Prediction timed out'
    };
}

/**
 * Execute AI model and wait for completion
 * @param {string} modelId - The ID of the AI model to execute  
 * @param {object} params - Parameters to pass to the model
 * @param {number} maxWaitTime - Maximum time to wait (default: 5 minutes)
 * @returns {Promise<object>} The completed prediction result
 */
export async function callAIModelAndWait(modelId, params = {}, maxWaitTime = 300000) {
    try {
        // Start the prediction
        const startResult = await callAIModel(modelId, params);
        
        if (!startResult.success) {
            return startResult;
        }
        
        const predictionId = startResult.data?.id;
        if (!predictionId) {
            return {
                success: false,
                error: 'No prediction ID returned'
            };
        }
        
        // Wait for completion
        return await waitForPrediction(predictionId, maxWaitTime);
    } catch (error) {
        console.error('Error in callAIModelAndWait:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute and wait for AI model'
        };
    }
}

/**
 * Common AI model presets for easy use
 */
export const AIPresets = {
    // Text generation with common settings
    generateText: (prompt, options = {}) => ({
        prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        ...options
    }),
    
    // Image generation with common settings  
    generateImage: (prompt, options = {}) => ({
        prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        num_inference_steps: options.steps || 20,
        guidance_scale: options.guidance || 7.5,
        ...options
    }),
    
    // Text to speech settings
    textToSpeech: (text, options = {}) => ({
        text,
        voice: options.voice || 'default',
        speed: options.speed || 1.0,
        ...options
    }),
    
    // Speech to text settings
    speechToText: (audioUrl, options = {}) => ({
        audio: audioUrl,
        language: options.language || 'en',
        task: options.task || 'transcribe',
        ...options
    })
};

/**
 * Usage examples:
 * 
 * // Simple model call
 * const result = await callAIModel('my_text_model', AIPresets.generateText('Write a poem'));
 * 
 * // Call and wait for completion
 * const result = await callAIModelAndWait('my_image_model', AIPresets.generateImage('A sunset'));
 * 
 * // Custom parameters
 * const result = await callAIModel('my_model', {
 *   prompt: 'Custom prompt',
 *   temperature: 0.9,
 *   custom_param: 'value'
 * });
 */