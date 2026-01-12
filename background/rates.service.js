import {fetchCurrencyRates} from "./api.js";

const RATES_TTL = 60 * 60 * 24; // 1 day
const STORAGE_KEY = 'currencyRatesData';

export async function getCurrencyRates(baseCurrency){
    const {[STORAGE_KEY]: cached} = await chrome.storage.local.get(STORAGE_KEY);
    if(cached
        && cached.data.hasOwnProperty(baseCurrency)
        && Date.now() - cached.timestamp < RATES_TTL){
        return { ...cached, cached: true };
    }

    try {
        const data = await fetchCurrencyRates(baseCurrency);

        const payload = {
            data,
            timestamp: Date.now()
        }

        await chrome.storage.local.set({
            [STORAGE_KEY]: payload
        });

        return { ...payload, cached: false };
    } catch (error) {
        return cached ? { ...cached, cached: true } : {};
    }
}