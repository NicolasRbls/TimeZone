console.log("Background script chargé !");

let currentURL = null;
let startTime = null;

// Liste des sites et mots-clés à ignorer
const ignoredSites = ["newtab", "extensions", "settings", "about", "chrome", "devtools", "webstore", "localhost"];
const ignoredKeywords = ["login", "auth", "signin", "signup", "search", "account"];

// Vérifie si un site doit être ignoré
function shouldIgnore(url) {
    return ignoredSites.some(site => url.includes(site)) ||
           ignoredKeywords.some(keyword => url.includes(keyword));
}

// Fonction pour enregistrer le temps passé sur un site
function updateTimeSpent(url) {
    if (!url || !startTime || shouldIgnore(url)) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Temps en secondes
    if (timeSpent <= 0) return; // Évite d'enregistrer un temps nul ou négatif

    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

    chrome.storage.local.get(["timeData"], (data) => {
        let timeData = data.timeData || {};

        // Vérifie que l'entrée pour le site et la date existe bien
        if (!timeData[url]) {
            timeData[url] = {};
        }

        if (!timeData[url][today]) {
            timeData[url][today] = 0;
        }

        // Ajoute le temps passé
        timeData[url][today] += timeSpent;

        // Stocker les nouvelles données
        chrome.storage.local.set({ timeData }, () => {
            console.log(`Temps mis à jour pour ${url} (${today}): ${timeData[url][today]} secondes`);
        });
    });
}

// Fonction pour gérer le changement d'onglet
function handleTabChange(tabId) {
    if (currentURL) {
        updateTimeSpent(currentURL); // Enregistrer le temps passé sur l'ancien site
    }

    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab.url) {
            return;
        }

        const url = new URL(tab.url).hostname; // Extraire seulement le domaine

        if (shouldIgnore(url)) {
            console.log(`Site ignoré : ${url}`);
            currentURL = null;
            startTime = null;
            return;
        }

        currentURL = url;
        startTime = Date.now();

        console.log(`Nouveau site détecté : ${currentURL}`);
    });
}

// Détection du changement d'onglet
chrome.tabs.onActivated.addListener((activeInfo) => {
    handleTabChange(activeInfo.tabId);
});

// Détection du changement d'URL dans un onglet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        handleTabChange(tabId);
    }
});

// Détection quand Chrome est fermé et enregistre les données
chrome.windows.onRemoved.addListener(() => {
    if (currentURL) {
        updateTimeSpent(currentURL);
    }
});
