'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import getConfig from './CookieConsentConfig';

const CookieConsentComponent = () => {
    const t = useTranslations('GDPR');

    const ResetCookieConsent = () => {
        CookieConsent.reset(true);
        CookieConsent.run(getConfig(t));
    };

    useEffect(() => {
        // Make CookieConsent available globally for the config callbacks
        window.CookieConsent = CookieConsent;

        CookieConsent.run(getConfig(t));

        // Cleanup
        return () => {
            delete window.CookieConsent;
        };
    }, [t]);

  /*
  return ( <div>
            <button type="button" onClick={CookieConsent.showPreferences}>
                Manage cookie preferences
            </button>
            <button type="button" onClick={ResetCookieConsent}>
                Reset cookie consent
            </button>
     </div>
    );
   */

    return <></>;
};

export default CookieConsentComponent;
