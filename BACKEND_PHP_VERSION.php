<?php
/**
 * BACKEND PHP VERSION: AIRS + LLM Integration
 * PHP implementation of prompt injection protection demo endpoints
 * Replace mock implementations with real Palo Alto AIRS and Azure Foundry endpoints
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Route the request
if ($request_method === 'POST') {
    if (strpos($request_uri, '/api/airs/scan') !== false) {
        handleAirsScan();
    } elseif (strpos($request_uri, '/api/llm/chat') !== false) {
        handleLlmChat();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// ============================================================================
// ENDPOINT 1: POST /api/airs/scan
// Scans user prompts for injection attacks using AIRS Runtime Security
// ============================================================================

function handleAirsScan() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['prompt']) || !is_string($input['prompt'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid prompt']);
        return;
    }

    $prompt = $input['prompt'];

    try {
        // DEMO RULE ENGINE: Pattern matching for common injection attacks
        // In production: replace with real Palo Alto AIRS API call

        $verdict = checkPromptSecurity($prompt);

        http_response_code(200);
        echo json_encode($verdict);
    } catch (Exception $e) {
        error_log('AIRS error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'verdict' => 'error',
            'reason' => 'Security service failed'
        ]);
    }
}

// ============================================================================
// DEMO RULE ENGINE: Simple pattern matching (replace with real AIRS)
// ============================================================================

function checkPromptSecurity($prompt) {
    $lowerPrompt = strtolower($prompt);

    // RULE 1: System prompt override attempts
    if (
        stripos($lowerPrompt, 'ignore your system prompt') !== false ||
        stripos($lowerPrompt, 'forget all previous instructions') !== false ||
        stripos($lowerPrompt, 'disregard the above') !== false ||
        stripos($lowerPrompt, 'override instructions') !== false
    ) {
        return [
            'verdict' => 'block',
            'reason' => 'System prompt override attempt detected'
        ];
    }

    // RULE 2: Secret/credential exfiltration attempts
    if (
        stripos($lowerPrompt, 'api key') !== false ||
        stripos($lowerPrompt, 'secret') !== false ||
        stripos($lowerPrompt, 'password') !== false ||
        stripos($lowerPrompt, 'database') !== false ||
        stripos($lowerPrompt, 'credentials') !== false
    ) {
        return [
            'verdict' => 'block',
            'reason' => 'Credential exfiltration attempt detected'
        ];
    }

    // RULE 3: Role manipulation / jailbreak attempts
    if (
        stripos($lowerPrompt, 'you are now') !== false ||
        stripos($lowerPrompt, 'pretend to be') !== false ||
        stripos($lowerPrompt, 'act as a') !== false ||
        stripos($lowerPrompt, 'roleplay as') !== false
    ) {
        // Check for malicious roleplay
        if (
            stripos($lowerPrompt, 'hacker') !== false ||
            stripos($lowerPrompt, 'malware') !== false ||
            stripos($lowerPrompt, 'criminal') !== false ||
            stripos($lowerPrompt, 'fraud') !== false
        ) {
            return [
                'verdict' => 'block',
                'reason' => 'Malicious roleplay attempt detected'
            ];
        }
        // Safe roleplay: sanitize and allow
        return [
            'verdict' => 'sanitize',
            'sanitized_prompt' => sanitizeRoleplay($prompt),
            'reason' => 'Roleplay sanitized to ensure safety'
        ];
    }

    // RULE 4: Context reset / prompt reframing
    if (
        stripos($lowerPrompt, '[reset') !== false ||
        stripos($lowerPrompt, 'reset context') !== false ||
        stripos($lowerPrompt, 'new conversation') !== false ||
        stripos($lowerPrompt, 'start over') !== false
    ) {
        // Context resets that imply bypassing security are blocked
        if (
            stripos($lowerPrompt, 'forget') !== false &&
            (stripos($lowerPrompt, 'security') !== false || stripos($lowerPrompt, 'restriction') !== false)
        ) {
            return [
                'verdict' => 'block',
                'reason' => 'Security bypass attempt via context reset'
            ];
        }
    }

    // RULE 5: Hypothetical jailbreak scenarios
    if (
        stripos($lowerPrompt, 'in a hypothetical') !== false ||
        stripos($lowerPrompt, 'suppose') !== false ||
        stripos($lowerPrompt, 'imagine') !== false
    ) {
        if (
            stripos($lowerPrompt, 'bypass') !== false ||
            stripos($lowerPrompt, 'circumvent') !== false ||
            stripos($lowerPrompt, 'hack') !== false ||
            stripos($lowerPrompt, 'exploit') !== false
        ) {
            // Hypothetical security/bypass questions are sanitized
            return [
                'verdict' => 'sanitize',
                'sanitized_prompt' => sanitizeHypothetical($prompt),
                'reason' => 'Hypothetical sanitized to prevent security discussion'
            ];
        }
    }

    // DEFAULT: Prompt is safe
    return [
        'verdict' => 'allow',
        'reason' => 'Prompt passed security checks'
    ];
}

// ============================================================================
// SANITIZATION FUNCTIONS (helpers for demo)
// ============================================================================

function sanitizeRoleplay($prompt) {
    // Remove specific role definitions that imply malicious intent
    $patterns = [
        '/you are now a? (hacker|malware|criminal|fraud).*/i',
        '/act as a? (hacker|malware|criminal|fraud).*/i'
    ];
    $replacement = 'you are a helpful assistant';

    return preg_replace($patterns, $replacement, $prompt);
}

function sanitizeHypothetical($prompt) {
    // Convert security discussion to generic safety question
    $patterns = ['bypass', 'circumvent', 'hack', 'exploit'];
    $replacement = 'improve security';

    return str_ireplace($patterns, $replacement, $prompt);
}

// ============================================================================
// ENDPOINT 2: POST /api/llm/chat
// Forwards sanitized/approved prompts to Azure Foundry (or mock response)
// ============================================================================

function handleLlmChat() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['prompt']) || !is_string($input['prompt'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid prompt']);
        return;
    }

    $prompt = $input['prompt'];
    $airsEnabled = isset($input['airsEnabled']) ? $input['airsEnabled'] : true;

    try {
        // PRODUCTION: Call Azure Foundry / OpenAI API
        // $response = callAzureFoundry($prompt);

        // DEMO: Return mock response based on prompt content
        $response = generateMockResponse($prompt);

        http_response_code(200);
        echo json_encode(['response' => $response]);
    } catch (Exception $e) {
        error_log('LLM error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => 'LLM service unavailable',
            'response' => 'I apologize, but I cannot generate a response at this time.'
        ]);
    }
}

// ============================================================================
// MOCK LLM RESPONSE GENERATOR (for demo)
// Replace with real Azure Foundry call in production
// ============================================================================

function generateMockResponse($prompt) {
    $lowerPrompt = strtolower($prompt);

    // Product questions
    if (stripos($lowerPrompt, 'product') !== false || stripos($lowerPrompt, 'item') !== false) {
        return 'We have 6 great items available: Minimal Hoodie ($49.99), Everyday Sneakers ($79.99), Slim Jeans ($59.99), Casual Shirt ($39.99), Eco Tote ($19.99), and Beanie ($14.99). What interests you?';
    }

    // Pricing/cost
    if (stripos($lowerPrompt, 'price') !== false || stripos($lowerPrompt, 'cost') !== false || stripos($lowerPrompt, 'cheap') !== false) {
        return 'Our items range from $14.99 to $79.99. Everything is designed with minimalist aesthetics and quality in mind. Would you like specific pricing information?';
    }

    // Shipping
    if (stripos($lowerPrompt, 'ship') !== false || stripos($lowerPrompt, 'delivery') !== false) {
        return 'We offer free shipping on orders over $50. Standard delivery takes 3-5 business days. We also offer expedited options at checkout.';
    }

    // Returns/policy
    if (stripos($lowerPrompt, 'return') !== false || stripos($lowerPrompt, 'refund') !== false || stripos($lowerPrompt, 'policy') !== false) {
        return 'We have a 30-day return policy. If you\'re not satisfied, return the item in original condition for a full refund. No questions asked.';
    }

    // Size/fit
    if (stripos($lowerPrompt, 'size') !== false || stripos($lowerPrompt, 'fit') !== false) {
        return 'Sizing varies by product. Clothing (Hoodie, Shirt) uses S/M/L. Sneakers use EU sizes (40-43). Jeans use waist sizes (30/32/34). Check the product page for exact options.';
    }

    // General greeting
    if (stripos($lowerPrompt, 'hi') !== false || stripos($lowerPrompt, 'hello') !== false || stripos($lowerPrompt, 'hey') !== false) {
        return 'Hello! Welcome to our store. I\'m here to help you find the perfect item or answer any questions about our products, shipping, and policies.';
    }

    // Default shopping-focused response
    return 'I\'m here to help with any questions about our products, sizing, shipping, returns, or anything else related to shopping with us. What can I assist with?';
}

// ============================================================================
// PRODUCTION INTEGRATION FUNCTIONS (replace with real API calls)
// ============================================================================

/**
 * STEP 1: CONNECT REAL PALO ALTO AIRS API
 * Replace checkPromptSecurity() with this function
 */
function scanWithAIRS($prompt) {
    $airsApiKey = getenv('AIRS_API_KEY');

    $data = json_encode([
        'prompt' => $prompt,
        'model' => 'injection-detection-v1',
        'sensitivity' => 'high'
    ]);

    $ch = curl_init('https://airs-api.paloaltonetworks.com/v1/scan');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $airsApiKey,
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('AIRS API request failed');
    }

    $response = json_decode($result, true);

    return [
        'verdict' => $response['status'], // 'allow', 'block', 'sanitize'
        'reason' => $response['details'],
        'sanitized_prompt' => isset($response['sanitized']) ? $response['sanitized'] : null
    ];
}

/**
 * STEP 2: CONNECT REAL AZURE FOUNDRY LLM
 * Replace generateMockResponse() with this function
 */
function callAzureFoundry($prompt) {
    $azureKey = getenv('AZURE_FOUNDRY_KEY');
    $azureUrl = getenv('AZURE_FOUNDRY_URL');

    $systemPrompt = file_get_contents(__DIR__ . '/SYSTEM_PROMPT.txt');

    $data = json_encode([
        'model' => 'gpt-4',
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 500
    ]);

    $ch = curl_init($azureUrl . '/v1/chat/completions');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'api-key: ' . $azureKey,
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Azure Foundry API request failed');
    }

    $response = json_decode($result, true);

    return $response['choices'][0]['message']['content'];
}

/**
 * USAGE INSTRUCTIONS:
 *
 * 1. Save this file as: api.php (or backend.php)
 *
 * 2. Configure .htaccess for clean URLs (optional):
 *    RewriteEngine On
 *    RewriteCond %{REQUEST_FILENAME} !-f
 *    RewriteCond %{REQUEST_FILENAME} !-d
 *    RewriteRule ^api/(.*)$ api.php [L,QSA]
 *
 * 3. Set environment variables:
 *    - AIRS_API_KEY=your-palo-alto-airs-key
 *    - AZURE_FOUNDRY_KEY=your-azure-key
 *    - AZURE_FOUNDRY_URL=https://your-foundry.openai.azure.com
 *
 * 4. For production, replace:
 *    - checkPromptSecurity() with scanWithAIRS()
 *    - generateMockResponse() with callAzureFoundry()
 *
 * 5. Update your React frontend to point to this PHP backend:
 *    fetch('https://yoursite.com/api/airs/scan', { ... })
 */
