# Guide de Déploiement PHP (Optionnel)

**Note:** Ce guide est optionnel. Le système fonctionne en frontend pur avec les LLM configurés dans `.env`.

Utilisez ce backend PHP seulement si vous voulez:
- Cacher vos clés API côté serveur
- Avoir un contrôle centralisé des appels LLM
- Implanter du rate limiting

## Installation Rapide

1. **Copiez le fichier**
   ```bash
   cp BACKEND_PHP_VERSION.php /var/www/html/api.php
   ```

2. **Configurez .htaccess**
   ```apache
   RewriteEngine On
   RewriteRule ^api/(.*)$ api.php [L,QSA]
   ```

3. **Ajoutez vos clés dans php.ini ou Apache config**
   ```ini
   env[OPENAI_API_KEY] = "votre-cle"
   env[AIRS_API_KEY] = "votre-cle-airs"
   ```

## Prérequis

- PHP 7.4+
- Extension cURL
- Apache/Nginx avec mod_rewrite

## Tests

```bash
curl -X POST https://yoursite.com/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What products do you have?"}'
```

## Dépannage

- **cURL manquant:** `sudo apt-get install php-curl`
- **CORS:** Vérifiez `Access-Control-Allow-Origin` dans le PHP
- **404:** Vérifiez que mod_rewrite est activé

Pour plus de détails, consultez `BACKEND_PHP_VERSION.php`
