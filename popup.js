document.addEventListener("DOMContentLoaded", function () {
    const statsTable = document.getElementById("statsTable");
    const resetButton = document.getElementById("resetButton");
    const dateFilter = document.getElementById("dateFilter"); // Ajout du sélecteur de date
    const canvas = document.getElementById("timeChart");
    const ctx = canvas.getContext("2d");

    console.log("Chargement des données...");

    // Vérifier si Chart.js est bien chargé
    if (typeof Chart === "undefined") {
        console.error("Erreur : Chart.js n'est pas chargé.");
        return;
    }

    // Fonction pour charger et afficher les statistiques selon la date sélectionnée
    function updateStatistics(filterDate = null) {
        chrome.storage.local.get(["timeData"], (data) => {
            let timeData = data.timeData || {};
            let siteTimes = {};
            let labels = [];
            let values = [];

            console.log("Données récupérées :", timeData);

            // Calcul du temps total passé par site en minutes
            for (let site in timeData) {
                let totalTime = 0;
                for (let date in timeData[site]) {
                    if (!filterDate || date === filterDate) {
                        totalTime += timeData[site][date];
                    }
                }
                if (totalTime > 0) {
                    siteTimes[site] = Math.floor(totalTime / 60); // Conversion en minutes
                }
            }

            console.log("Temps par site après filtrage :", siteTimes);

            // Trier les sites du plus utilisé au moins utilisé et limiter à 10
            let sortedSites = Object.entries(siteTimes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            console.log("Sites triés :", sortedSites);

            // Vérification si on a des données valides
            statsTable.innerHTML = ""; // Réinitialiser le tableau
            if (sortedSites.length === 0) {
                statsTable.innerHTML = "<tr><td colspan='2'>Aucune donnée disponible</td></tr>";
                canvas.style.display = "none"; // Cache le graphique si pas de données
                console.warn("Aucune donnée valide pour afficher le graphique.");
                return;
            }

            // Remplir le tableau HTML
            sortedSites.forEach(([site, time]) => {
                let row = document.createElement("tr");
                row.innerHTML = `<td>${site}</td><td>${time} min</td>`;
                statsTable.appendChild(row);

                labels.push(site);
                values.push(time);
            });

            console.log("Labels du graphique :", labels);
            console.log("Valeurs du graphique :", values);

            // Vérifier que le tableau `values` n'est pas vide
            if (values.length === 0 || values.every(v => v === 0)) {
                console.warn("Le graphique ne peut pas être généré car toutes les valeurs sont nulles.");
                canvas.style.display = "none"; // Cache le graphique si pas de valeurs valides
                return;
            }

            // Mettre à jour le graphique
            updateChart(labels, values);
        });
    }

    // Fonction pour mettre à jour le graphique
    function updateChart(labels, values) {
        if (window.myChart) {
            window.myChart.destroy(); // Supprimer l'ancien graphique avant d'en créer un nouveau
        }

        window.myChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
                        "#FF9F40", "#F7464A", "#46BFBD", "#FDB45C", "#949FB1"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        console.log("Graphique généré avec succès !");
        canvas.style.height = "250px";
    }

    // Sélection d'une date dans le filtre
    dateFilter.addEventListener("change", function () {
        let selectedDate = this.value; // Date au format YYYY-MM-DD
        console.log("Filtrage des statistiques pour la date :", selectedDate);
        updateStatistics(selectedDate);
    });

    // Charger les données initiales (afficher toutes les dates par défaut)
    updateStatistics();

    // Réinitialisation des statistiques
    resetButton.addEventListener("click", function () {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser les statistiques ?")) {
            chrome.storage.local.remove("timeData", () => {
                alert("Statistiques réinitialisées !");
                location.reload();
            });
        }
    });
});
