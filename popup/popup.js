const baseCurrencySelect = document.getElementById('base-currency');
const refreshButton = document.getElementById('refresh');
const statusMessage = document.getElementById('status');

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrenciesForSelect();
    requestRates(false);
});

refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    requestRates(baseCurrencySelect.value, true);
    refreshButton.disabled = false;
});

baseCurrencySelect.addEventListener('change', (event) => {
    const baseCurrency = event.target.value;
    chrome.storage.local.set({baseCurrency});
    requestRates();
});

function requestRates(force = false) {
    const baseCurrency = baseCurrencySelect.value;
    if (!baseCurrency) {
        statusMessage.textContent = 'Необходимо выбрать валюту';
        statusMessage.className = 'status warning';
        return;
    }

    statusMessage.textContent = 'Обновление курсов...';
    statusMessage.className = 'status info';

    chrome.runtime.sendMessage(
        {type: 'GET_CURRENCY_RATES', baseCurrency, force},
        response => {
            if (response.status === 'ok') {
                statusMessage.textContent = response.cached ? 'Курсы загружены из кэша' : 'Курсы обновлены';
                statusMessage.className = 'status success';
                return;
            }

            if (response.status === 'stale') {
                statusMessage.textContent = 'Курсы устарели, обноление...';
                statusMessage.className = 'status info';
                chrome.runtime.sendMessage(
                    {type: 'GET_CURRENCY_RATES', baseCurrency, force: true},
                    handleRatesResponse
                );
                return;
            }

            if (response.status === 'error') {
                statusMessage.textContent = 'Не удалось загрузить курсы';
                statusMessage.className = 'status error';
            }
        }
    );
}

function handleRatesResponse(response) {
    if (response.status === 'ok') {
        statusMessage.textContent = response.cached ? 'Курсы загружены из кэша' : 'Курсы обновлены';
        statusMessage.className = 'status success';
    }

    if (response.status === 'stale') {
        statusMessage.textContent = response.message;
        statusMessage.className = 'status warning';
    }

    if (response.status === 'error') {
        statusMessage.textContent = response.message;
        statusMessage.className = 'status error';
    }
}

async function loadBaseCurrencies() {
    const currencies = await fetch('../currencies.base.json');
    return await currencies.json();
}

async function loadRemoteCurrencies() {
    const {currenciesRemote} = await chrome.storage.local.get('currenciesRemote');
    return currenciesRemote?.currencies ?? {};
}

async function loadCurrenciesForSelect() {
    const base = await loadBaseCurrencies();
    const remote = await loadRemoteCurrencies();

    const merged = {
        ...base,
        ...remote
    }

    await renderSelect(merged);
}

async function renderSelect(currencies) {
    const {baseCurrency} = await chrome.storage.local.get('baseCurrency');
    for (const [key, value] of Object.entries(currencies)) {
        const option = createNewOption(
            key,
            `${key.toUpperCase()} - ${value}`,
            key === baseCurrency
        );
        baseCurrencySelect.appendChild(option);
    }
}

function createNewOption(value, text, selected) {
    const option = document.createElement('option');
    option.value = value;
    option.text = text;
    option.selected = selected;
    return option;
}