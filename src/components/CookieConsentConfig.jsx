const getConfig = (translations = {}) => {
    const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-XXXXXXX";

    // Google Analytics loading function
    const loadGoogleAnalytics = () => {
        if (document.getElementById("ga-script")) return;

        const script = document.createElement("script");
        script.id = "ga-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", GA_ID);
    };

    // Google Analytics removal function
    const removeGoogleAnalytics = () => {
        const script = document.getElementById("ga-script");
        if (script) {
            script.remove();
        }
        // Clear GA globals
        delete window.gtag;
        delete window.dataLayer;

        // Clear GA cookies
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.startsWith("_ga") || name.startsWith("_gid")) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
        });
    };

    const config = {
        // root: 'body',
        // autoShow: true,
        // disablePageInteraction: true,
        // hideFromBots: true,
        // mode: 'opt-in',
        // revision: 0,

        cookie: {
            // name: 'cc_cookie',
            // domain: location.hostname,
            // path: '/',
            // sameSite: "Lax",
            // expiresAfterDays: 365,
        },

        /**
         * Callback functions
         */
        onFirstConsent: ({ cookie }) => {
            console.log('onFirstConsent fired', cookie);

            // Load Google Analytics if analytics category is accepted
            if (cookie.categories.includes('analytics')) {
                loadGoogleAnalytics();
            }
        },

        onConsent: ({ cookie }) => {
            console.log('onConsent fired!', cookie);

            // Load Google Analytics if analytics category is accepted
            if (cookie.categories.includes('analytics')) {
                loadGoogleAnalytics();
            }
        },

        onChange: ({ changedCategories, changedServices, cookie }) => {
            console.log('onChange fired!', changedCategories, changedServices);

            // Handle analytics category changes
            if (changedCategories.includes('analytics')) {
                // Check if analytics is now accepted or rejected
                if (cookie.categories.includes('analytics')) {
                    loadGoogleAnalytics();
                } else {
                    removeGoogleAnalytics();
                }
            }
        },

        onModalReady: ({ modalName }) => {
            console.log('ready:', modalName);
        },

        onModalShow: ({ modalName }) => {
            console.log('visible:', modalName);
        },

        onModalHide: ({ modalName }) => {
            console.log('hidden:', modalName);
        },

        // https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
        guiOptions: {
            consentModal: {
                layout: 'cloud inline',
                position: 'bottom',
                equalWeightButtons: true,
                flipButtons: false,
            },
            preferencesModal: {
                layout: 'box',
                equalWeightButtons: true,
                flipButtons: false,
            },
        },

        categories: {
            necessary: {
                enabled: true, // this category is enabled by default
                readOnly: true, // this category cannot be disabled
            },
            analytics: {
                autoClear: {
                    cookies: [
                        {
                            name: /^_ga/, // regex: match all cookies starting with '_ga'
                        },
                        {
                            name: '_gid', // string: exact cookie name
                        },
                    ],
                },

                // https://cookieconsent.orestbida.com/reference/configuration-reference.html#category-services
                services: {
                    ga: {
                        label: 'Google Analytics',
                        onAccept: () => {
                            loadGoogleAnalytics();
                        },
                        onReject: () => {
                            removeGoogleAnalytics();
                        },
                    },
                    youtube: {
                        label: 'Youtube Embed',
                        onAccept: () => {},
                        onReject: () => {},
                    },
                },
            },
            ads: {},
        },

        language: {
            default: 'en',
            translations: {
                en: {
                    consentModal: {
                        title: translations.consentModal?.title || '🍪 We use cookies',
                        description: translations.consentModal?.description || 'We use cookies to improve your experience. Manage your preferences below.',
                        acceptAllBtn: translations.consentModal?.acceptAllBtn || 'Accept all',
                        acceptNecessaryBtn: translations.consentModal?.acceptNecessaryBtn || 'Reject all',
                        showPreferencesBtn: translations.consentModal?.showPreferencesBtn || 'Manage Individual preferences',
                        footer: `<a href="/privacy-policy" target="_blank">${translations.consentModal?.footer || 'Privacy Policy'}</a>`,
                    },
                    preferencesModal: {
                        title: translations.preferencesModal?.title || 'Manage cookie preferences',
                        acceptAllBtn: translations.preferencesModal?.acceptAllBtn || 'Accept all',
                        acceptNecessaryBtn: translations.preferencesModal?.acceptNecessaryBtn || 'Reject all',
                        savePreferencesBtn: translations.preferencesModal?.savePreferencesBtn || 'Accept current selection',
                        closeIconLabel: translations.preferencesModal?.closeIconLabel || 'Close modal',
                        serviceCounterLabel: translations.preferencesModal?.serviceCounterLabel || 'Service|Services',
                        sections: [
                            {
                                title: translations.preferencesModal?.sections?.privacyChoices?.title || 'Your Privacy Choices',
                                description: translations.preferencesModal?.sections?.privacyChoices?.description || 'In this panel you can express some preferences related to the processing of your personal information. You may review and change expressed choices at any time by resurfacing this panel via the provided link. To deny your consent to the specific processing activities described below, switch the toggles to off or use the "Reject all" button and confirm you want to save your choices.',
                            },
                            {
                                title: translations.preferencesModal?.sections?.necessary?.title || 'Strictly Necessary',
                                description: translations.preferencesModal?.sections?.necessary?.description || 'These cookies are essential for the proper functioning of the website and cannot be disabled.',
                                linkedCategory: 'necessary',
                            },
                            {
                                title: translations.preferencesModal?.sections?.analytics?.title || 'Performance and Analytics',
                                description: translations.preferencesModal?.sections?.analytics?.description || 'These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.',
                                linkedCategory: 'analytics',
                                cookieTable: {
                                    caption: translations.preferencesModal?.cookieTable?.caption || 'Cookie table',
                                    headers: {
                                        name: translations.preferencesModal?.cookieTable?.headers?.name || 'Cookie',
                                        domain: translations.preferencesModal?.cookieTable?.headers?.domain || 'Domain',
                                        desc: translations.preferencesModal?.cookieTable?.headers?.desc || 'Description',
                                    },
                                    body: [
                                        {
                                            name: '_ga',
                                            domain: location.hostname,
                                            desc: translations.preferencesModal?.cookieTable?.cookies?.ga || 'Google Analytics tracking cookie',
                                        },
                                        {
                                            name: '_gid',
                                            domain: location.hostname,
                                            desc: translations.preferencesModal?.cookieTable?.cookies?.gid || 'Google Analytics identifier cookie',
                                        },
                                    ],
                                },
                            },
                            {
                                title: translations.preferencesModal?.sections?.advertising?.title || 'Targeting and Advertising',
                                description: translations.preferencesModal?.sections?.advertising?.description || 'These cookies are used to make advertising messages more relevant to you and your interests. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.',
                                linkedCategory: 'ads',
                            },
                            {
                                title: translations.preferencesModal?.sections?.moreInfo?.title || 'More information',
                                description: translations.preferencesModal?.sections?.moreInfo?.description || 'For any queries in relation to my policy on cookies and your choices, please <a href="/privacy-policy">contact us</a>',
                            },
                        ],
                    },
                },
            },
        },
    };

    return config;
};

export default getConfig;
