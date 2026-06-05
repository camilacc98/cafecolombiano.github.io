const sources = {
  fncPrice: "Federación Nacional de Cafeteros, precio interno de referencia, 2026-06-04",
  dane: "DANE / DIAN, estadísticas oficiales de exportaciones",
  wits: "WITS / UN Comtrade, Colombia exportaciones producto 090111, 2024",
  nasa: "NASA POWER API, datos meteorológicos por coordenadas",
  huila: "Gobernación del Huila, producción cafetera 2025"
};

const coffeeFacts = {
  nationalProductionBags2025: 14.87,
  huilaBags2025: 2523904,
  huilaShare2025: 19.65,
  coffeeFamilies: 549000,
  smallProducerShare: 96,
  municipalities: 603,
  departments: 22
};

const regions = [
  { name: "Huila", lat: 2.9273, lon: -75.2819, value: 19.65, label: "19,65% cosecha nacional", exact: true },
  { name: "Antioquia", lat: 6.2442, lon: -75.5812, value: 15, label: "Alta aptitud cafetera", exact: false },
  { name: "Tolima", lat: 4.4389, lon: -75.2322, value: 13, label: "Alta aptitud cafetera", exact: false },
  { name: "Cauca", lat: 2.4448, lon: -76.6147, value: 11, label: "Alta aptitud cafetera", exact: false },
  { name: "Santander", lat: 7.1193, lon: -73.1227, value: 9, label: "Alta aptitud cafetera", exact: false }
];

const valueData = [
  {
    stage: "Finca",
    label: "Precio interno FNC",
    copKg: 2005000 / 125,
    note: "$2.005.000 COP / carga de 125 kg"
  },
  {
    stage: "Exportación",
    label: "FOB promedio 2024",
    copKg: (3393408910 / 647962000) * 3561.8,
    note: "US$3.393 millones / 647,9 millones kg"
  }
];

const exportData = [
  {
    country: "Estados Unidos",
    valueUSD: 1319933450,
    kg: 254539000,
    lat: 39.8283,
    lon: -98.5795
  },
  {
    country: "Bélgica",
    valueUSD: 292755140,
    kg: 51796000,
    lat: 50.5039,
    lon: 4.4699
  },
  {
    country: "Canadá",
    valueUSD: 258306410,
    kg: 51144800,
    lat: 56.1304,
    lon: -106.3468
  },
  {
    country: "Alemania",
    valueUSD: 245808550,
    kg: 47020300,
    lat: 51.1657,
    lon: 10.4515
  },
  {
    country: "Japón",
    valueUSD: 177048990,
    kg: 33153300,
    lat: 36.2048,
    lon: 138.2529
  }
];

const colombiaPoint = { lat: 4.5709, lon: -74.2973 };

const formatCOP = d3.format("$,.0f");
const formatUSD = d3.format("$,.2s");
const formatKg = d3.format(",.0f");

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

function showTip(html, event) {
  tooltip
    .style("opacity", 1)
    .html(html)
    .style("left", `${event.clientX}px`)
    .style("top", `${event.clientY}px`);
}

function hideTip() {
  tooltip.style("opacity", 0);
}

/* Coffee particles */
const canvas = document.getElementById("coffeeCanvas");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = Array.from({ length: Math.min(90, Math.floor(window.innerWidth / 16)) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 1 + Math.random() * 3,
    speed: 0.15 + Math.random() * 0.55,
    alpha: 0.12 + Math.random() * 0.35
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y += p.speed;
    if (p.y > canvas.height + 20) {
      p.y = -20;
      p.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * 1.8, p.r, 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214,168,92,${p.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawParticles();

/* Origin viz */
function drawOrigin(step = "origin-1") {
  const el = d3.select("#originViz");
  el.html("");

  const cards = el.append("div").attr("class", "card-grid");

  const items = [
    { value: `${coffeeFacts.nationalProductionBags2025} M`, label: "sacos de 60 kg en el año cafetero 2024/25" },
    { value: coffeeFacts.departments, label: "departamentos cafeteros" },
    { value: coffeeFacts.municipalities, label: "municipios cafeteros" },
    { value: `${coffeeFacts.smallProducerShare}%`, label: "de productores son pequeños" }
  ];

  cards.selectAll(".data-card")
    .data(items)
    .join("div")
    .attr("class", "data-card")
    .html(d => `<strong>${d.value}</strong><span>${d.label}</span>`);

  const width = el.node().clientWidth;
  const height = 360;

  const svg = el.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3.geoMercator()
    .center([-74, 4.4])
    .scale(width * 2.15)
    .translate([width / 2, height / 2 + 35]);

  const size = d3.scaleSqrt()
    .domain([0, 20])
    .range([10, 45]);

  svg.append("text")
    .attr("x", 28)
    .attr("y", 34)
    .attr("fill", "#d6a85c")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text(step === "origin-2" ? "Huila concentra el 19,65% de la cosecha nacional." : "Principales territorios cafeteros destacados");

  const groups = svg.selectAll(".region")
    .data(regions)
    .join("g")
    .attr("class", "region")
    .attr("transform", d => {
      const [x, y] = projection([d.lon, d.lat]);
      return `translate(${x},${y})`;
    });

  groups.append("circle")
    .attr("r", d => step === "origin-1" ? 11 : size(d.value))
    .attr("fill", d => d.name === "Huila" ? "#d6a85c" : "#2f5d46")
    .attr("stroke", "#f7ead2")
    .attr("stroke-opacity", 0.45)
    .attr("stroke-width", 1)
    .on("mousemove", (event, d) => showTip(`<b>${d.name}</b><br>${d.label}<br>${d.exact ? "Dato porcentual verificado." : "Destacado como territorio de alta aptitud cafetera."}`, event))
    .on("mouseleave", hideTip);

  groups.append("text")
    .attr("y", d => -size(d.value) - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#f7ead2")
    .attr("font-family", "Arial")
    .attr("font-size", 12)
    .text(d => d.name);

  groups.filter(d => d.name === "Huila")
    .append("circle")
    .attr("class", "pulse")
    .attr("fill", "none")
    .attr("stroke", "#d6a85c")
    .attr("stroke-width", 2);

  el.append("div")
    .attr("class", "source-note")
    .text(`Fuentes: ${sources.huila}; Agronet; UPRA; FNC.`);
}

/* Value viz */
function drawValue(step = "value-1") {
  const el = d3.select("#valueViz");
  el.html("");

  const width = el.node().clientWidth;
  const height = 560;
  const margin = { top: 70, right: 40, bottom: 90, left: 95 };

  const svg = el.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const activeData = step === "value-1" ? [valueData[0]] : valueData;

  const x = d3.scaleBand()
    .domain(activeData.map(d => d.stage))
    .range([margin.left, width - margin.right])
    .padding(0.38);

  const y = d3.scaleLinear()
    .domain([0, d3.max(valueData, d => d.copKg) * 1.2])
    .range([height - margin.bottom, margin.top]);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 36)
    .attr("fill", "#d6a85c")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text("Valor estimado por kilo, con unidades comparables");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d3.format(",.0f")(d)}`));

  svg.selectAll(".bar")
    .data(activeData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.stage))
    .attr("y", y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("rx", 16)
    .attr("fill", d => d.stage === "Finca" ? "#d6a85c" : "#2f5d46")
    .on("mousemove", (event, d) => showTip(`<b>${d.label}</b><br>${formatCOP(d.copKg)} COP/kg<br>${d.note}`, event))
    .on("mouseleave", hideTip)
    .transition()
    .duration(900)
    .attr("y", d => y(d.copKg))
    .attr("height", d => y(0) - y(d.copKg));

  svg.selectAll(".value-label")
    .data(activeData)
    .join("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.stage) + x.bandwidth() / 2)
    .attr("y", d => y(d.copKg) - 14)
    .attr("text-anchor", "middle")
    .attr("fill", "#f7ead2")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text(d => `${formatCOP(d.copKg)} / kg`);

  if (step === "value-3") {
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - 35)
      .attr("fill", "#cdbb9a")
      .attr("font-family", "Arial")
      .attr("font-size", 12)
      .text("Nota: el valor FOB no equivale al precio final de consumo. La cadena posterior no se estima sin fuente verificable.");
  }

  el.append("div")
    .attr("class", "source-note")
    .text(`Fuentes: ${sources.fncPrice}; ${sources.wits}. TRM usada: 3.561,80 COP/USD publicada por FNC en la misma fecha.`);
}

/* Climate viz */
async function fetchClimateData() {
  const chosen = regions;
  const start = "20250101";
  const end = "20251231";

  const requests = chosen.map(async r => {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,RH2M&community=AG&longitude=${r.lon}&latitude=${r.lat}&start=${start}&end=${end}&format=JSON`;
    const res = await fetch(url);
    const json = await res.json();
    const t = Object.values(json.properties.parameter.T2M);
    const p = Object.values(json.properties.parameter.PRECTOTCORR);
    const h = Object.values(json.properties.parameter.RH2M);

    return {
      name: r.name,
      temp: d3.mean(t),
      rain: d3.sum(p),
      humidity: d3.mean(h)
    };
  });

  return Promise.all(requests);
}

function drawClimateShell(message = "Consultando NASA POWER…") {
  const el = d3.select("#climateViz");
  el.html(`<div class="loading">${message}</div><div class="source-note">Fuente: ${sources.nasa}</div>`);
}

function drawClimate(data, step = "climate-1") {
  const el = d3.select("#climateViz");
  el.html("");

  const metric = step === "climate-2" ? "rain" : step === "climate-3" ? "humidity" : "temp";
  const label = metric === "rain" ? "Precipitación anual estimada (mm)" : metric === "humidity" ? "Humedad relativa promedio (%)" : "Temperatura promedio 2025 (°C)";

  const width = el.node().clientWidth;
  const height = 560;
  const margin = { top: 80, right: 40, bottom: 95, left: 80 };

  const svg = el.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.28);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[metric]) * 1.18])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 38)
    .attr("fill", "#d6a85c")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text(label);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));

  svg.selectAll(".bar")
    .data(data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.name))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("rx", 16)
    .attr("fill", metric === "temp" ? "#d6a85c" : metric === "rain" ? "#2f5d46" : "#7a4828")
    .on("mousemove", (event, d) => showTip(`<b>${d.name}</b><br>Temperatura: ${d.temp.toFixed(1)} °C<br>Lluvia: ${d.rain.toFixed(0)} mm<br>Humedad: ${d.humidity.toFixed(1)}%`, event))
    .on("mouseleave", hideTip)
    .transition()
    .duration(850)
    .attr("y", d => y(d[metric]))
    .attr("height", d => y(0) - y(d[metric]));

  svg.selectAll(".climate-label")
    .data(data)
    .join("text")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d[metric]) - 12)
    .attr("text-anchor", "middle")
    .attr("fill", "#f7ead2")
    .attr("font-family", "Arial")
    .attr("font-size", 12)
    .text(d => metric === "rain" ? d[metric].toFixed(0) : d[metric].toFixed(1));

  el.append("div")
    .attr("class", "source-note")
    .text(`Fuente: ${sources.nasa}. Periodo consultado: 2025.`);
}

/* World viz */
function drawWorld(step = "world-1") {
  const el = d3.select("#worldViz");
  el.html("");

  const width = el.node().clientWidth;
  const height = 560;

  const svg = el.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3.geoNaturalEarth1()
    .scale(width / 6.2)
    .translate([width / 2, height / 2 + 20]);

  const visibleData = step === "world-1" ? exportData.slice(0, 1) : exportData;

  svg.append("text")
    .attr("x", 28)
    .attr("y", 38)
    .attr("fill", "#d6a85c")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text("Principales destinos del café verde colombiano, 2024");

  const graticule = d3.geoGraticule10();

  svg.append("path")
    .datum(graticule)
    .attr("d", d3.geoPath(projection))
    .attr("fill", "none")
    .attr("stroke", "rgba(247,234,210,0.08)");

  const col = projection([colombiaPoint.lon, colombiaPoint.lat]);

  visibleData.forEach(d => {
    const dest = projection([d.lon, d.lat]);

    const line = {
      type: "LineString",
      coordinates: [
        [colombiaPoint.lon, colombiaPoint.lat],
        [d.lon, d.lat]
      ]
    };

    svg.append("path")
      .datum(line)
      .attr("class", "route")
      .attr("d", d3.geoPath(projection));

    svg.append("circle")
      .attr("cx", dest[0])
      .attr("cy", dest[1])
      .attr("r", Math.sqrt(d.kg) / 900)
      .attr("fill", "#d6a85c")
      .attr("opacity", 0.82)
      .on("mousemove", event => showTip(`<b>${d.country}</b><br>${formatKg(d.kg)} kg<br>${formatUSD(d.valueUSD)} USD FOB`, event))
      .on("mouseleave", hideTip);

    svg.append("text")
      .attr("x", dest[0] + 9)
      .attr("y", dest[1] - 9)
      .attr("fill", "#f7ead2")
      .attr("font-family", "Arial")
      .attr("font-size", 12)
      .text(d.country);
  });

  svg.append("circle")
    .attr("cx", col[0])
    .attr("cy", col[1])
    .attr("r", 8)
    .attr("fill", "#2f5d46")
    .attr("stroke", "#f7ead2");

  svg.append("text")
    .attr("x", col[0] + 12)
    .attr("y", col[1] + 4)
    .attr("fill", "#f7ead2")
    .attr("font-family", "Arial")
    .attr("font-size", 13)
    .text("Colombia");

  if (step === "world-3") {
    const totalKg = d3.sum(exportData, d => d.kg);
    const totalUsd = d3.sum(exportData, d => d.valueUSD);

    svg.append("foreignObject")
      .attr("x", 28)
      .attr("y", height - 145)
      .attr("width", width - 56)
      .attr("height", 110)
      .html(`
        <div class="data-card">
          <strong>${formatKg(totalKg)} kg</strong>
          <span>exportados hacia estos cinco destinos principales, por un valor FOB aproximado de ${formatUSD(totalUsd)} USD.</span>
        </div>
      `);
  }

  el.append("div")
    .attr("class", "source-note")
    .text(`Fuente: ${sources.wits}. Producto 090111: café sin tostar ni descafeinar.`);
}

/* Scroll control */
let climateData = null;

const scroller = scrollama();

function handleStepEnter(response) {
  const step = response.element.dataset.step;

  if (step?.startsWith("origin")) drawOrigin(step);
  if (step?.startsWith("value")) drawValue(step);
  if (step?.startsWith("world")) drawWorld(step);

  if (step?.startsWith("climate")) {
    if (climateData) {
      drawClimate(climateData, step);
    } else {
      drawClimateShell("Consultando datos reales de NASA POWER…");
    }
  }

  d3.selectAll(".step").style("opacity", 0.42);
  d3.select(response.element).style("opacity", 1);
}

function initScroll() {
  scroller
    .setup({
      step: ".step",
      offset: 0.55,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}

async function init() {
  drawOrigin("origin-1");
  drawValue("value-1");
  drawClimateShell();
  drawWorld("world-1");
  initScroll();

  try {
    climateData = await fetchClimateData();
    drawClimate(climateData, "climate-1");
  } catch (err) {
    drawClimateShell("No se pudo cargar NASA POWER. Revisa conexión a internet o abre el proyecto con Live Server.");
    console.error(err);
  }
}

init();