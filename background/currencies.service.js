import {fetchCurrencies} from "./api.js";

const CURRENCIES_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const STORAGE_KEY = 'currencies';
const CURRENCIES_META_KEY = 'currenciesMeta';

export async function updateCurrenciesIfNeeded() {
    const {[CURRENCIES_META_KEY]: meta} = await chrome.storage.local.get(CURRENCIES_META_KEY);
    if (meta
        && Date.now() - meta.timestamp < CURRENCIES_TTL) {
        return;
    }

    let apiCurrencies = {};
    try {
        apiCurrencies = await fetchCurrencies();
    } catch (error) {
        console.warn('Using base currencies only. ', error);
    }

    let baseCurrencies = {};
    try {
        baseCurrencies = await loadBaseCurrencies();
    } catch (error) {
        console.error('Base currencies missing.', error);
    }

    const merged = {
        ...baseCurrencies,
        ...apiCurrencies,
    };

    await chrome.storage.local.set({
        [STORAGE_KEY]: merged,
        [CURRENCIES_META_KEY]: {
            timestamp: Date.now()
        }
    });
}

async function loadBaseCurrencies() {
    const url = chrome.runtime.getURL('background/currencies.base.json');
    const currencies = await fetch(url);
    if (!currencies.ok) {
        throw new Error(currencies.status);
    }
    return currencies.json();
}