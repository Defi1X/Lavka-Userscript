// ==UserScript==
// @name         Яндекс Лавка - Цена за единицу
// @description  Добавляет расчёт цены за единицу товара на Яндекс Лавке
// @match        https://lavka.yandex.ru/*
// ==/UserScript==

(function() {
    'use strict';
    
    const styles = {
        fontSize: '14px',
        color: '#666666',
        display: 'block',
        'padding': '8px',
        'padding-left': '0px'
    };
    
    const unitConverter = {
        'кг': {base: 'г', multiplier: 1000},
        'г':  {base: 'г', multiplier: 1},
        'л':  {base: 'мл', multiplier: 1000},
        'мл': {base: 'мл', multiplier: 1},
        'шт': {base: 'шт', multiplier: 1}
    };

    function parsePrice(priceText) {
        return parseFloat(
            priceText.replace(/[^\d,]/g, '')
                    .replace(',', '.')
                    .trim()
        );
    }

    function parseQuantity(quantityText) {
        const match = quantityText.match(/([\d,]+)\s*?(г|кг|мл|л|шт)/);
        if (!match) return null;
        
        return {
            value: parseFloat(match[1].replace(',', '.')),
            unit: match[2]
        };
    }

    function calculateUnitPrice(price, quantity) {
        if (!quantity || !unitConverter[quantity.unit] || quantity.value <= 0) return null;
        
        const converter = unitConverter[quantity.unit];
        return {
            value: price / (quantity.value * converter.multiplier),
            unit: converter.base
        };
    }

    function createPriceElement(priceData) {
        const element = document.createElement('div');
        element.className = 'unit-price';
        element.textContent = `≈ ${priceData.value.toFixed(2)} ₽/${priceData.unit}`;
        Object.assign(element.style, styles);
        return element;
    }

    function processCard(card) {
        if (card.querySelector('.unit-price')) return;

        const priceElement = card.querySelector('[data-testid="price-text"]');
        const quantityElement = card.querySelector('[data-testid="text-train-value"]');
        const priceBlockElement = card.querySelector('[data-testid="price-block"]');
        
        if (!priceElement || !quantityElement) return;

        const price = parsePrice(priceElement.textContent);
        const quantity = parseQuantity(quantityElement.textContent);
        if (!price || !quantity) return;

        const unitPrice = calculateUnitPrice(price, quantity);
        if (!unitPrice) return;

        priceBlockElement.after(createPriceElement(unitPrice));
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('[data-testid="product-card"]')) {
                        processCard(node);
                    }
                    node.querySelectorAll('[data-testid="product-card"]').forEach(processCard);
                }
            });
        });
    });

    function init() {
        document.querySelectorAll('[data-testid="product-card"]').forEach(processCard);
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
