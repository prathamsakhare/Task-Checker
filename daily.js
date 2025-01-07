let db;

window.onload = function () {
    const request = indexedDB.open("TaskDB", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains("tasks")) {
            db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        displayDailyTasks();
    };

    request.onerror = function (event) {
        console.error("Error opening IndexedDB", event);
    };
};

function displayDailyTasks() {
    const transaction = db.transaction(["tasks"], "readonly");
    const objectStore = transaction.objectStore("tasks");
    const tasksContainer = document.getElementById("tasksContainer");

    tasksContainer.innerHTML = ""; // Clear previous content

    objectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;

        if (cursor) {
            const task = cursor.value;

            // Create task element
            const taskDiv = document.createElement("div");
            taskDiv.className = "task";
            taskDiv.innerHTML = `
                <span>${task.name}</span>
                <input type="number" value="${task.dailyCount || 0}" min="0" id="daily-${task.id}" />
                <button onclick="updateDailyCount(${task.id})">Update</button>
            `;
            tasksContainer.appendChild(taskDiv);

            cursor.continue();
        }
    };
}

function updateDailyCount(taskId) {
    const inputField = document.getElementById(`daily-${taskId}`);
    const dailyCount = parseInt(inputField.value);

    const transaction = db.transaction(["tasks"], "readwrite");
    const objectStore = transaction.objectStore("tasks");

    const request = objectStore.get(taskId);

    request.onsuccess = function (event) {
        const task = event.target.result;

        if (task) {
            const prevDailyCount = task.dailyCount || 0;
            task.dailyCount = dailyCount;
            task.count += dailyCount - prevDailyCount; // Adjust the main task count

            const updateRequest = objectStore.put(task);
            updateRequest.onsuccess = function () {
                alert(`Daily count for "${task.name}" updated successfully!`);
            };
        }
    };

    request.onerror = function () {
        console.error("Error updating daily count");
    };
}
