import {fetchCurrencyRates} from "./api.js";

const RATES_TTL = 60 * 60 * 24; // 1 day
const STORAGE_KEY = 'currencyRatesData';

export async function getCurrencyRates(baseCurrency, force = false) {
    const {[STORAGE_KEY]: cachedRates} = await chrome.storage.local.get(STORAGE_KEY);

    if (!force
        && cachedRates
        && cachedRates.hasOwnProperty(baseCurrency)
        && Date.now() - cachedRates.timestamp < RATES_TTL) {
        return {
            ...cachedRates,
            cached: true,
            status: 'ok'
        };
    }

    try {
        const rates = await fetchCurrencyRates(baseCurrency);

        const payload = {
            rates,
            timestamp: Date.now()
        }

        await chrome.storage.local.set({
            [STORAGE_KEY]: payload
        });

        return {
            ...payload,
            cached: false,
            status: 'ok'
        };
    } catch (error) {
        if (cachedRates) {
            return {
                ...cachedRates,
                cached: true,
                status: 'stale',
                message: 'Используются устаревшие курсы'
            }
        }

        return {
            status: 'error',
            message: 'Не удалось загрузить курсы валют'
        };
    }
}