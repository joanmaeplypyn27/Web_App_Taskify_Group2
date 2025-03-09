document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("taskInput"),
        addTaskBtn = document.getElementById("addTask"),
        taskList = document.getElementById("taskList"),
        totalTasks = document.getElementById("totalTasks"),
        completedTasks = document.getElementById("completedTasks"),
        updatedTasks = document.getElementById("updatedTasks"),
        deletedTasks = document.getElementById("deletedTasks"),
        clearTasksBtn = document.getElementById("clearTasks"),
        deleteSelectedBtn = document.getElementById("deleteSelected"),
        themeToggle = document.getElementById("themeToggle"),
        body = document.body,
        taskTemplate = document.getElementById("taskTemplate"),
        sortAscBtn = document.getElementById("sortAsc"),
        sortDescBtn = document.getElementById("sortDesc"),
        resetOrderBtn = document.getElementById("resetOrder");

    let draggedItem = null;
    let originalOrder = [];
    let deletedTaskCount = localStorage.getItem("deletedTaskCount") || 0;
    let updatedTaskCount = localStorage.getItem("updatedTaskCount") || 0;
    deletedTasks.textContent = deletedTaskCount;
    updatedTasks.textContent = updatedTaskCount;
    // Prevent Duplicate Task
    const taskExists = (text) => [...taskList.querySelectorAll(".task-content")]
        .some(span => span.textContent.toLowerCase() === text.toLowerCase());

    const saveTasks = () => {
        const tasks = [...taskList.children].map(li => ({
            text: li.querySelector(".task-content").textContent,
            completed: li.classList.contains("completed"),
            checked: li.querySelector(".task-checkbox").checked
        }));
        localStorage.setItem("tasks", JSON.stringify(tasks));
        updateTaskify();
    };

    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        originalOrder = [];
        tasks.forEach(t => {
            addTaskToDOM(t.text, t.completed, t.checked, true);
        });
    };

    const updateTaskify = () => {
        totalTasks.textContent = taskList.children.length;
        completedTasks.textContent = taskList.querySelectorAll(".completed").length;
        deleteSelectedBtn.style.display = taskList.querySelector(".task-checkbox:checked") ? "inline-block" : "none";
    };

    addTaskBtn.addEventListener("click", () => {
        const taskText = taskInput.value.trim();
        if (!taskText || taskExists(taskText)) {
            alert(!taskText ? "Please enter a task!" : "Task already exists!");
            return;
        }
        addTaskToDOM(taskText);
        taskInput.value = "";
        taskInput.focus();
        saveTasks();
    });    

    taskInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTaskBtn.click();
    });

    const addTaskToDOM = (text, completed = false, checked = false, skipCheck = false) => {
        if (!skipCheck && taskExists(text)) return alert("Task already exists!");
        const li = taskTemplate.content.cloneNode(true).querySelector("li");
        const checkbox = li.querySelector(".task-checkbox"),
            taskContent = li.querySelector(".task-content");
            taskContent.textContent = text;
        li.draggable = true;
        if (completed) li.classList.add("completed");
        if (checked) checkbox.checked = true, li.classList.add("checked-list");
        
        taskList.appendChild(li);
        updateTaskify();
        originalOrder.push({ 
            text: text,
            completed: completed,
            checked: checked,
            li: li
        });
    
        checkbox.addEventListener("change", () => {
            li.classList.toggle("checked-list", checkbox.checked);
            updateTaskify();
            saveTasks();
        });
    
        li.querySelector(".check-btn").addEventListener("click", () => {
            li.classList.toggle("completed");
            saveTasks();
        });
    
        li.querySelector(".delete-btn").addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete: "${taskContent.textContent}"?`)) {
                li.remove();
                deletedTasks.textContent = ++deletedTaskCount;
                localStorage.setItem("deletedTaskCount", deletedTaskCount);
                saveTasks();
            }
        });
    
        const getDragAfterElement = (container, y) => {
            return [...container.querySelectorAll("li:not(.dragging)")].reduce(
                (closest, child) => {
                    const { top, height } = child.getBoundingClientRect();
                    const offset = y - top - height / 2;
                    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
                },
                { offset: Number.NEGATIVE_INFINITY }
            ).element;
        };
        li.addEventListener("dragstart", () => {
            draggedItem = li;
            draggedItem.classList.add("dragging");
        });
        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(taskList, e.clientY);
            taskList.insertBefore(draggedItem, afterElement || null);
        });
        li.addEventListener("dragend", () => {
            draggedItem.classList.remove("dragging");
            saveTasks();
        });        

        taskContent.addEventListener("dblclick", () => editTask(taskContent, li));
        saveTasks();
    };

    const editTask = (taskContent, li) => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = taskContent.textContent;
        input.className = "edit-input";
        const deleteBtn = li.querySelector(".delete-btn");
        deleteBtn.style.display = "none";
        taskContent.replaceWith(input);
        input.focus();
    
        const saveTask = () => {
            const newValue = input.value.trim();
            if (!newValue || (taskExists(newValue) && newValue !== taskContent.textContent)) {
                alert(!newValue ? "Task cannot be empty!" : "Task already exists!");
                input.replaceWith(taskContent);
            } else {
                taskContent.textContent = newValue;
                updatedTasks.textContent = ++updatedTaskCount;
                localStorage.setItem("updatedTaskCount", updatedTaskCount);
            }
            deleteBtn.style.display = "inline-block";
            input.replaceWith(taskContent);  
            saveTasks();
        };
    
        input.addEventListener("keypress", (e) => e.key === "Enter" && saveTask());
        input.addEventListener("blur", saveTask);
    };    
    
    sortAscBtn.addEventListener("click", () => {
        [...taskList.children]
            .sort((a, b) => a.textContent.localeCompare(b.textContent))
            .forEach(li => taskList.appendChild(li));
    });

    sortDescBtn.addEventListener("click", () => {
        [...taskList.children]
            .sort((a, b) => b.textContent.localeCompare(a.textContent))
            .forEach(li => taskList.appendChild(li));
    });

    resetOrderBtn.addEventListener("click", () => {
        taskList.innerHTML = "";
        originalOrder.forEach(task => {
            const li = task.li; 
            taskList.appendChild(li); 
        });
        saveTasks(); 
    });
    
    clearTasksBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all tasks?")) {
            taskList.innerHTML = "";
            localStorage.clear();
            deletedTasks.textContent = deletedTaskCount = 0;
            saveTasks();
        }
    });    

    deleteSelectedBtn.addEventListener("click", () => {
        const selectedTasks = taskList.querySelectorAll(".task-checkbox:checked");
        const selectedCount = selectedTasks.length; 
        if (selectedCount > 0) {
            if (confirm(`Are you sure you want to delete ${selectedCount} selected task${selectedCount > 1 ? 's' : ''}?`)) {
                selectedTasks.forEach(cb => cb.closest("li").remove());
                saveTasks();
            }}
    });
    
    document.addEventListener("keydown", (e) => {
        if (e.key === "Delete") deleteSelectedBtn.click();
    });
    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
    });
    if (localStorage.getItem("darkMode") === "true") body.classList.add("dark-mode");
    loadTasks();

    const animateBackground = () => {
        const colors = ["#bbe7f1", "#e7c797", "#d1eebb", "#e1c0f5", "#c5dff5", "#f8d0d0"];
        let i = 0;
        setInterval(() => document.body.style.backgroundColor = colors[i = (i + 1) % colors.length], 3000);
    };
    animateBackground();
});