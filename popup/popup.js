const baseCurrencySelect = document.getElementById("base-currency");

baseCurrencySelect.addEventListener("change", async (event) => {
    const baseCurrency = event.target.value;
    await chrome.storage.local.set({'baseCurrency': baseCurrency});
    await chrome.runtime.sendMessage({type: 'GET_CURRENCY_RATES', baseCurrency}, response => {
        console.log(response);
    });
});

async function loadBaseCurrencies(){
    const currencies = await fetch('../currencies.base.json');
    return await currencies.json();
}

async function loadRemoteCurrencies(){
    const {currenciesRemote} = await chrome.storage.local.get('currenciesRemote');
    return currenciesRemote?.currencies ?? {};
}

async function loadCurrenciesForSelect(){
    const base = await loadBaseCurrencies();
    const remote = await loadRemoteCurrencies();

    const merged = {
        ...base,
        ...remote
    }

    await renderSelect(merged);
}

async function renderSelect(currencies){
    for (const [key, value] of Object.entries(currencies)) {
        const {baseCurrency} = await chrome.storage.local.get('baseCurrency');
        const option = createNewOption(key, `${key.toUpperCase()} - ${value}`, key === baseCurrency);
        baseCurrencySelect.appendChild(option);
    }
}

function createNewOption(value, text, selected){
    const option = document.createElement("option");
    option.value = value;
    option.text = text;
    option.selected = selected;
    return option;
}

document.addEventListener("DOMContentLoaded", loadCurrenciesForSelect);