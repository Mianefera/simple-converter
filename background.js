const API_ENDPOINTS = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json',
    'https://latest.currency-api.pages.dev/v1/currencies.min.json',
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json',
    'https://latest.currency-api.pages.dev/v1/currencies.json'
];

const CURRENCIES_TTL = 30 * 24 * 60 * 60 * 1000;

async function fetchCurrencies() {
    for (const endpoint of API_ENDPOINTS) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(response.status);
            }
            return await response.json();
        } catch (error) {
            console.error(`Currency fetch from endpoint "${endpoint}" failed: ${error}`);
        }
    }
    throw new Error('Currency fetch from all endpoints failed');
}

async function updateCurrenciesIfNeeded() {

}