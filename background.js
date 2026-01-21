import {getCurrencies} from "./background/currencies.service.js";
import {getCurrencyRates, getRatesStatus} from "./background/rates.service.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_CURRENCIES") {
        getCurrencies().then(sendResponse);
        return true;
    }
    if (message.type === "GET_CURRENCY_RATES") {
        getCurrencyRates(message.baseCurrency, message.force).then(sendResponse);
        return true;
    }
    if (message.type === "GET_RATES_STATUS") {
        getRatesStatus().then(sendResponse);
        return true;
    }
});