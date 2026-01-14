import {fetchCurrencies} from "./api.js";

const CURRENCIES_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const STORAGE_KEY = 'currenciesRemote';

export async function getCurrencies() {
    const {[STORAGE_KEY]: cached} = await chrome.storage.local.get(STORAGE_KEY);
    if (cached && Date.now() - cached.timestamp < CURRENCIES_TTL) {
        return cached.currencies;
    }

    try {
        const currencies = await fetchCurrencies();

        await chrome.storage.local.set({
            [STORAGE_KEY]: {
                currencies,
                timestamp: Date.now()
            }
        });

        return currencies;
    } catch (error) {
        console.error(error);
        return cached?.currencies ?? {};
    }
}
