// @/hooks/useAI.js
'use client';

import { useState, useCallback } from 'react';
import { callAIModel, callAIModelAndWait, getAIPredictionStatus, waitForPrediction } from '@/lib/ai-utils';

/**
 * React hook for AI model interactions
 * Provides state management and easy methods for calling AI models
 */
export function useAI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    /**
     * Execute an AI model
     * @param {string} modelId - The ID of the AI model
     * @param {object} params - Parameters for the model
     * @param {boolean} waitForCompletion - Whether to wait for completion (default: false)
     */
    const execute = useCallback(async (modelId, params = {}, waitForCompletion = false) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let response;
            if (waitForCompletion) {
                response = await callAIModelAndWait(modelId, params);
            } else {
                response = await callAIModel(modelId, params);
            }

            if (response.success) {
                setResult(response.data);
                return response.data;
            } else {
                setError(response.error);
                return null;
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to execute AI model';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Check the status of a prediction
     * @param {string} predictionId - The Replicate prediction ID
     */
    const checkStatus = useCallback(async (predictionId) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getAIPredictionStatus(predictionId);
            
            if (response.success) {
                setResult(response.data);
                return response.data;
            } else {
                setError(response.error);
                return null;
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to check prediction status';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Wait for a prediction to complete
     * @param {string} predictionId - The Replicate prediction ID
     * @param {number} maxWaitTime - Maximum wait time in milliseconds
     */
    const waitForResult = useCallback(async (predictionId, maxWaitTime = 300000) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await waitForPrediction(predictionId, maxWaitTime);
            
            if (response.success) {
                setResult(response.data);
                return response.data;
            } else {
                setError(response.error);
                return null;
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to wait for prediction';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reset the hook state
     */
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setResult(null);
    }, []);

    return {
        // State
        isLoading,
        error,
        result,
        
        // Actions
        execute,
        checkStatus,
        waitForResult,
        reset,
        
        // Computed properties
        hasError: !!error,
        hasResult: !!result && !error,
        isIdle: !isLoading && !error && !result
    };
}

/**
 * Specialized hook for text generation
 */
export function useTextGeneration() {
    const ai = useAI();

    const generateText = useCallback(async (prompt, options = {}) => {
        // You can set a default text model ID here or pass it as parameter
        const modelId = options.modelId || 'default_text_model';
        const params = {
            prompt,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500,
            ...options
        };

        return await ai.execute(modelId, params, options.waitForCompletion);
    }, [ai]);

    return {
        ...ai,
        generateText
    };
}

/**
 * Specialized hook for image generation
 */
export function useImageGeneration() {
    const ai = useAI();

    const generateImage = useCallback(async (prompt, options = {}) => {
        // You can set a default image model ID here or pass it as parameter
        const modelId = options.modelId || 'default_image_model';
        const params = {
            prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_inference_steps: options.steps || 20,
            guidance_scale: options.guidance || 7.5,
            ...options
        };

        return await ai.execute(modelId, params, options.waitForCompletion);
    }, [ai]);

    return {
        ...ai,
        generateImage
    };
}

/**
 * Hook for managing multiple AI operations
 */
export function useMultipleAI() {
    const [operations, setOperations] = useState(new Map());

    const addOperation = useCallback((id, modelId, params, waitForCompletion = false) => {
        setOperations(prev => new Map(prev.set(id, {
            id,
            modelId,
            params,
            waitForCompletion,
            status: 'pending',
            result: null,
            error: null
        })));

        // Execute the operation
        const executeOperation = async () => {
            try {
                setOperations(prev => new Map(prev.set(id, {
                    ...prev.get(id),
                    status: 'running'
                })));

                let response;
                if (waitForCompletion) {
                    response = await callAIModelAndWait(modelId, params);
                } else {
                    response = await callAIModel(modelId, params);
                }

                setOperations(prev => new Map(prev.set(id, {
                    ...prev.get(id),
                    status: response.success ? 'completed' : 'error',
                    result: response.success ? response.data : null,
                    error: response.success ? null : response.error
                })));

            } catch (error) {
                setOperations(prev => new Map(prev.set(id, {
                    ...prev.get(id),
                    status: 'error',
                    error: error.message
                })));
            }
        };

        executeOperation();
    }, []);

    const removeOperation = useCallback((id) => {
        setOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, []);

    const clearAll = useCallback(() => {
        setOperations(new Map());
    }, []);

    return {
        operations: Array.from(operations.values()),
        addOperation,
        removeOperation,
        clearAll,
        getOperation: (id) => operations.get(id)
    };
}

/**
 * Usage Examples:
 * 
 * // Basic AI hook
 * const { execute, isLoading, result, error } = useAI();
 * 
 * const handleGenerate = async () => {
 *   const result = await execute('my_model_id', { prompt: 'Hello world' });
 *   console.log(result);
 * };
 * 
 * // Text generation hook
 * const { generateText, isLoading, result } = useTextGeneration();
 * 
 * const handleTextGen = async () => {
 *   await generateText('Write a poem', { temperature: 0.8 });
 * };
 * 
 * // Image generation hook
 * const { generateImage, isLoading, result } = useImageGeneration();
 * 
 * const handleImageGen = async () => {
 *   await generateImage('A beautiful sunset', { width: 512, height: 512 });
 * };
 * 
 * // Multiple operations
 * const { operations, addOperation } = useMultipleAI();
 * 
 * const handleMultiple = () => {
 *   addOperation('text1', 'text_model', { prompt: 'Hello' });
 *   addOperation('image1', 'image_model', { prompt: 'A cat' });
 * };
 */