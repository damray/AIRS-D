# Rate Limiting & Retry Logic Guide

## Overview

Le système gère automatiquement les **rate limits (429)** et **service unavailable (503)** avec retry automatique et exponential backoff.

## Architecture

```
Frontend (Chat) → Backend API → Rate Limiter → LLM Provider
                                      ↓
                                  Retry Logic
                                      ↓
                                Auto Backoff
```

## Configuration

### Variables d'environnement (.env)

```env
# Nombre max de tentatives avant échec
RATE_LIMIT_MAX_RETRIES=3

# Délai initial en millisecondes
RATE_LIMIT_INITIAL_DELAY=1000

# Délai maximum en millisecondes
RATE_LIMIT_MAX_DELAY=60000

# Multiplicateur pour exponential backoff
RATE_LIMIT_BACKOFF_MULTIPLIER=2
```

### Valeurs par défaut
- **Max retries**: 3
- **Initial delay**: 1000ms (1 seconde)
- **Max delay**: 60000ms (1 minute)
- **Backoff multiplier**: 2 (double à chaque retry)

## Fonctionnement

### 1. Détection automatique du 429

Quand un LLM retourne code **429 (Rate Limit Exceeded)**:
```
Tentative 1 → 429 → Attendre 1s → Retry
Tentative 2 → 429 → Attendre 2s → Retry
Tentative 3 → 429 → Attendre 4s → Retry
Tentative 4 → 429 → Échec final
```

### 2. Respect du header `Retry-After`

Si l'API retourne `Retry-After: 30`, le système attend **exactement 30 secondes** avant de réessayer.

### 3. État global par provider

Le rate limiter maintient un état en mémoire:
```javascript
{
  'anthropic': { resetTime: 1699999999, retryAfter: 5000 },
  'vertex': { resetTime: 1700000000, retryAfter: 2000 }
}
```

**Avantage**: Si Claude est rate limited, les requêtes suivantes attendent automatiquement sans faire d'appel inutile.

## API Endpoints

### GET /api/models/available

Retourne les modèles configurés + état des rate limits:

```json
{
  "models": [
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet (Anthropic)",
      "provider": "anthropic",
      "model": "claude-3-sonnet-20240229",
      "enabled": true,
      "configured": true
    }
  ],
  "capabilities": {
    "anthropic": {
      "supportsStreaming": true,
      "maxTokens": 200000,
      "rateLimitInfo": "Tier-based rate limits"
    }
  },
  "rateLimitConfig": {
    "maxRetries": 3,
    "initialDelay": 1000,
    "maxDelay": 60000,
    "backoffMultiplier": 2
  },
  "currentRateLimits": {
    "anthropic": {
      "isLimited": true,
      "retryAfter": 4523,
      "resetTime": "2024-11-15T10:30:45.123Z"
    }
  }
}
```

### GET /api/rate-limits

État actuel de tous les rate limits:

```json
{
  "rateLimits": {
    "vertex": {
      "isLimited": false,
      "retryAfter": 0,
      "resetTime": null
    },
    "anthropic": {
      "isLimited": true,
      "retryAfter": 2345,
      "resetTime": "2024-11-15T10:25:12.456Z"
    }
  },
  "config": {
    "maxRetries": 3,
    "initialDelay": 1000,
    "maxDelay": 60000,
    "backoffMultiplier": 2
  }
}
```

### POST /api/rate-limits/clear

Efface tous les rate limits (utile pour testing):

```bash
curl -X POST http://localhost:3001/api/rate-limits/clear
```

Response:
```json
{
  "message": "All rate limits cleared successfully"
}
```

## Frontend Integration

### 1. Chargement automatique des modèles

Au démarrage, le chat appelle `/api/models/available` et affiche uniquement les modèles **réellement configurés**.

### 2. Affichage visuel des rate limits

Dans le dropdown de sélection de modèle:
- **Modèle disponible**: Texte noir
- **Modèle rate limited**: Texte grisé + ⏱️ countdown

### 3. Retry transparent

L'utilisateur ne voit **rien** pendant les retries. Le chat affiche juste:
```
"⏳ Claude 3 Sonnet rate limited, retrying automatically..."
```

## Logs Backend

```
⚠️ Rate limit (429) on anthropic, retry 1/3 in 1000ms
⏱️ Rate limit applied to anthropic: retry in 1000ms
⏳ anthropic rate limited, waiting 1000ms...
✅ anthropic succeeded after 1 retries
```

## Codes d'erreur gérés

| Code | Description | Action |
|------|-------------|--------|
| 429  | Rate Limit Exceeded | Retry avec backoff |
| 503  | Service Unavailable | Retry avec backoff |
| 500  | Internal Server Error | Échec immédiat |
| 401  | Unauthorized | Échec immédiat (clé invalide) |
| 404  | Not Found | Échec immédiat |

## Exemples de configuration

### Configuration aggressive (retry rapide)
```env
RATE_LIMIT_MAX_RETRIES=5
RATE_LIMIT_INITIAL_DELAY=500
RATE_LIMIT_MAX_DELAY=10000
RATE_LIMIT_BACKOFF_MULTIPLIER=1.5
```

### Configuration conservative (retry lent)
```env
RATE_LIMIT_MAX_RETRIES=2
RATE_LIMIT_INITIAL_DELAY=5000
RATE_LIMIT_MAX_DELAY=120000
RATE_LIMIT_BACKOFF_MULTIPLIER=3
```

### Configuration production recommandée
```env
RATE_LIMIT_MAX_RETRIES=3
RATE_LIMIT_INITIAL_DELAY=2000
RATE_LIMIT_MAX_DELAY=60000
RATE_LIMIT_BACKOFF_MULTIPLIER=2
```

## Testing

### Simuler un 429
```javascript
// Dans server/index.js, ajouter temporairement:
if (Math.random() < 0.5) {
  const error = new Error('Rate limit test');
  error.status = 429;
  error.retryAfter = 5;
  throw error;
}
```

### Vérifier les retries
```bash
# Logs du backend montreront:
docker-compose logs -f backend | grep "Rate limit"
```

### Tester le clear
```bash
curl -X POST http://localhost:3001/api/rate-limits/clear
curl http://localhost:3001/api/rate-limits
```

## Limitations

1. **État en mémoire**: Les rate limits sont perdus au redémarrage du backend
2. **Par provider**: Un rate limit sur Claude affecte TOUS les modèles Claude
3. **Pas de queue**: Les requêtes ne sont pas mises en file d'attente

## Améliorations futures possibles

- Persistance des rate limits en Redis
- Queue système avec priorités
- Rate limiting proactif basé sur les quotas
- Métriques et alerting
