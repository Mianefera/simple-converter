const baseCurrencySelect = document.getElementById("base-currency");

baseCurrencySelect.addEventListener("change", (event) => {
    const baseCurrency = event.target.value;
    chrome.storage.local.set({'baseCurrency': baseCurrency});
    //document.appendChild()
    //getCurrencyRates(baseCurrency);
});

async function getCurrencies() {
    const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json';
    try {
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Error ${response.status}`);
        }   
        const data = await response.json();
        const selectedBaseCurrency = await chrome.storage.local.get('baseCurrency');
        for (const [key, value] of Object.entries(data)) {
            const optionText = key.toUpperCase() + (value ? ' - ' + value : '');
            const option = createNewOption(key, optionText, selectedBaseCurrency.baseCurrency === key);
            baseCurrencySelect.appendChild(option);
        }
    } catch (error) {
        console.error(error);
    }
}

function createNewOption(value, text, selected){
    const option = document.createElement("option");
    option.value = value;
    option.text = text;
    option.selected = selected;
    return option;
}

function createAlertElement(){
    const alert = document.createElement("div");
    alert.classList.add("alert");
    alert.classList.add("alert-success");
}

async function getCurrencyRates(currency){
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.min.json`;
    try {
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Error ${response.status}`);
        }
        const data = await response.json();
        chrome.storage.local.set({'currencyRates': JSON.stringify(data)});
    } catch (error) {
        console.error(error);
    }
}

//getCurrencies();
