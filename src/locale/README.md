# 🌍 Modular Translation System

This project uses a **modular internationalization system** with **next-intl** that automatically loads and merges translation files for better organization and maintainability.

## 📁 File Structure

```
src/locale/
├── requests.js          # Auto-loader configuration
├── en/                  # English translations
│   ├── HomePage.json    # Home page translations
│   ├── Shop.json        # Shop/e-commerce translations
│   ├── Cart.json        # Shopping cart translations
│   ├── Checkout.json    # Checkout process translations
│   ├── GDPR.json        # Cookie consent translations
│   └── Auth.json        # Authentication translations
└── fr/                  # French translations
    ├── HomePage.json    # Same structure as English
    ├── Shop.json
    ├── Cart.json
    ├── Checkout.json
    ├── GDPR.json
    └── Auth.json
```

## ✨ Features

- **🔄 Auto-Loading**: Automatically discovers and loads all `.json` files in language folders
- **📦 Modular**: Split translations by feature/page for better organization
- **🔀 Auto-Merging**: Combines all translation files into a single object
- **🚀 Performance**: Efficient loading with detailed console logging
- **🛡️ Error Handling**: Graceful handling of missing files or parsing errors

## 🎯 How It Works

The `requests.js` file contains a `loadTranslations()` function that:

1. **Scans** the language directory (e.g., `src/locale/fr/`)
2. **Finds** all `.json` files in that directory
3. **Loads** each file and parses the JSON content
4. **Merges** all translations into a single object
5. **Returns** the combined translations to next-intl

## 📝 Usage in Components

```jsx
import { useTranslations } from 'next-intl';

function MyComponent() {
    const t = useTranslations('HomePage');
    const shopT = useTranslations('Shop');
    const authT = useTranslations('Auth');
    
    return (
        <div>
            <h1>{t('title')}</h1>
            <button>{shopT('addToCart')}</button>
            <a href="/login">{authT('login')}</a>
        </div>
    );
}
```

## ➕ Adding New Translation Modules

1. **Create the English file**: `src/locale/en/NewModule.json`
```json
{
    "NewModule": {
        "key1": "English value",
        "key2": "Another English value"
    }
}
```

2. **Create the French file**: `src/locale/fr/NewModule.json`
```json
{
    "NewModule": {
        "key1": "Valeur française",
        "key2": "Autre valeur française"
    }
}
```

3. **Use in components**:
```jsx
const t = useTranslations('NewModule');
return <p>{t('key1')}</p>;
```

The new module will be **automatically discovered and loaded** without any configuration changes!

## 🔧 Configuration

The current locale is set in `requests.js`:

```javascript
const locale = 'fr'; // Change this to 'en' for English
```

## 📊 Console Output

When translations load, you'll see helpful console logs:

```
✅ Loaded translations from: HomePage.json
✅ Loaded translations from: Shop.json
✅ Loaded translations from: Cart.json
✅ Loaded translations from: Checkout.json
✅ Loaded translations from: GDPR.json
✅ Loaded translations from: Auth.json
🌍 Successfully loaded 6 translation files for locale: fr
```

## 🎨 Benefits

- **Maintainability**: Easy to find and edit specific translations
- **Team Collaboration**: Multiple team members can work on different translation files
- **Modularity**: Each feature has its own translation file
- **Scalability**: Easy to add new languages and modules
- **Auto-Discovery**: No need to manually register new translation files

## 🌐 Adding New Languages

To add a new language (e.g., Spanish):

1. Create directory: `src/locale/es/`
2. Copy all `.json` files from `en/` to `es/`
3. Translate the content in each file
4. Update the locale in `requests.js` when needed

The system will automatically discover and load all files in any language directory!