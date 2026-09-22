const API_BASE_URL = "http://cloudops-incident-alb-1511611585.ap-south-1.elb.amazonaws.com";

let incidents = [];
let selectedIncident = null;


// ================= START APPLICATION =================

document.addEventListener("DOMContentLoaded", () => {

    setupEventListeners();

    fetchHealth();

    fetchIncidents();

});


// ================= EVENT LISTENERS =================

function setupEventListeners() {

    // Open create incident modal
    document
        .getElementById("report-button")
        .addEventListener("click", openCreateModal);


    document
        .getElementById("sidebar-create")
        .addEventListener("click", openCreateModal);


    // Create incident form
    document
        .getElementById("incident-form")
        .addEventListener("submit", createIncident);


    // Search
    document
        .getElementById("search-input")
        .addEventListener("input", handleSearch);


    // Resolve incident
    document
        .getElementById("resolve-button")
        .addEventListener("click", resolveSelectedIncident);


    // Close modal buttons
    document
        .querySelectorAll("[data-close]")
        .forEach(button => {

            button.addEventListener("click", () => {

                closeModal(button.dataset.close);

            });

        });


    // Sidebar navigation
    document
        .querySelectorAll(".nav-item[data-section]")
        .forEach(button => {

            button.addEventListener("click", () => {

                document
                    .querySelectorAll(".nav-item")
                    .forEach(item => {
                        item.classList.remove("active");
                    });


                button.classList.add("active");


                const section = button.dataset.section;


                if (section === "incidents") {

                    document
                        .querySelector(".panel:nth-of-type(2)")
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });

                }


                if (section === "health") {

                    document
                        .getElementById("health-panel")
                        .scrollIntoView({
                            behavior: "smooth"
                        });

                }


                document
                    .getElementById("sidebar")
                    .classList.remove("open");

            });

        });


    // Mobile menu
    document
        .getElementById("menu-toggle")
        .addEventListener("click", () => {

            document
                .getElementById("sidebar")
                .classList.toggle("open");

        });


    // Category buttons
    document
        .querySelectorAll(".category-view")
        .forEach(button => {

            button.addEventListener("click", () => {

                const category =
                    button
                        .closest(".category-card")
                        .dataset.category;


                document
                    .getElementById("search-input")
                    .value = category;


                handleSearch({
                    target: {
                        value: category
                    }
                });


                document
                    .getElementById("incident-table-body")
                    .closest(".panel")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            });

        });


    // Close modal when clicking outside
    document
        .querySelectorAll(".modal-overlay")
        .forEach(modal => {

            modal.addEventListener("click", event => {

                if (event.target === modal) {

                    modal.classList.add("hidden");

                }

            });

        });

}


// ================= HEALTH CHECK =================

async function fetchHealth() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/health`);


        if (!response.ok) {

            throw new Error("API health check failed");

        }


        const data =
            await response.json();


        if (data.status === "healthy") {

            setApiStatus(true);

        } else {

            setApiStatus(false);

        }

    } catch (error) {

        setApiStatus(false);

    }

}


// ================= API STATUS =================

function setApiStatus(isOnline) {

    const dots = [

        document.getElementById(
            "sidebar-status-dot"
        ),

        document.getElementById(
            "health-dot"
        )

    ];


    dots.forEach(dot => {

        dot.classList.remove(
            "online",
            "offline"
        );


        dot.classList.add(
            isOnline
                ? "online"
                : "offline"
        );

    });


    document.getElementById(
        "sidebar-api-status"
    ).textContent =
        isOnline
            ? "API Online"
            : "API Offline";


    document.getElementById(
        "sidebar-api-message"
    ).textContent =
        isOnline
            ? "Connection healthy"
            : "Cannot reach API";


    document.getElementById(
        "health-status"
    ).textContent =
        isOnline
            ? "ONLINE"
            : "OFFLINE";


    document.getElementById(
        "health-message"
    ).textContent =
        isOnline
            ? "Incident API is responding normally."
            : "Unable to connect to the Incident API.";


    const badge =
        document.getElementById(
            "api-badge"
        );


    badge.textContent =
        isOnline
            ? "● API Online"
            : "● API Offline";


    badge.style.color =
        isOnline
            ? "#159447"
            : "#dc2626";


    badge.style.background =
        isOnline
            ? "#eaf8ef"
            : "#fff0f0";

}


// ================= GET ALL INCIDENTS =================

async function fetchIncidents() {

    const tableBody =
        document.getElementById(
            "incident-table-body"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading">
                Loading incidents...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/incidents`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch incidents"
            );

        }


        incidents =
            await response.json();


        displayIncidents(incidents);

        updateStatistics(incidents);


    } catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Unable to load incidents.
                    Make sure the Flask API is running.
                </td>
            </tr>
        `;


        showNotification(
            "Unable to connect to Incident API."
        );

    }

}


// ================= DISPLAY INCIDENTS =================

function displayIncidents(list) {

    const tableBody =
        document.getElementById(
            "incident-table-body"
        );


    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No incidents found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML = list
        .map(incident => {

            return `
                <tr>

                    <td class="id-cell">
                        ${escapeHtml(incident.id)}
                    </td>

                    <td>
                        ${escapeHtml(incident.title)}
                    </td>

                    <td>

                        <span
                            class="badge severity-${String(
                                incident.severity
                            ).toLowerCase()}">

                            ${escapeHtml(
                                incident.severity
                            )}

                        </span>

                    </td>

                    <td>

                        <span
                            class="badge status-${String(
                                incident.status
                            ).toLowerCase()}">

                            ${escapeHtml(
                                incident.status
                            )}

                        </span>

                    </td>

                    <td>
                        ${incident.created || "Today"}
                    </td>

                    <td>

                        <button
                            class="view-button"
                            onclick="showIncidentDetails('${escapeHtml(incident.id)}')">

                            View

                        </button>

                    </td>

                </tr>
            `;

        })
        .join("");


    updateCategoryCounts(list);

}


// ================= UPDATE STATISTICS =================

function updateStatistics(list) {

    const total =
        list.length;


    const open =
        list.filter(
            item => item.status === "OPEN"
        ).length;


    const resolved =
        list.filter(
            item => item.status === "RESOLVED"
        ).length;


    const high =
        list.filter(
            item => item.severity === "HIGH"
        ).length;


    document.getElementById(
        "total-incidents"
    ).textContent = total;


    document.getElementById(
        "open-incidents"
    ).textContent = open;


    document.getElementById(
        "resolved-incidents"
    ).textContent = resolved;


    document.getElementById(
        "high-severity"
    ).textContent = high;

}


// ================= CATEGORY COUNTS =================

function updateCategoryCounts(list) {

    const categories = {

        "Website Down":
            "website-count",

        "Database Error":
            "database-count",

        "Server Failure":
            "server-count",

        "Security Alert":
            "security-count"

    };


    Object.entries(categories)
        .forEach(([title, elementId]) => {

            const count =
                list.filter(
                    incident =>
                        incident.title === title
                ).length;


            document.getElementById(
                elementId
            ).textContent = count;

        });

}


// ================= SEARCH =================

function handleSearch(event) {

    const query =
        event.target.value
            .trim()
            .toLowerCase();


    const filtered =
        incidents.filter(incident =>

            incident.id
                .toLowerCase()
                .includes(query)

            ||

            incident.title
                .toLowerCase()
                .includes(query)

            ||

            incident.severity
                .toLowerCase()
                .includes(query)

            ||

            incident.status
                .toLowerCase()
                .includes(query)

        );


    displayIncidents(filtered);

}


// ================= CREATE MODAL =================

function openCreateModal() {

    document
        .getElementById("create-modal")
        .classList.remove("hidden");


    document
        .getElementById("incident-title")
        .focus();

}


function closeModal(modalId) {

    document
        .getElementById(modalId)
        .classList.add("hidden");

}


// ================= CREATE INCIDENT =================

async function createIncident(event) {

    event.preventDefault();


    const title =
        document
            .getElementById("incident-title")
            .value
            .trim();


    const severity =
        document
            .getElementById("incident-severity")
            .value;


    if (!title || !severity) {

        showNotification(
            "Please enter a title and select severity."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/incidents`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title: title,

                        severity: severity

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to create incident"
            );

        }


        await response.json();


        closeModal(
            "create-modal"
        );


        document
            .getElementById("incident-form")
            .reset();


        showNotification(
            "Incident created successfully."
        );


        await fetchIncidents();


    } catch (error) {

        showNotification(
            "Could not create incident."
        );

    }

}


// ================= INCIDENT DETAILS =================

async function showIncidentDetails(
    incidentId
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/incidents/${incidentId}`
            );


        if (!response.ok) {

            throw new Error(
                "Incident not found"
            );

        }


        selectedIncident =
            await response.json();


        document.getElementById(
            "details-id"
        ).textContent =
            selectedIncident.id;


        document.getElementById(
            "details-title"
        ).textContent =
            selectedIncident.title;


        document.getElementById(
            "details-severity"
        ).textContent =
            selectedIncident.severity;


        document.getElementById(
            "details-status"
        ).textContent =
            selectedIncident.status;


        document.getElementById(
            "details-created"
        ).textContent =
            selectedIncident.created ||
            "Today";


        document.getElementById(
            "details-description"
        ).textContent =
            selectedIncident.description ||
            "No description available.";


        const resolveButton =
            document.getElementById(
                "resolve-button"
            );


        resolveButton.style.display =
            selectedIncident.status === "RESOLVED"
                ? "none"
                : "inline-block";


        document
            .getElementById("details-modal")
            .classList.remove("hidden");


    } catch (error) {

        showNotification(
            "Could not load incident details."
        );

    }

}


// ================= RESOLVE INCIDENT =================

async function resolveSelectedIncident() {

    if (!selectedIncident) {

        return;

    }


    await updateIncident(
        selectedIncident.id,
        {
            status: "RESOLVED"
        }
    );


    closeModal(
        "details-modal"
    );

}


// ================= UPDATE INCIDENT =================

async function updateIncident(
    incidentId,
    data
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/incidents/${incidentId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(data)

                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to update incident"
            );

        }


        await response.json();


        showNotification(
            "Incident updated successfully."
        );


        await fetchIncidents();


    } catch (error) {

        showNotification(
            "Could not update incident."
        );

    }

}


// ================= NOTIFICATION =================

function showNotification(message) {

    const container =
        document.getElementById(
            "toast-container"
        );


    const toast =
        document.createElement("div");


    toast.className = "toast";


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.remove();

    }, 3000);

}


// ================= SECURITY =================

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}
