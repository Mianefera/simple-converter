const baseCurrencySelect = document.getElementById('base-currency');
const refreshButton = document.getElementById('refresh');
const statusMessage = document.getElementById('status');
const updatedMessage = document.getElementById('updated');
const searchInput = document.getElementById('currency-search');
const POPULAR = ['usd', 'eur', 'gbp', 'cny', 'jpy', 'rub'];
let allCurrencies = [];

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.ratesState) {
        return;
    }
    const state = changes.ratesState.newValue;

    if (state.timestamp) {
        updatedMessage.textContent = 'Обновлено: ' + formatUpdated(state.timestamp);
    } else {
        updatedMessage.textContent = '';
    }

    updateStatusMessage(state);
});

document.addEventListener('DOMContentLoaded', async () => {
    const {currencies, selectedCurrency} = await chrome.storage.local.get(['currencies','selectedCurrency']);
    allCurrencies = sortCurrencies(currencies);
    renderSelect(allCurrencies);
    baseCurrencySelect.value = selectedCurrency;

    requestRates(false);
    const {ratesState} = await chrome.storage.local.get('ratesState');
    if (ratesState?.timestamp) {
        updatedMessage.textContent = 'Обновлено: ' + formatUpdated(ratesState.timestamp);
    }
});

refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    requestRates(baseCurrencySelect.value, true);
    refreshButton.disabled = false;
});

baseCurrencySelect.addEventListener('change', (event) => {
    const selectedCurrency = event.target.value;
    chrome.storage.local.set({selectedCurrency});
    requestRates();
});

searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();

    if(!query){
        renderSelect(allCurrencies);
        return;
    }

    const filtered = allCurrencies.filter(([code, name]) =>
        code.toLowerCase().includes(query) || name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        baseCurrencySelect.innerHTML = '<option disabled>ничего не найдено</option>';
        return;
    }

    renderSelect(filtered);
});

function requestRates(force = false) {
    const baseCurrency = baseCurrencySelect.value;
    if (!baseCurrency) {
        statusMessage.textContent = 'Необходимо выбрать валюту';
        statusMessage.className = 'status-message warning';
        return;
    }

    statusMessage.textContent = 'Проверка курсов...';
    statusMessage.className = 'status-message info';

    chrome.runtime.sendMessage({type: 'GET_CURRENCY_RATES', baseCurrency, force},
        (response) => {
            updateStatusMessage(response);
        });
}

function updateStatusMessage(response) {
    if (response.status === 'ok') {
        statusMessage.textContent = response.cached ? 'Курсы актуальны (кэш)' : 'Курсы обновлены';
        statusMessage.className = 'status-message success';
        return;
    }

    if (response.status === 'stale') {
        statusMessage.textContent = response.message;
        statusMessage.className = 'status-message warning';
        return;
    }

    if (response.status === 'error') {
        statusMessage.textContent = response.message;
        statusMessage.className = 'status-message error';
    }
}

function renderSelect(currencies) {
    baseCurrencySelect.innerHTML = '';

    for (const [code, name] of currencies) {
        const option = document.createElement('option');
        option.value = code;
        option.text = `${code.toUpperCase()} - ${name}`;
        //option.selected = selected;
        baseCurrencySelect.appendChild(option);
    }
}

function formatUpdated(ts) {
    if (!ts) {
        return '';
    }

    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);

    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} минут назад`;
    if (hours < 24) return `${hours} часов назад`;

    return new Date(ts).toLocaleString();
}

function sortCurrencies(currencies, mode = 'code') {
    const entries = Object.entries(currencies);

    switch (mode) {
        case 'name':
            return entries.sort(([, a], [, b]) => a.localeCompare(b));

        case 'popular':
            return entries.sort(([codeA], [codeB]) => {
                const includesA = POPULAR.includes(codeA);
                const includesB = POPULAR.includes(codeB);

                if (includesA && includesB) {
                    return codeA.localeCompare(codeB);
                }

                return includesA ? -1 : includesB ? 1 : codeA.localeCompare(codeB);
            });

        default:
            return entries.sort(([a], [b]) => a.localeCompare(b));
    }
}