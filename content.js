import {searchPriceAndCode} from 'price-extractor';
import {t} from "./util.js";

let convertedValueContainer = document.querySelector('.converted-value-container');
let currentRates = null;

if (!convertedValueContainer) {
    convertedValueContainer = document.createElement('div');
    convertedValueContainer.classList.add('converted-value-container');
    document.body.appendChild(convertedValueContainer);
}

document.addEventListener('mouseup', async () => {
    if (convertedValueContainer.style.display === 'inline-block') {
        hideContainer();
        return;
    }

    const selection = document.getSelection();
    const selectionString = selection.toString();
    if (!selectionString) {
        return;
    }

    const {code, price} = searchPriceAndCode(selectionString);
    if (!code || !price) {
        return;
    }

    showContainer(selection, `${formatNumber(price) + ' ' + code + ' - '}<div class="spinner"></div>`);

    await convert(code.toLowerCase(), price);
});

async function init() {
    const ratesData = await requestRates();

    if (ratesData.status === 'ok' || ratesData.status === 'stale') {
        currentRates = ratesData.data;
    }
}

await init();

function showContainer(selection, text) {
    convertedValueContainer.style.display = 'inline-block';
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

function getCoords(elem) {
    let box = elem.getBoundingClientRect();

    return {
        top: box.top + window.scrollY,
        right: box.right + window.scrollX,
        bottom: box.bottom + window.scrollY,
        left: box.left + window.scrollX,
    };
}

function getContainerPosition(selection) {
    const range = selection.getRangeAt(0);
    const selectionCoords = getCoords(range);
    const containerWidth = convertedValueContainer.offsetWidth;
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

async function convert(currency, sum) {
    let displayText = '';

    try {
        if (!currentRates) {
            const ratesData = await requestRates();
            if (ratesData.status === 'error') {
                throw new Error(ratesData.message);
            }
            currentRates = ratesData.data;
        }

        const rate = currentRates[currency];
        const convertedSum = rate === 0 ? 0 : sum / rate;
        const {selectedCurrency} = await chrome.storage.local.get('selectedCurrency');

        displayText = constructDisplayText(sum, convertedSum, selectedCurrency.toUpperCase(), currency.toUpperCase());
    } catch (error) {
        console.error(error);
        displayText = `${t('failed_to_convert')} ${error.message}`;
    }

    hideContainer();

    const selection = document.getSelection();
    const selectionString = selection.toString();

    if (!selectionString) {
        return;
    }

    showContainer(selection, displayText);
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
    return [formattedSum, currencyCode, ' - ', formattedConvertedSum, baseCurrencyCode].join(' ');
}

async function requestRates() {
    const {selectedCurrency} = await chrome.storage.local.get('selectedCurrency');
    if (!selectedCurrency) {
        throw new Error(t('currency_is_not_selected'));
    }

    return new Promise(resolve => {
        chrome.runtime.sendMessage(
            {
                type: 'GET_CURRENCY_RATES',
                baseCurrency: selectedCurrency
            },
            resolve
        );
    });
}