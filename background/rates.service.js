import {fetchCurrencyRates} from "./api.js";
import {t} from "../util.js";

const RATES_TTL = 1000 * 60 * 60 * 12; // 12 hours
const RATES_DATA_KEY = 'ratesData';
const RATES_STATE_KEY = 'ratesState';

export async function getCurrencyRates(baseCurrency, force = false) {
    const storage = await chrome.storage.local.get([RATES_DATA_KEY, RATES_STATE_KEY]);

    const cachedRates = storage[RATES_DATA_KEY];

    const isCacheValid =
        cachedRates
        && cachedRates.base === baseCurrency
        && Date.now() - cachedRates.timestamp < RATES_TTL;

    if (!force
        && isCacheValid) {

        const state = {
            status: 'ok',
            cached: true,
            timestamp: cachedRates.timestamp,
            base: baseCurrency
        };

        await chrome.storage.local.set({[RATES_STATE_KEY]: state});

        return {
            data: cachedRates.rates,
            cached: true,
            status: 'ok'
        };
    }

    try {
        const rates = await fetchCurrencyRates(baseCurrency);

        const ratesData = {
            base: baseCurrency,
            rates: rates[baseCurrency],
            timestamp: Date.now()
        };

        await chrome.storage.local.set({[RATES_DATA_KEY]: ratesData});

        const ratesState = {
            status: 'ok',
            cached: false,
            timestamp: ratesData.timestamp,
            base: baseCurrency
        };

        await chrome.storage.local.set({[RATES_STATE_KEY]: ratesState});

        return {
            data: ratesData.rates,
            cached: false,
            status: 'ok'
        };
    } catch (error) {
        console.warn('Rates fetch failed', error);

        if (cachedRates && cachedRates.base === baseCurrency) {
            const ratesState = {
                status: 'stale',
                cached: true,
                timestamp: cachedRates.timestamp,
                base: baseCurrency
            };

            await chrome.storage.local.set({[RATES_STATE_KEY]: ratesState});

            return {
                data: cachedRates.rates,
                status: 'stale',
                message: t('outdated_currency_rates_are_used')
            }
        }

        const ratesState = {
            status: 'error',
            cached: false,
            timestamp: Date.now(),
            base: baseCurrency
        };

        await chrome.storage.local.set({[RATES_STATE_KEY]: ratesState});

        return {
            status: 'error',
            message: t('failed_to_load_currency_rates')
        };
    }
}

export async function getRatesStatus() {
    const {[RATES_STATE_KEY]: status} = await chrome.storage.local.get([RATES_STATE_KEY]);

    return status ?? {
        status: 'error',
        message: t('failed_to_load_currency_rates')
    }
}