// @/components/google-places-input.jsx
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { isIntegrationEnabled } from '@/lib/client/integrations';

// Global variables to track script loading state
let isGoogleMapsLoading = false;
let googleMapsLoadPromise = null;

const GooglePlacesInput = ({
                                      legacy = false,
                                      value,
                                      onChange,
                                      onPlaceSelected, // NEW: Callback for when a place is selected with full details
                                      onError,
                                      hasError,
                                      placeholder = "Start typing your address...",
                                      styles = {},
                                      apiKey
                                  }) => {
    const containerRef = useRef(null);
    const placeAutocompleteRef = useRef(null);
    const isLoadedRef = useRef(false);
    const addressInputRef = useRef(null);
    const [isGoogleMapsEnabled, setIsGoogleMapsEnabled] = useState(false);

    // Detect if device is mobile
    const isMobile = () => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768 && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Determine if legacy mode should be used
    const shouldUseLegacy = () => {
        if (legacy === "mobile") {
            return isMobile();
        }
        return Boolean(legacy);
    };

    // Default styles that can be overridden
    const defaultStyles = {
        width: '100%',
        height: '2.75rem',
        padding: '0.75rem',
        border: '1px solid rgba(0,0,0,.2)',
        borderRadius: '0.5rem',
        fontSize: '16px', // Important: 16px or larger prevents zoom on iOS
        backgroundColor: '#fff',
        color: 'var(--text-primary)',
        ...styles // Override defaults with provided styles
    };

    // Prevent mobile zoom by managing viewport meta tag
    const preventMobileZoom = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    };

    const restoreMobileZoom = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
    };

    const initGooglePlaces = async () => {
        try {
            if (shouldUseLegacy()) {
                // Legacy implementation with google.maps.places.Autocomplete
                initLegacyAutocomplete();
            } else {
                // New implementation with PlaceAutocompleteElement
                await initNewAutocomplete();
            }
        } catch (error) {
            console.error('Error initializing Google Places:', error);
            createFallbackInput();
        }
    };

    const initLegacyAutocomplete = () => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error('Google Maps API not loaded');
            createFallbackInput();
            return;
        }

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.value = value || '';

        Object.assign(input.style, {
            ...defaultStyles,
            borderColor: hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)')
        });

        // Add mobile-specific attributes to prevent zoom
        input.setAttribute('autocomplete', 'address-line1');
        input.setAttribute('autocapitalize', 'words');
        input.setAttribute('autocorrect', 'on');

        // Store references
        addressInputRef.current = input;

        // Clear and append to container
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(input);
        }

        // Initialize autocomplete with more detailed fields
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'fr' },
            fields: [
                'formatted_address',
                'geometry',
                'address_components',
                'place_id',
                'name'
            ]
        });

        placeAutocompleteRef.current = autocomplete;

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('Legacy place selected:', place);

            if (place && place.formatted_address) {
                input.value = place.formatted_address;

                // Call the regular onChange callback
                if (onChange) {
                    onChange(place.formatted_address);
                }

                // Call the new onPlaceSelected callback with full details
                if (onPlaceSelected) {
                    onPlaceSelected(place);
                }
            }
        });

        // Handle manual input changes
        input.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            if (onChange) {
                onChange(inputValue);
            }
        });

        // Handle focus and blur events
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--border-focus)';
            input.style.outline = 'none';
            preventMobileZoom();
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)');
            setTimeout(restoreMobileZoom, 100);
        });
    };

    const initNewAutocomplete = async () => {
        // Request the places library
        await window.google.maps.importLibrary("places");

        // Create the new PlaceAutocompleteElement
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
            includedRegionCodes: ['fr'],
        });

        // Store reference for cleanup
        placeAutocompleteRef.current = placeAutocomplete;

        // Apply styles to the element
        Object.assign(placeAutocomplete.style, {
            ...defaultStyles,
            borderColor: hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)')
        });

        // Add mobile-specific attributes to prevent zoom
        placeAutocomplete.setAttribute('autocomplete', 'address-line1');
        placeAutocomplete.setAttribute('autocapitalize', 'words');
        placeAutocomplete.setAttribute('autocorrect', 'on');

        // Append the new element safely
        if (containerRef.current) {
            containerRef.current.innerHTML = ''; // Clear existing
            containerRef.current.appendChild(placeAutocomplete);
        }

        // Set initial value if provided
        if (value) {
            placeAutocomplete.value = value;
        }

        // Add the place selection listener
        placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
            try {
                const place = placePrediction.toPlace();

                // Fetch detailed fields including address components
                await place.fetchFields({
                    fields: [
                        'formattedAddress',
                        'addressComponents',
                        'id',
                        'displayName'
                    ]
                });

                const placeData = place.toJSON();
                const formattedAddress = placeData.formattedAddress;

                if (formattedAddress) {
                    // Update the visual value in the Google element
                    placeAutocomplete.value = formattedAddress;

                    // Call the regular onChange callback
                    if (onChange) {
                        onChange(formattedAddress);
                    }

                    // Call the new onPlaceSelected callback with full details
                    if (onPlaceSelected) {
                        // Convert modern format to legacy format for consistency
                        const legacyFormatPlace = {
                            formatted_address: placeData.formattedAddress,
                            place_id: placeData.id,
                            name: placeData.displayName,
                            address_components: placeData.addressComponents || []
                        };
                        onPlaceSelected(legacyFormatPlace);
                    }
                }
            } catch (error) {
                console.error('Error fetching place details:', error);
                if (onError) {
                    onError('Error fetching place details');
                }
            }
        });

        // Handle focus and blur events for styling and zoom prevention
        placeAutocomplete.addEventListener('focus', () => {
            placeAutocomplete.style.borderColor = 'var(--border-focus)';
            placeAutocomplete.style.outline = 'none';
            preventMobileZoom();
        });

        placeAutocomplete.addEventListener('blur', () => {
            placeAutocomplete.style.borderColor = hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)');
            setTimeout(restoreMobileZoom, 100);
        });

        // Handle manual input changes (when user types directly)
        placeAutocomplete.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            if (onChange) {
                onChange(inputValue);
            }
        });
    };

    const createFallbackInput = () => {
        // Create fallback input
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'text';
        fallbackInput.placeholder = placeholder;
        fallbackInput.value = value || '';

        Object.assign(fallbackInput.style, {
            ...defaultStyles,
            borderColor: hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)')
        });

        // Add mobile-specific attributes to prevent zoom
        fallbackInput.setAttribute('autocomplete', 'address-line1');
        fallbackInput.setAttribute('autocapitalize', 'words');
        fallbackInput.setAttribute('autocorrect', 'on');

        fallbackInput.addEventListener('input', (e) => {
            if (onChange) {
                onChange(e.target.value);
            }
        });

        fallbackInput.addEventListener('focus', () => {
            fallbackInput.style.borderColor = 'var(--border-focus)';
            preventMobileZoom();
        });

        fallbackInput.addEventListener('blur', () => {
            fallbackInput.style.borderColor = hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)');
            setTimeout(restoreMobileZoom, 100);
        });

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(fallbackInput);
        }
    };

    // Legacy Google Maps Script
    const loadGoogleMapsScript = () => {
        // If already loaded, return resolved promise
        if (window.google && window.google.maps && window.google.maps.places) {
            return Promise.resolve();
        }

        // If already loading, return existing promise
        if (isGoogleMapsLoading && googleMapsLoadPromise) {
            return googleMapsLoadPromise;
        }

        // Check if script already exists in DOM
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            return new Promise((resolve) => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    resolve();
                } else {
                    existingScript.onload = () => resolve();
                }
            });
        }

        // Create new script
        isGoogleMapsLoading = true;
        googleMapsLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                isGoogleMapsLoading = false;
                resolve();
            };

            script.onerror = () => {
                isGoogleMapsLoading = false;
                reject(new Error('Failed to load Google Maps script'));
            };

            document.head.appendChild(script);
        });

        return googleMapsLoadPromise;
    };

    const loadGoogleMaps = async () => {
        // Check if Google Maps integration is enabled
        const googleMapsEnabled = await isIntegrationEnabled('google-maps');
        setIsGoogleMapsEnabled(googleMapsEnabled);
        
        // If not enabled or no API key, use fallback
        if (!googleMapsEnabled || !apiKey) {
            console.warn(googleMapsEnabled ? 'Google Maps API key not provided' : 'Google Maps integration not enabled', ', using fallback input');
            createFallbackInput();
            if (onError) {
                onError(googleMapsEnabled ? 'Google Maps API key not provided' : 'Google Maps integration not enabled');
            }
            return;
        }

        // Skip if already loaded and initialized
        if (isLoadedRef.current) {
            initGooglePlaces();
            return;
        }

        if (shouldUseLegacy()) {
            // Use legacy script loading
            loadGoogleMapsScript()
                .then(() => {
                    isLoadedRef.current = true;
                    initGooglePlaces();
                })
                .catch(err => {
                    console.warn('Failed to load Google Maps:', err);
                    createFallbackInput();
                    if (onError) {
                        onError('Failed to load Google Maps');
                    }
                });
        } else {
            // Use modern loader
            const loader = new Loader({
                apiKey: apiKey,
                version: 'weekly',
                libraries: ['places'],
            });

            loader.load()
                .then(() => {
                    isLoadedRef.current = true;
                    initGooglePlaces();
                })
                .catch(err => {
                    console.warn('Failed to load Google Maps:', err);
                    createFallbackInput();
                    if (onError) {
                        onError('Failed to load Google Maps');
                    }
                });
        }
    };

    // Handle input change for legacy mode
    const handleInputChange = (e) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    useEffect(() => {
        const initMaps = async () => {
            await loadGoogleMaps();
        };
        initMaps();

        return () => {
            if (placeAutocompleteRef.current) {
                try {
                    if (shouldUseLegacy()) {
                        // Legacy cleanup
                        window.google.maps.event.clearInstanceListeners(placeAutocompleteRef.current);
                    } else {
                        // Modern cleanup
                        placeAutocompleteRef.current.remove();
                    }
                } catch (err) {
                    console.warn('Cleanup error:', err);
                }
            }
        };
    }, [apiKey, legacy]); // Dependencies include apiKey and legacy

    // Update error styling when hasError prop changes
    useEffect(() => {
        const updateErrorStyle = () => {
            if (shouldUseLegacy() && addressInputRef.current) {
                addressInputRef.current.style.borderColor = hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)');
            } else if (!shouldUseLegacy() && placeAutocompleteRef.current) {
                placeAutocompleteRef.current.style.borderColor = hasError ? '#ef4444' : (defaultStyles.borderColor || 'var(--border)');
            }
        };

        updateErrorStyle();
    }, [hasError, defaultStyles.borderColor, legacy]);

    // Update value when prop changes
    useEffect(() => {
        if (shouldUseLegacy() && addressInputRef.current && addressInputRef.current.value !== value) {
            addressInputRef.current.value = value || '';
        } else if (!shouldUseLegacy() && placeAutocompleteRef.current && placeAutocompleteRef.current.value !== value) {
            placeAutocompleteRef.current.value = value || '';
        }
    }, [value, legacy]);

    return (
        <div ref={containerRef} className="google-places-input-container">
            {/* Container will be populated by JavaScript */}
        </div>
    );
};

export default GooglePlacesInput;
