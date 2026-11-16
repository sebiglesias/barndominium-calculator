// Barndominium Cost Calculator Engine
const state = {
  width: 40,
  length: 60,
  height: 16,
  livingPct: 60, // 60% living, 40% shop
  finishLevel: "turnkey", // "shell", "semi_turnkey", "turnkey"
  slabType: "4inch", // "4inch" or "6inch"
  insulationType: "closed_cell" // "closed_cell" or "open_cell"
};

const presets = {
  starter: {
    name: "30x40 Starter (1,200 sq ft)",
    width: 30,
    length: 40,
    height: 14,
    livingPct: 100,
    finishLevel: "turnkey",
    slabType: "4inch"
  },
  family_shop: {
    name: "40x60 Popular (2,400 sq ft - 60/40 Split)",
    width: 40,
    length: 60,
    height: 16,
    livingPct: 60,
    finishLevel: "turnkey",
    slabType: "4inch"
  },
  estate: {
    name: "50x80 Estate Shop (4,000 sq ft - 50/50 Split)",
    width: 50,
    length: 80,
    height: 18,
    livingPct: 50,
    finishLevel: "turnkey",
    slabType: "6inch"
  },
  shell_diy: {
    name: "40x60 Shell Only (DIY Finish)",
    width: 40,
    length: 60,
    height: 16,
    livingPct: 50,
    finishLevel: "shell",
    slabType: "6inch"
  }
};

function init() {
  attachEventListeners();
  applyPreset("family_shop");
  calculate();
}

function attachEventListeners() {
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyPreset(btn.dataset.preset);
    });
  });

  const widthInput = document.getElementById("bWidth");
  const lengthInput = document.getElementById("bLength");
  const heightInput = document.getElementById("bHeight");
  const splitInput = document.getElementById("bSplit");
  const finishSelect = document.getElementById("finishLevel");
  const slabSelect = document.getElementById("slabType");

  widthInput.addEventListener("input", (e) => {
    state.width = parseFloat(e.target.value) || 0;
    calculate();
  });

  lengthInput.addEventListener("input", (e) => {
    state.length = parseFloat(e.target.value) || 0;
    calculate();
  });

  heightInput.addEventListener("input", (e) => {
    state.height = parseFloat(e.target.value) || 0;
    calculate();
  });

  splitInput.addEventListener("input", (e) => {
    state.livingPct = parseInt(e.target.value, 10);
    document.getElementById("splitValLabel").textContent = state.livingPct + "% Living / " + (100 - state.livingPct) + "% Shop";
    calculate();
  });

  finishSelect.addEventListener("change", (e) => {
    state.finishLevel = e.target.value;
    calculate();
  });

  slabSelect.addEventListener("change", (e) => {
    state.slabType = e.target.value;
    calculate();
  });

  document.getElementById("copyBtn").addEventListener("click", copyEstimate);
}

function applyPreset(key) {
  const p = presets[key];
  if (!p) return;
  state.width = p.width;
  state.length = p.length;
  state.height = p.height;
  state.livingPct = p.livingPct;
  state.finishLevel = p.finishLevel;
  state.slabType = p.slabType;

  document.getElementById("bWidth").value = p.width;
  document.getElementById("bLength").value = p.length;
  document.getElementById("bHeight").value = p.height;
  document.getElementById("bSplit").value = p.livingPct;
  document.getElementById("splitValLabel").textContent = p.livingPct + "% Living / " + (100 - p.livingPct) + "% Shop";
  document.getElementById("finishLevel").value = p.finishLevel;
  document.getElementById("slabType").value = p.slabType;

  calculate();
}

function calculate() {
  const totalSqFt = state.width * state.length;
  const livingSqFt = Math.round(totalSqFt * (state.livingPct / 100));
  const shopSqFt = totalSqFt - livingSqFt;

  // Update Split Bar
  const livingBar = document.getElementById("splitLivingBar");
  const shopBar = document.getElementById("splitShopBar");
  if (livingBar && shopBar) {
    livingBar.style.width = state.livingPct + "%";
    livingBar.textContent = state.livingPct > 15 ? `${livingSqFt} sq ft (${state.livingPct}%)` : "";
    shopBar.style.width = (100 - state.livingPct) + "%";
    shopBar.textContent = (100 - state.livingPct) > 15 ? `${shopSqFt} sq ft` : "";
  }

  // 1. Slab & Foundation (Concrete, footings, vapor barrier, gravel, labor)
  const slabRatePerSqFt = state.slabType === "6inch" ? 10.50 : 7.75;
  const slabCost = totalSqFt * slabRatePerSqFt;

  // 2. Steel Shell & Erection (Posts, trusses, purlins, 26-ga colored steel, trim)
  const shellRatePerSqFt = 26.00 + (state.height > 16 ? 3.50 : 0);
  const shellCost = totalSqFt * shellRatePerSqFt;

  // 3. Spray Foam Insulation (Closed-cell R-21 to R-30 on roof and exterior walls)
  const wallSurface = 2 * (state.width + state.length) * state.height;
  const roofSurface = totalSqFt * 1.15; // pitch slope factor
  const totalEnvelope = wallSurface + roofSurface;
  const insulationCost = totalEnvelope * 1.85;

  // 4. Interior Framing & Drywall (Partitions, doors, sheetrock, paint)
  let interiorFramingCost = 0;
  if (state.finishLevel === "semi_turnkey" || state.finishLevel === "turnkey") {
    interiorFramingCost = livingSqFt * 32.00 + (shopSqFt > 0 ? shopSqFt * 4.00 : 0);
  }

  // 5. MEP Systems (HVAC mini-splits/ducted, rough & finish plumbing, 200A electrical panel)
  let mepCost = 0;
  if (state.finishLevel === "semi_turnkey") {
    mepCost = livingSqFt * 22.00 + shopSqFt * 6.00;
  } else if (state.finishLevel === "turnkey") {
    mepCost = livingSqFt * 36.00 + shopSqFt * 9.00;
  }

  // 6. Residential Finishes (Kitchen cabinets, quartz/granite counters, bathrooms, flooring, fixtures)
  let finishCost = 0;
  if (state.finishLevel === "turnkey") {
    finishCost = livingSqFt * 48.00;
  }

  // 7. Site prep, permits, engineering stamp, architectural layout
  const sitePrepCost = 8500;

  // Total
  const totalCost = slabCost + shellCost + insulationCost + interiorFramingCost + mepCost + finishCost + sitePrepCost;
  const costPerSqFt = totalCost / totalSqFt;

  // Low / High Range (-12% / +15% regional market variance)
  const lowCost = totalCost * 0.88;
  const highCost = totalCost * 1.15;

  // Update UI Elements
  document.getElementById("totalBudget").textContent = "$" + Math.round(totalCost).toLocaleString("en-US");
  document.getElementById("budgetRange").textContent = "$" + Math.round(lowCost).toLocaleString("en-US") + " – $" + Math.round(highCost).toLocaleString("en-US");
  document.getElementById("costPerSqFt").textContent = "$" + Math.round(costPerSqFt) + " / sq ft";
  document.getElementById("totalArea").textContent = totalSqFt.toLocaleString("en-US") + " sq ft";
  document.getElementById("livingArea").textContent = livingSqFt.toLocaleString("en-US") + " sq ft";
  document.getElementById("shopArea").textContent = shopSqFt.toLocaleString("en-US") + " sq ft";

  // Table items
  document.getElementById("tdSlab").textContent = "$" + Math.round(slabCost).toLocaleString("en-US");
  document.getElementById("tdShell").textContent = "$" + Math.round(shellCost).toLocaleString("en-US");
  document.getElementById("tdInsulation").textContent = "$" + Math.round(insulationCost).toLocaleString("en-US");
  document.getElementById("tdFraming").textContent = "$" + Math.round(interiorFramingCost).toLocaleString("en-US");
  document.getElementById("tdMep").textContent = "$" + Math.round(mepCost).toLocaleString("en-US");
  document.getElementById("tdFinishes").textContent = "$" + Math.round(finishCost).toLocaleString("en-US");
  document.getElementById("tdSite").textContent = "$" + Math.round(sitePrepCost).toLocaleString("en-US");
}

function copyEstimate() {
  const budget = document.getElementById("totalBudget").textContent;
  const range = document.getElementById("budgetRange").textContent;
  const area = document.getElementById("totalArea").textContent;
  const living = document.getElementById("livingArea").textContent;
  const shop = document.getElementById("shopArea").textContent;

  const text = `🏡 Barndominium Cost Estimate Summary
Total Dimensions: ${state.width} ft x ${state.length} ft (${state.height} ft Eave)
Total Footprint: ${area} (${living} Living / ${shop} Shop)
Finish Tier: ${state.finishLevel.toUpperCase()}
Slab Type: ${state.slabType === "6inch" ? "6-inch Heavy Duty" : "4-inch Standard"}

Estimated Total Cost: ${budget}
Regional Range: ${range}
Calculated with Barndominium Cost Calculator: https://sebiglesias.com.ar/barndominium-calculator/`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "✅ Estimate Copied to Clipboard!";
    setTimeout(() => {
      btn.textContent = "📋 Copy Itemized Estimate to Clipboard";
    }, 2500);
  });
}

window.addEventListener("DOMContentLoaded", init);
