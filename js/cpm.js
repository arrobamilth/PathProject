const actividades = [];

function agregarActividad() {
  const nombre = document.getElementById("nombre").value.trim();
  const duracion = parseInt(document.getElementById("duracion").value);
  const predecesores = document
    .getElementById("predecesores")
    .value.split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");

  if (!nombre || isNaN(duracion)) {
    alert("Por favor, completa nombre y duración");
    return;
  }

  actividades.push({ nombre, duracion, predecesores });
  renderTabla();
  document.getElementById("nombre").value = "";
  document.getElementById("duracion").value = "";
  document.getElementById("predecesores").value = "";
}

function renderTabla() {
  const tbody = document.getElementById("tabla-actividades");
  tbody.innerHTML = "";
  actividades.forEach((a, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>${a.duracion}</td>
      <td>${a.predecesores.join(", ")}</td>
      <td><button onclick="eliminarActividad(${index})">X</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarActividad(index) {
  actividades.splice(index, 1);
  renderTabla();
}

function calcularCPM() {
  if (actividades.length === 0) {
    alert("Agrega actividades primero");
    return;
  }

  const nodos = {};
  const nombres = actividades.map((a) => a.nombre);
  actividades.forEach((a) => {
    nodos[a.nombre] = {
      nombre: a.nombre,
      duracion: a.duracion,
      predecesores: a.predecesores,
      sucesores: [],
      ES: 0,
      EF: 0,
      LS: 0,
      LF: 0,
      holgura: 0,
    };
  });

  // Establecer sucesores
  actividades.forEach((a) => {
    a.predecesores.forEach((p) => {
      if (nodos[p]) {
        nodos[p].sucesores.push(a.nombre);
      }
    });
  });

  // Calculo de ES y EF
  const visitados = new Set();
  function avanzar(nodo) {
    if (visitados.has(nodo)) return;
    visitados.add(nodo);

    const act = nodos[nodo];
    if (act.predecesores.length > 0) {
      act.ES = Math.max(...act.predecesores.map((p) => nodos[p].EF));
    }
    act.EF = act.ES + act.duracion;

    act.sucesores.forEach((s) => avanzar(s));
  }

  nombres.forEach((n) => {
    if (nodos[n].predecesores.length === 0) avanzar(n);
  });

  // Calculo de LF y LS (hacia atrás)
  const fin = Math.max(...nombres.map((n) => nodos[n].EF));
  nombres.forEach((n) => {
    nodos[n].LF = fin;
    nodos[n].LS = fin - nodos[n].duracion;
  });

  const backVisit = new Set();
  function retroceder(nodo) {
    if (backVisit.has(nodo)) return;
    backVisit.add(nodo);

    const act = nodos[nodo];
    if (act.sucesores.length > 0) {
      act.LF = Math.min(...act.sucesores.map((s) => nodos[s].LS));
      act.LS = act.LF - act.duracion;
    }

    act.predecesores.forEach((p) => retroceder(p));
  }

  nombres.forEach((n) => {
    if (nodos[n].sucesores.length === 0) retroceder(n);
  });

  // Calcular holgura
  nombres.forEach((n) => {
    const act = nodos[n];
    act.holgura = act.LS - act.ES;
  });

  // Ruta crítica
  const rutaCritica = nombres.filter((n) => nodos[n].holgura === 0);

  // Mostrar resultados
  document.getElementById("resultado").innerHTML = `
    <h3>Resumen del Proyecto</h3>
    <p><strong>Duración total:</strong> ${fin}</p>
    <p><strong>Ruta crítica:</strong> ${rutaCritica.join(" → ")}</p>
  `;

  dibujarDiagrama(nodos, rutaCritica);
}

function dibujarDiagrama(nodos, rutaCritica) {
  const contenedor = document.getElementById("diagrama-red");
  contenedor.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", 150 * Object.keys(nodos).length);
  svg.setAttribute("height", 200);

  let x = 20;
  const y = 50;
  Object.values(nodos).forEach((nodo) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Caja del nodo
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", 100);
    rect.setAttribute("height", 60);
    rect.setAttribute("fill", rutaCritica.includes(nodo.nombre) ? "#ffdddd" : "#e0ecff");
    rect.setAttribute("stroke", "#000");
    group.appendChild(rect);

    // Texto
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", x + 10);
    texto.setAttribute("y", y + 20);
    texto.textContent = `${nodo.nombre} (${nodo.duracion})`;
    group.appendChild(texto);

    // Datos ES/EF
    const texto2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto2.setAttribute("x", x + 10);
    texto2.setAttribute("y", y + 40);
    texto2.textContent = `ES:${nodo.ES} EF:${nodo.EF}`;
    group.appendChild(texto2);

    const texto3 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto3.setAttribute("x", x + 10);
    texto3.setAttribute("y", y + 55);
    texto3.textContent = `LS:${nodo.LS} LF:${nodo.LF}`;
    group.appendChild(texto3);

    svg.appendChild(group);
    x += 120;
  });

  contenedor.appendChild(svg);
}
