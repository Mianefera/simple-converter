const baseCurrencySelect = document.getElementById('base-currency');
const refreshButton = document.getElementById('refresh');
const statusMessage = document.getElementById('status');
const updatedMessage = document.getElementById('updated');

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
    await renderSelect();//loadCurrenciesForSelect();
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

async function renderSelect() {
    const {selectedCurrency, currencies} = await chrome.storage.local.get(['selectedCurrency','currencies']);
    for (const [key, value] of Object.entries(currencies)) {
        const option = createNewOption(
            key,
            `${key.toUpperCase()} - ${value}`,
            key === selectedCurrency
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