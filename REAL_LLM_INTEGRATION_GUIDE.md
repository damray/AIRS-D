# LLM Integration Guide

## How It Works

Le système est **déjà configuré** pour router automatiquement vers différents modèles LLM. Il suffit de configurer vos clés API dans `.env`.

## Configuration Rapide

Éditez `.env` et ajoutez une ou plusieurs clés:

### Vertex AI (Google Gemini)
```env
VITE_VERTEX_PROJECT_ID=votre-projet-id
VITE_VERTEX_LOCATION=us-central1
VITE_VERTEX_API_KEY=votre-cle-api
```

### Anthropic (Claude)
```env
VITE_ANTHROPIC_API_KEY=votre-cle-anthropic
```

### Azure OpenAI
```env
VITE_AZURE_OPENAI_ENDPOINT=https://votre-resource.openai.azure.com
VITE_AZURE_OPENAI_API_KEY=votre-cle-azure
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### Ollama (Local)
```env
VITE_OLLAMA_PROXY_PATH=/ollama
```

## C'est Tout!

Le menu déroulant dans le chatbot affiche automatiquement les modèles configurés. Sélectionnez un modèle et le système appelle la bonne fonction:

- **Vertex AI** → `callVertexAI()` dans `src/services/llmService.ts`
- **Anthropic** → `callAnthropic()`
- **Azure OpenAI** → `callOpenAI()`
- **Ollama** → `callOllama()`
- **Mock** → `mockLLMResponse()` (toujours disponible)

## Ajouter un Nouveau Modèle

Éditez `src/config/models.config.ts`:

```typescript
{
  id: 'mon-modele',
  name: 'Mon Modèle Custom',
  provider: 'custom',
  apiUrl: 'https://api.monprovider.com/v1/chat',
  apiKey: import.meta.env.VITE_MON_API_KEY,
  model: 'nom-du-modele',
  enabled: !!import.meta.env.VITE_MON_API_KEY,
  description: 'Description de mon modèle',
  requestFormat: 'openai'  // ou 'vertex', 'anthropic', 'ollama'
}
```

Puis ajoutez dans `.env`:
```env
VITE_MON_API_KEY=ma-cle-api
```

## Architecture

```
Utilisateur sélectionne modèle dans dropdown
            ↓
Chatbot.tsx appelle callLLM(prompt, selectedModel)
            ↓
llmService.ts route selon model.requestFormat
            ↓
      [Fonction appropriée]
       /      |      |      \
  Vertex  Anthropic Azure  Ollama
```

Pas besoin de backend séparé - tout est géré en frontend avec routage automatique.
