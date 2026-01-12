async function fetchWithFallback(endpoints) {
    const errors = [];
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(response.status);
            }
            return await response.json();
        } catch (error) {
            errors.push(`${endpoint} : ${error.message}`);
        }
    }
    throw new Error("Failed to fetch all API endpoints\n" + errors.join('\n'));
}

export async function fetchCurrencies(){
    const endpoints = [
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json',
        'https://latest.currency-api.pages.dev/v1/currencies.min.json',
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json',
        'https://latest.currency-api.pages.dev/v1/currencies.json',
    ];
    return await fetchWithFallback(endpoints);
}

export async function fetchCurrencyRates(currency){
    const endpoints = [
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.min.json`,
        `https://latest.currency-api.pages.dev/v1/currencies/${currency}.min.json`,
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.json`,
        `https://latest.currency-api.pages.dev/v1/currencies/${currency}.json`,
    ];
    return await fetchWithFallback(endpoints);
}