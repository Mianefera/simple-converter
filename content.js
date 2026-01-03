import {searchPriceAndCode} from 'price-extractor';

let convertedValueContainer = document.querySelector('.converted-value-container');

if (!convertedValueContainer) {
    convertedValueContainer = document.createElement('div');
    convertedValueContainer.classList.add('converted-value-container');
    document.body.appendChild(convertedValueContainer);
}

document.addEventListener('mouseup', () => {
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

    let baseCurrency = 'RUB';

    convert(baseCurrency.toLowerCase(), code.toLowerCase(), price);
});

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

async function convert(baseCurrency, currency, sum) {
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.json`;
    let displayText = '';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        const data = await response.json();
        const rates = data[currency];
        const rate = rates[baseCurrency];
        const convertedSum = sum * rate;
        displayText = constructDisplayText(sum, convertedSum, baseCurrency.toUpperCase(), currency.toUpperCase());
    } catch (error) {
        console.error(error);
        displayText = `Can't convert. ${error.message}`;
    }
    hideContainer();
    const selection = document.getSelection();
    const selectionString = selection.toString();
    if (!selectionString) {
        return;
    }
    showContainer(selection, displayText);
}

function formatNumber(value) {
    const numberFormat = new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2,
    });
    return numberFormat.format(value);
}

function constructDisplayText(unconvertedSum, convertedSum, baseCurrencyCode, currencyCode) {
    const formattedSum = formatNumber(unconvertedSum);
    const formattedConvertedSum = formatNumber(convertedSum);
    return [formattedSum, currencyCode, ' - ', formattedConvertedSum, baseCurrencyCode].join(' ');
}
