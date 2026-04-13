import {searchPriceAndCode} from 'price-extractor';
import {t} from "./util.js";

let convertedValueContainer = null;
let currentRates = null;

await init();

async function init() {
    if (!convertedValueContainer) {
        convertedValueContainer = document.createElement('div');
        convertedValueContainer.classList.add('converted-value-container');
        document.body.appendChild(convertedValueContainer);
    }

    document.addEventListener('mouseup', handleMouseUp);
    chrome.storage.onChanged.addListener(handleStorageChanges);

    await loadRates();
}

async function handleMouseUp() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
        hideContainer();
        return;
    }

    const selectionString = selection.toString().trim();
    if (!selectionString) {
        hideContainer();
        return;
    }

    const {code, price} = searchPriceAndCode(selectionString);
    if (!code || !price) {
        hideContainer();
        return;
    }

    showContainer(selection, `${formatNumber(price, code) + ' ' + code + ' - '}<div class="spinner"></div>`);

    await convert(code.toLowerCase(), price, selection);
}

async function loadRates() {
    try {
        const ratesData = await requestRates();

        if (ratesData.status === 'ok' || ratesData.status === 'stale') {
            currentRates = ratesData;
        }
    } catch (e) {
        console.error(e);
    }
}

function showContainer(selection, text) {
    convertedValueContainer.style.display = 'block';
    convertedValueContainer.innerHTML = text;
    const {top, left} = getContainerPosition(selection);
    convertedValueContainer.style.left = left + 'px';
    convertedValueContainer.style.top = top + 'px';
}

function hideContainer() {
    for (let i = convertedValueContainer.classList.length - 1; i >= 0; i--) {
        const item = convertedValueContainer.classList[i];
        if (item !== 'converted-value-container') {
            convertedValueContainer.classList.remove(item);
        }
    }

    convertedValueContainer.style.display = 'none';
    convertedValueContainer.style.left = '0';
    convertedValueContainer.style.top = '0';
    convertedValueContainer.innerHTML = '';
}

function updateContainer(selection, text) {
    convertedValueContainer.innerHTML = text;
    const {top, left} = getContainerPosition(selection);
    convertedValueContainer.style.left = left + 'px';
    convertedValueContainer.style.top = top + 'px';
}

function getContainerPosition(selection) {
    const range = selection.getRangeAt(0);
    const selectionCoords = range.getBoundingClientRect();
    const containerRect = convertedValueContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const bodyWidth = document.body.offsetWidth;
    const triangleHeight = 10;
    let left = getLeftCoordinate(selectionCoords, convertedValueContainer);
    let top = getTopCoordinate(selectionCoords, convertedValueContainer);

    if (top < 0) {
        top = selectionCoords.bottom + triangleHeight;
        convertedValueContainer.classList.add('triangle-top');
        convertedValueContainer.classList.add('shadow-bottom');
    } else {
        convertedValueContainer.classList.add('triangle-bottom');
        convertedValueContainer.classList.add('shadow-top');
    }

    if (left < 0) {
        left = 0;
        convertedValueContainer.classList.add('triangle-left');
    } else if (left + containerWidth > bodyWidth) {
        left = bodyWidth - containerWidth - 1;
        convertedValueContainer.classList.add('triangle-right');
    }

    return {
        top: top,
        left: left,
    };
}

function getLeftCoordinate(selectionCoords) {
    const selectionWidth = selectionCoords.right - selectionCoords.left;
    const containerWidth = convertedValueContainer.offsetWidth;

    if (selectionWidth > containerWidth) {
        const diff = selectionWidth - containerWidth;
        const halfDiff = diff / 2;
        return selectionCoords.left + halfDiff;
    } else {
        const diff = containerWidth - selectionWidth;
        const halfDiff = diff / 2;
        return selectionCoords.left - halfDiff;
    }
}

function getTopCoordinate(selectionCoords) {
    const selectionHeight = selectionCoords.bottom - selectionCoords.top;
    const containerHeight = convertedValueContainer.clientHeight;
    const triangleHeight = 10;
    return selectionCoords.bottom - selectionHeight - containerHeight - triangleHeight;
}

async function convert(currency, sum, selection) {
    try {
        if (!currentRates) {
            const ratesData = await requestRates();
            if (ratesData.status === 'error') {
                throw new Error(ratesData.message);
            }
            currentRates = ratesData;
        }

        const rate = currentRates.data[currency];
        const convertedSum = sum / rate;

        const text = constructDisplayText(sum, convertedSum, currentRates.currency.toUpperCase(), currency.toUpperCase());
        updateContainer(selection, text);
    } catch (error) {
        const text = `${t('failed_to_convert')} ${error.message}`;
        updateContainer(selection, text);
    }
}

function formatNumber(value, currency) {
    return new Intl.NumberFormat(
        chrome.i18n.getUILanguage(),
        {
            style: 'currency',
            currency
        }
    ).format(value);
}

function constructDisplayText(unconvertedSum, convertedSum, baseCurrencyCode, currencyCode) {
    const formattedSum = formatNumber(unconvertedSum, currencyCode);
    const formattedConvertedSum = formatNumber(convertedSum, baseCurrencyCode);
    return `${formattedSum} - ${formattedConvertedSum}`;
}

async function requestRates() {
    const selectedCurrency = await getSelectedCurrency();

    return new Promise(resolve => {
        chrome.runtime.sendMessage(
            {
                type: 'GET_CURRENCY_RATES',
                baseCurrency: selectedCurrency
            },
            response => resolve({...response, currency: selectedCurrency})
        );
    });
}

async function getSelectedCurrency() {
    const {selectedCurrency} = await chrome.storage.local.get('selectedCurrency');
    if (!selectedCurrency) {
        throw new Error(t('currency_is_not_selected'));
    }

    return selectedCurrency;
}

async function handleStorageChanges(changes, area) {
    if (area !== "local" || !changes.selectedCurrency) {
        return;
    }

    currentRates = await requestRates();
}