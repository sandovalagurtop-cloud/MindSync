const STORAGE_KEY = "mindsync_tasks_v3";

function getTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}
let tasks = getTasks();

const messages = [
  "Pequeños pasos también te acercan a tus metas.",
  "No necesitas hacerlo todo hoy: empieza por algo.",
  "Tu esfuerzo de hoy construye tu avance de mañana.",
  "Organizarte también es una forma de cuidarte.",
  "Una tarea a la vez. Tú puedes con ello."
];

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getStats() {
  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.length - completed;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const load = Math.min(100, pending * 15);
  return { completed, pending, progress, load };
}

function recommendation() {
  return messages[new Date().getDate() % messages.length];
}

function render(page) {
  const main = document.getElementById("main");
  if (!main) return;
  const stats = getStats();
  const current = page || "home";
  let html = "";

  if (current === "home") {
    html = `
      <div class="page">
        <h1>Hola 👋</h1>
        <p class="muted">Organiza tu día y avanza a tu ritmo.</p>

        <div class="card hero row">
          <div>
            <h2>Tu carga mental</h2>
            <p class="muted">${stats.load < 35 ? "Vas con buen equilibrio. ¡Sigue así!" : "Tienes varias tareas. Ve paso a paso."}</p>
          </div>
          <div class="ring" style="--p:${stats.load}%"><span>${stats.load}%</span></div>
        </div>

        <div class="grid">
          <div class="card stat">${stats.pending}<small>Pendientes</small></div>
          <div class="card stat">${stats.completed}<small>Completadas</small></div>
          <div class="card stat">${stats.progress}%<small>Avance</small></div>
        </div>

        <div class="card quote">
          <b>💡 Recomendación de hoy</b>
          <p>${recommendation()}</p>
        </div>

        <button class="btn" onclick="render('tasks')">Ver mis tareas y retos →</button>
      </div>`;
  }

  if (current === "tasks") {
    let list = "";
    if (tasks.length === 0) {
      list = `<div class="card" style="text-align:center;padding:50px 20px">
        <div style="font-size:48px">📚</div>
        <h2>Aún no tienes tareas</h2>
        <p class="muted">Presiona + para agregar tu primera tarea.</p>
      </div>`;
    } else {
      list = tasks.map((task, index) => `
        <div class="card task">
          <button class="check ${task.done ? "done" : ""}" onclick="toggleTask(${index})">${task.done ? "✓" : ""}</button>
          <div style="flex:1">
            <b>${escapeHtml(task.name)}</b>
            <div class="muted">${task.date || "Sin fecha"} · ${task.time || 30} min</div>
          </div>
          <small>${task.priority || "Normal"}</small>
        </div>`).join("");
    }
    html = `<div class="page">
      <h1>Mis retos 🎯</h1>
      <p class="muted">Avanza paso a paso.</p>
      ${list}
      <button class="add" onclick="openTaskModal()">+</button>
    </div>`;
  }

  if (current === "well") {
    const level = stats.load < 35 ? "Baja" : stats.load < 65 ? "Moderada" : "Alta";
    html = `<div class="page">
      <h1>Tu bienestar 🧠</h1>
      <div class="card" style="text-align:center">
        <h2>Carga mental actual</h2>
        <div class="ring" style="--p:${stats.load}%;margin:auto"><span>${stats.load}%</span></div>
        <h2>${level}</h2>
        <p class="muted">${stats.pending ? "Completa una tarea pequeña para reducir tu carga." : "Tienes todo bajo control. Aprovecha para descansar."}</p>
      </div>
      <div class="card">
        <h2>¿Qué la está afectando?</h2>
        <p>Tareas pendientes: ${stats.pending}</p>
        <div class="progress"><i style="width:${Math.min(100, stats.pending * 18)}%"></i></div>
        <p>Avance completado: ${stats.progress}%</p>
        <div class="progress"><i style="width:${stats.progress}%"></i></div>
      </div>
      <div class="card quote"><b>🌱 Consejo personalizado</b><p>${recommendation()}</p></div>
    </div>`;
  }

  if (current === "calendar") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const labels = ["L","M","X","J","V","S","D"];
    let calendar = labels.map(x => `<b>${x}</b>`).join("");
    calendar += "<span></span>".repeat(firstDay);
    for (let day = 1; day <= totalDays; day++) {
      calendar += `<span class="day ${day === now.getDate() ? "today" : ""}">${day}</span>`;
    }
    const monthName = now.toLocaleDateString("es-PE", { month:"long", year:"numeric" });
    html = `<div class="page">
      <h1>Calendario 📅</h1>
      <div class="card">
        <h2 style="text-align:center;text-transform:capitalize">${monthName}</h2>
        <div class="calendar">${calendar}</div>
      </div>
      <div class="card quote"><b>✨ Mensaje para ti</b><p>${recommendation()}</p></div>
    </div>`;
  }

  if (current === "progress") {
    const streak = calculateStreak();
    html = `<div class="page">
      <h1>Tu progreso 📈</h1>
      <div class="card hero">
        <h3>🔥 Racha actual</h3>
        <h1>${streak} día${streak === 1 ? "" : "s"}</h1>
        <p class="muted">${streak ? "¡Sigue así y mantén tu ritmo!" : "Completa tus tareas del día para iniciar tu racha."}</p>
      </div>
      <div class="card" style="text-align:center">
        <h2>Tu avance general</h2>
        <div class="ring" style="--p:${stats.progress}%;margin:auto"><span>${stats.progress}%</span></div>
        <p class="muted">Porcentaje de tareas completadas.</p>
      </div>
      <div class="card">
        <h2>Logros</h2>
        <p>${stats.completed >= 1 ? "🏅 Primera tarea completada" : "🔒 Completa tu primera tarea"}</p>
        <p>${stats.completed >= 5 ? "⭐ 5 tareas completadas" : "🔒 Completa 5 tareas"}</p>
      </div>
    </div>`;
  }

  main.innerHTML = html;
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  render("tasks");
}

function calculateStreak() {
  // Base simple: muestra una racha cuando el estudiante tiene tareas completadas.
  return tasks.length > 0 && tasks.every(t => t.done) ? 1 : 0;
}

function openTaskModal() {
  const modal = document.getElementById("modal");
  modal.className = "modal";
  modal.innerHTML = `<div class="sheet">
    <h2>Nueva tarea ✨</h2>
    <input id="taskName" placeholder="Nombre de la tarea">
    <input id="taskDate" type="date">
    <input id="taskTime" type="number" min="5" value="30" placeholder="Minutos">
    <select id="taskPriority">
      <option>Normal</option>
      <option>Importante</option>
      <option>Alta</option>
    </select>
    <button class="btn" onclick="addTask()">Agregar tarea</button>
    <button style="width:100%;margin-top:8px;background:#eef0f7" onclick="closeModal()">Cancelar</button>
  </div>`;
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.className = "hidden";
  modal.innerHTML = "";
}

function addTask() {
  const name = document.getElementById("taskName").value.trim();
  if (!name) {
    alert("Escribe el nombre de la tarea.");
    return;
  }
  tasks.push({
    name,
    date: document.getElementById("taskDate").value,
    time: document.getElementById("taskTime").value || 30,
    priority: document.getElementById("taskPriority").value,
    done: false
  });
  saveTasks();
  closeModal();
  render("tasks");
}

function settings() {
  alert("MindSync\n\nAgrega tus tareas, sigue tu progreso y organiza tu tiempo paso a paso.");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

document.addEventListener("DOMContentLoaded", () => render("home"));
