"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

// ===========================
// Datos base y tablas de talla
// ===========================
// Tallas base para prendas superiores.
const TOP_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
// Tallas numericas para pantalon regular (de 2 en 2).
const PANT_SIZES_REGULAR = [36, 38, 40, 42, 44, 46, 48, 50] as const;
// Tallas numericas para pantalon slim (de 2 en 2).
const PANT_SIZES_SLIM = [38, 40, 42, 44, 46, 48, 50, 52] as const;
// Tabla de medidas de pantalon regular (A/B/C) en cm.
const PANT_TABLE_REGULAR = [
  { size: 36, a: 38, b: 25.7, c: 107.5 },
  { size: 38, a: 40, b: 26.1, c: 108 },
  { size: 40, a: 42, b: 26.5, c: 108.5 },
  { size: 42, a: 44, b: 26.9, c: 109 },
  { size: 44, a: 46, b: 26.4, c: 109.5 },
  { size: 46, a: 48, b: 27.3, c: 110 },
  { size: 48, a: 50, b: 27.7, c: 110.5 },
  { size: 50, a: 52, b: 28.1, c: 111 },
] as const;

// Tabla de medidas de pantalon slim (A/B/C) en cm.
const PANT_TABLE_SLIM = [
  { size: 38, a: 38, b: 25.2, c: 105 },
  { size: 40, a: 40, b: 25.6, c: 105.5 },
  { size: 42, a: 42, b: 26, c: 106 },
  { size: 44, a: 44, b: 26.4, c: 106.5 },
  { size: 46, a: 46, b: 26.8, c: 107 },
  { size: 48, a: 48, b: 27.2, c: 107.5 },
  { size: 50, a: 50, b: 27.6, c: 108 },
  { size: 52, a: 52, b: 29, c: 108.5 },
] as const;

// Tabla de medidas de camisa regular (A/B/C) en cm.
const SHIRT_TABLE_REGULAR = [
  { size: "S", a: 66, b: 54, c: 72 },
  { size: "M", a: 67, b: 56, c: 73 },
  { size: "L", a: 68, b: 58, c: 74 },
  { size: "XL", a: 69, b: 60, c: 75 },
  { size: "2XL", a: 70, b: 62, c: 76 },
  { size: "3XL", a: 71, b: 64, c: 77 },
] as const;

// Tabla de medidas de camisa slim (A/B/C) en cm.
const SHIRT_TABLE_SLIM = [
  { size: "S", a: 65, b: 47, c: 70 },
  { size: "M", a: 66, b: 52, c: 72 },
  { size: "L", a: 67, b: 54, c: 75 },
  { size: "XL", a: 68, b: 57, c: 77 },
  { size: "2XL", a: 69, b: 61, c: 79 },
  { size: "3XL", a: 70, b: 65, c: 81 },
] as const;

// Rangos de IMC para mapear tallas de pantalon.
const PANT_BMI_RANGES = [
  { max: 20, index: 0 },
  { max: 21.5, index: 1 },
  { max: 23, index: 2 },
  { max: 24.5, index: 3 },
  { max: 26, index: 4 },
  { max: 28, index: 5 },
  { max: 30, index: 6 },
  { max: Number.POSITIVE_INFINITY, index: 7 },
] as const;

// ===========================
// Tipos y configuracion
// ===========================
// Opciones de fit.
type Fit = "holgado" | "normal" | "ajustado";

// Opciones de corte para prendas con regular/slim.
type Cut = "regular" | "slim";

// Estado del formulario para inputs controlados.
type FormState = {
  sex: "masculino" | "femenino" | "otro";
  birthYear: string;
  height: string;
  weight: string;
  category: Category;
  cut: Cut;
  fit: Fit;
  heightUnit: "cm" | "in";
  weightUnit: "kg" | "lb";
};

// Categorias de producto.
type Category =
  | "pantalones"
  | "camisas"
  | "sudaderas"
  | "polos"
  | "jerseys"
  | "camisetas";

// Resultado del calculo de talla.
type Result = {
  size: string;
  note: string;
  range?: string;
  measurements?: {
    a: number;
    b: number;
    c: number;
  };
};

// ===========================
// Copys y recursos visuales
// ===========================
// Etiquetas de categorias para selects.
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pantalones", label: "Pantalones" },
  { value: "camisas", label: "Camisas" },
  { value: "sudaderas", label: "Sudaderas" },
  { value: "polos", label: "Polos" },
  { value: "jerseys", label: "Jerseys" },
  { value: "camisetas", label: "Camisetas" },
];

// Imagenes de guia por categoria y corte.
const GUIDE_IMAGES: Record<
  Category,
  { regular: { title: string; src: string }; slim?: { title: string; src: string } }
> = {
  pantalones: {
    regular: { title: "Pantalon regular fit", src: "/guides/pantalon-regular.png" },
    slim: { title: "Pantalon slim fit", src: "/guides/pantalon-slim.png" },
  },
  camisas: {
    regular: { title: "Camisa regular fit", src: "/guides/camisa-regular.png" },
    slim: { title: "Camisa slim fit", src: "/guides/camisa-slim.png" },
  },
  sudaderas: {
    regular: { title: "Sudadera capucha", src: "/guides/sudadera-capucha.png" },
  },
  polos: {
    regular: { title: "Polo manga corta", src: "/guides/polo-manga-corta.png" },
  },
  jerseys: {
    regular: { title: "Jersey", src: "/guides/jersey.png" },
  },
  camisetas: {
    regular: { title: "Camiseta regular fit", src: "/guides/camiseta-regular.png" },
  },
};

// Texto explicativo A/B/C por categoria.
const ABC_COPY: Record<Category, { a: string; b: string; c: string }> = {
  pantalones: {
    a: "A: ancho de cintura.",
    b: "B: tiro de pantalon.",
    c: "C: largo total.",
  },
  camisas: {
    a: "A: largo de la manga.",
    b: "B: ancho de pecho.",
    c: "C: largo total.",
  },
  sudaderas: {
    a: "A: largo de la manga.",
    b: "B: ancho de pecho.",
    c: "C: largo total.",
  },
  polos: {
    a: "A: largo de la manga.",
    b: "B: ancho de pecho.",
    c: "C: largo total.",
  },
  jerseys: {
    a: "A: largo de la manga.",
    b: "B: ancho de pecho.",
    c: "C: largo total.",
  },
  camisetas: {
    a: "A: largo de la manga.",
    b: "B: ancho de pecho.",
    c: "C: largo total.",
  },
};

// ===========================
// Utilidades y calculo
// ===========================
// Ajuste de talla segun fit.
const fitAdjust: Record<Fit, number> = {
  holgado: 1,
  normal: 0,
  ajustado: -1,
};

const CUT_OPTIONS: { value: Cut; label: string }[] = [
  { value: "regular", label: "Regular fit" },
  { value: "slim", label: "Slim fit" },
];

// Helper para limitar valores.
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Algoritmo base (IMC + altura + fit, con mapeo especial para pantalon y camisas).
function computeSize(
  heightCm: number,
  weightKg: number,
  fit: Fit,
  category: Category,
  cut: Cut
): Result {
  // IMC = peso / altura^2 (altura en metros).
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // Base de tallas para prendas superiores.
  let baseIndex = 0;
  if (bmi < 19) baseIndex = 0;
  else if (bmi < 22) baseIndex = 1;
  else if (bmi < 25) baseIndex = 2;
  else if (bmi < 28) baseIndex = 3;
  else if (bmi < 31) baseIndex = 4;
  else baseIndex = 5;

  let heightAdjust = 0;
  if (heightCm >= 185) heightAdjust = 1;
  if (heightCm <= 160) heightAdjust = -1;

  // Ajuste final con fit y altura.
  const indexFloat =
    baseIndex + heightAdjust + fitAdjust[fit];
  const roundedIndex = clamp(
    Math.round(indexFloat),
    0,
    TOP_SIZES.length - 1
  );

  // Talla sugerida y rango aproximado si queda entre dos.
  let sizeLabel: string = TOP_SIZES[roundedIndex];
  let range: string | undefined;
  if (Math.abs(indexFloat - roundedIndex) > 0.35) {
    const lower = clamp(Math.floor(indexFloat), 0, TOP_SIZES.length - 1);
    const upper = clamp(Math.ceil(indexFloat), 0, TOP_SIZES.length - 1);
    if (lower !== upper) {
      range = `${TOP_SIZES[lower]} - ${TOP_SIZES[upper]}`;
    }
  }
  if (category === "pantalones") {
    // Para pantalones se usa tabla y rangos de IMC dedicados.
    const basePantIndex =
      PANT_BMI_RANGES.find((range) => bmi < range.max)?.index ?? 7;
    const pantSizes: number[] =
      cut === "slim"
        ? Array.from(PANT_SIZES_SLIM)
        : Array.from(PANT_SIZES_REGULAR);
    const pantIndexFloat =
      basePantIndex + heightAdjust + fitAdjust[fit];
    let pantIndex = clamp(
      Math.round(pantIndexFloat),
      0,
      pantSizes.length - 1
    );
    sizeLabel = String(pantSizes[pantIndex]);
    if (Math.abs(pantIndexFloat - pantIndex) > 0.35) {
      const lower = clamp(Math.floor(pantIndexFloat), 0, pantSizes.length - 1);
      const upper = clamp(Math.ceil(pantIndexFloat), 0, pantSizes.length - 1);
      if (lower !== upper) {
        range = `${pantSizes[lower]} - ${pantSizes[upper]}`;
      }
    }
  }

  // Nota resumen para mostrar al usuario.
  const categoryLabel =
    CATEGORIES.find((item) => item.value === category)?.label ?? category;
  const cutLabel =
    category === "pantalones" || category === "camisas"
      ? ` | ${cut === "slim" ? "slim fit" : "regular fit"}`
      : "";
  let note = `IMC ${bmi.toFixed(1)} | altura ${heightCm} cm | peso ${weightKg} kg | fit ${fit} | ${categoryLabel}${cutLabel}`;
  let measurements: Result["measurements"];
  if (category === "pantalones") {
    // Medidas en cm para pantalon segun tabla.
    const pantTable = cut === "slim" ? PANT_TABLE_SLIM : PANT_TABLE_REGULAR;
    const metrics = pantTable.find((item) => String(item.size) === sizeLabel);
    if (metrics) {
      measurements = { a: metrics.a, b: metrics.b, c: metrics.c };
    }
  }
  if (category === "camisas") {
    // Medidas en cm para camisa segun tabla.
    const shirtTable = cut === "slim" ? SHIRT_TABLE_SLIM : SHIRT_TABLE_REGULAR;
    const metrics = shirtTable.find((item) => item.size === sizeLabel);
    if (metrics) {
      measurements = { a: metrics.a, b: metrics.b, c: metrics.c };
    }
  }

  return { size: sizeLabel, note, range, measurements };
}

// ===========================
// Componente principal
// ===========================
type SizeGuideProps = {
  standalone?: boolean;
};

export default function SizeGuide({ standalone = true }: SizeGuideProps) {
  // Estado del modal y la UI.
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "result" | "guide">(
    "form"
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const progressTimer = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [guideImageError, setGuideImageError] = useState(false);
  // Valores iniciales del formulario.
  const [form, setForm] = useState<FormState>({
    sex: "masculino",
    birthYear: "",
    height: "175",
    weight: "72",
    category: "camisas",
    cut: "regular",
    fit: "normal",
    heightUnit: "cm",
    weightUnit: "kg",
  });
  const needsCut =
    form.category === "pantalones" || form.category === "camisas";

  // Opciones para el año de nacimiento.
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const list: string[] = [];
    for (let year = now - 14; year >= now - 80; year -= 1) {
      list.push(String(year));
    }
    return list;
  }, []);

  // Edad derivada para mostrar.
  const age = useMemo(() => {
    const year = Number(form.birthYear);
    const now = new Date().getFullYear();
    if (Number.isNaN(year)) return null;
    return now - year;
  }, [form.birthYear]);

  // Resetea error de imagen al cambiar categoria.
  useEffect(() => {
    setGuideImageError(false);
  }, [form.category, form.cut]);

  // Limpieza de timers al desmontar.
  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        window.clearTimeout(progressTimer.current);
      }
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Actualizador generico del formulario.
  function handleChange<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Valida, convierte unidades y calcula la talla.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (progressTimer.current) {
      window.clearTimeout(progressTimer.current);
    }
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
    }

    const heightInput = Number(form.height);
    const weightInput = Number(form.weight);
    const height =
      form.heightUnit === "cm" ? heightInput : heightInput * 2.54;
    const weight =
      form.weightUnit === "kg" ? weightInput : weightInput * 0.453592;
    const birthYear = Number(form.birthYear);
    const now = new Date().getFullYear();

    if (!form.birthYear || Number.isNaN(birthYear)) {
      setResult(null);
      setActiveTab("form");
      setError("Selecciona tu año de nacimiento.");
      return;
    }

    const computedAge = now - birthYear;
    if (computedAge < 12 || computedAge > 80) {
      setResult(null);
      setActiveTab("form");
      setError("El año de nacimiento no es valido.");
      return;
    }

    if (
      !height ||
      !weight ||
      height < 130 ||
      height > 220 ||
      weight < 35 ||
      weight > 200
    ) {
      setResult(null);
      setActiveTab("form");
      setError(
        "Revisa altura y peso. Usa valores reales (ejemplo: 175 cm / 72 kg)."
      );
      return;
    }

    const computed = computeSize(
      height,
      weight,
      form.fit,
      form.category,
      form.cut
    );
    // Muestra resultado y anima barra de progreso.
    setResult(computed);
    setActiveTab("result");
    setIsCalculating(true);
    setProgressValue(0);
    const durationMs = 3000;
    const tickMs = 60;
    const startedAt = Date.now();
    progressInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgressValue(next);
    }, tickMs);
    progressTimer.current = window.setTimeout(() => {
      setProgressValue(100);
      setIsCalculating(false);
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    }, durationMs);
  }

  // Detiene la animacion de progreso.
  function stopProgress() {
    if (progressTimer.current) {
      window.clearTimeout(progressTimer.current);
    }
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
    }
    setIsCalculating(false);
  }

  // Obtiene la guia segun categoria y corte (fallback a regular).
  function getGuideInfo(category: Category, cut: Cut) {
    const guide = GUIDE_IMAGES[category];
    if (cut === "slim" && guide.slim) {
      return guide.slim;
    }
    return guide.regular;
  }

  // Convierte la altura visible al cambiar unidad.
  function switchHeightUnit(nextUnit: FormState["heightUnit"]) {
    if (form.heightUnit === nextUnit) return;
    const raw = Number(form.height);
    if (Number.isNaN(raw) || !raw) {
      setForm((prev) => ({ ...prev, heightUnit: nextUnit }));
      return;
    }
    const converted =
      nextUnit === "cm" ? raw * 2.54 : raw / 2.54;
    const formatted =
      nextUnit === "cm"
        ? Math.round(converted).toString()
        : (Math.round(converted * 10) / 10).toString();
    setForm((prev) => ({ ...prev, height: formatted, heightUnit: nextUnit }));
  }

  // Convierte el peso visible al cambiar unidad.
  function switchWeightUnit(nextUnit: FormState["weightUnit"]) {
    if (form.weightUnit === nextUnit) return;
    const raw = Number(form.weight);
    if (Number.isNaN(raw) || !raw) {
      setForm((prev) => ({ ...prev, weightUnit: nextUnit }));
      return;
    }
    const converted =
      nextUnit === "kg" ? raw * 0.453592 : raw / 0.453592;
    const formatted =
      nextUnit === "kg"
        ? Math.round(converted).toString()
        : (Math.round(converted * 10) / 10).toString();
    setForm((prev) => ({ ...prev, weight: formatted, weightUnit: nextUnit }));
  }

  // Render de la UI.
  return (
    <div className={`guide${standalone ? " standalone" : ""}`}>
      {/* Boton flotante cuando el modal esta cerrado */}
      {!open ? (
        <button className="trigger" onClick={() => setOpen(true)}>
          Encuentra tu talla
        </button>
      ) : null}

      {open ? (
        <div
          className={`modalBackdrop${standalone ? " standalone" : ""}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            {/* Encabezado con logo y cierre */}
            <div className="modalHeader">
              <div className="modalBrand">
                <img
                  src="https://res.cloudinary.com/dfh0xrks3/image/upload/c_fit,w_1920,h_682/c_limit,w_1920/f_auto/q_auto/v1/branding/branding/1769406310429_r27fwo?_a=BAVAZGID0"
                  alt="Logo de la marca"
                  className="brandLogo"
                />
                <div>
                  <div className="modalTitle">Encuentra tu talla</div>
                  <div className="modalSubtitle">Recomendacion rapida y personalizada</div>
                </div>
              </div>
              <button
                className="close"
                onClick={() => {
                  stopProgress();
                  setOpen(false);
                }}
                aria-label="Cerrar"
              >
                X
              </button>
            </div>

            {/* Tabs de navegacion interna */}
            <div className="tabBar">
              <button
                type="button"
                className={`tabButton${activeTab === "form" ? " active" : ""}`}
                onClick={() => {
                  stopProgress();
                  setActiveTab("form");
                }}
              >
                Tus datos
              </button>
              <button
                type="button"
                className={`tabButton${activeTab === "result" ? " active" : ""}`}
                onClick={() => setActiveTab("result")}
                disabled={!result}
              >
                Tu talla
              </button>
              <button
                type="button"
                className={`tabButton${activeTab === "guide" ? " active" : ""}`}
                onClick={() => setActiveTab("guide")}
              >
                Guia de tallas
              </button>
            </div>

            {activeTab === "form" ? (
              // Formulario principal de datos
              <form className="modalBody" onSubmit={handleSubmit}>
                <div className="field" style={{ animationDelay: "0ms" }}>
                  <label>Categoria</label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      handleChange("category", event.target.value as Category)
                    }
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {needsCut ? (
                  // Corte solo para pantalones y camisas
                  <div className="field" style={{ animationDelay: "0ms" }}>
                    <label>Corte</label>
                    <select
                      value={form.cut}
                      onChange={(event) => handleChange("cut", event.target.value as Cut)}
                    >
                      {CUT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="field" style={{ animationDelay: "0ms" }}>
                  <label>Genero</label>
                  <select
                    value={form.sex}
                    onChange={(event) =>
                      handleChange("sex", event.target.value as FormState["sex"])
                    }
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div
                  className={`field${needsCut ? "" : " span2"}`}
                  style={{ animationDelay: "60ms" }}
                >
                  <label>Año de nacimiento</label>
                  <select
                    value={form.birthYear}
                    onChange={(event) => handleChange("birthYear", event.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Altura con toggle de unidades */}
                <div className="field" style={{ animationDelay: "120ms" }}>
                  <label>Altura</label>
                  <div className="inputUnit">
                    <input
                      type="number"
                      min={form.heightUnit === "cm" ? "130" : "51"}
                      max={form.heightUnit === "cm" ? "220" : "87"}
                      value={form.height}
                      onChange={(event) => handleChange("height", event.target.value)}
                    />
                    <span>{form.heightUnit === "cm" ? "cm" : "in"}</span>
                  </div>
                  <div className="unitToggle">
                    <button
                      type="button"
                      className={`unitButton${
                        form.heightUnit === "cm" ? " active" : ""
                      }`}
                      onClick={() => switchHeightUnit("cm")}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      className={`unitButton${
                        form.heightUnit === "in" ? " active" : ""
                      }`}
                      onClick={() => switchHeightUnit("in")}
                    >
                      in
                    </button>
                  </div>
                </div>

                {/* Peso con toggle de unidades */}
                <div className="field" style={{ animationDelay: "180ms" }}>
                  <label>Peso</label>
                  <div className="inputUnit">
                    <input
                      type="number"
                      min={form.weightUnit === "kg" ? "35" : "77"}
                      max={form.weightUnit === "kg" ? "200" : "440"}
                      value={form.weight}
                      onChange={(event) => handleChange("weight", event.target.value)}
                    />
                    <span>{form.weightUnit === "kg" ? "kg" : "lb"}</span>
                  </div>
                  <div className="unitToggle">
                    <button
                      type="button"
                      className={`unitButton${
                        form.weightUnit === "kg" ? " active" : ""
                      }`}
                      onClick={() => switchWeightUnit("kg")}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      className={`unitButton${
                        form.weightUnit === "lb" ? " active" : ""
                      }`}
                      onClick={() => switchWeightUnit("lb")}
                    >
                      lb
                    </button>
                  </div>
                </div>

                <div className="field span2" style={{ animationDelay: "240ms" }}>
                  <label>Como te gustan las prendas</label>
                  <select
                    value={form.fit}
                    onChange={(event) => handleChange("fit", event.target.value as Fit)}
                  >
                    <option value="holgado">Holgado</option>
                    <option value="normal">Normal</option>
                    <option value="ajustado">Ajustado</option>
                  </select>
                </div>

                {error ? <div className="error">{error}</div> : null}

                <div className="actions">
                  <button className="primary" type="submit">
                    Cual es mi talla
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => setActiveTab("guide")}
                  >
                    Ver guia de tallas
                  </button>
                </div>
              </form>
            ) : activeTab === "result" ? (
              // Panel de resultado de talla
              <div className="resultPanel">
                {isCalculating ? (
                  <div className="progressCard">
                    <div className="progressTitle">Calculando tu talla...</div>
                    <div className="progressBar">
                      <span
                        className="progressFill"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                    <div className="progressMeta">
                      {progressValue}% · Usando tu altura, peso y preferencia de fit.
                    </div>
                  </div>
                ) : result ? (
                  <div className="result">
                    <div className="resultBadge">Talla sugerida</div>
                    <div className="resultSize">{result.size}</div>
                    {result.range ? (
                      <div className="resultRange">Entre {result.range}</div>
                    ) : null}
                    <div className="resultNote">
                      {result.note}
                      {age ? ` | edad ${age} años` : null}
                    </div>
                    <div className="resultHint">
                      Esto es una recomendacion basada en altura, peso y fit.
                    </div>
                    {/* Bloque A/B/C para guiar las medidas */}
                    <div className="abcBlock">
                      <div className="abcTitle">Que significan A, B y C</div>
                      <div className="abcText">{ABC_COPY[form.category].a}</div>
                      <div className="abcText">{ABC_COPY[form.category].b}</div>
                      <div className="abcText">{ABC_COPY[form.category].c}</div>
                      {result.measurements ? (
                        <div className="abcValues">
                          <span>A: {result.measurements.a} cm</span>
                          <span>B: {result.measurements.b} cm</span>
                          <span>C: {result.measurements.c} cm</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="result placeholder">
                    Completa el formulario y presiona el boton para ver tu talla.
                  </div>
                )}

                <div className="actions">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      stopProgress();
                      setActiveTab("form");
                    }}
                  >
                    Editar datos
                  </button>
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      stopProgress();
                      setActiveTab("form");
                    }}
                  >
                    Calcular de nuevo
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => setActiveTab("guide")}
                  >
                    Ver guia de tallas
                  </button>
                </div>
              </div>
            ) : (
              // Panel con imagen y explicaciones de guia
              <div className="guidePanel">
                <div className="guideTitle">
                  {getGuideInfo(form.category, form.cut).title}
                </div>
                <div className="guideContent">
                  {!guideImageError ? (
                    <img
                      src={getGuideInfo(form.category, form.cut).src}
                      alt={`Guia de tallas ${getGuideInfo(form.category, form.cut).title}`}
                      className="guideImage"
                      onError={() => setGuideImageError(true)}
                    />
                  ) : (
                    <div className="guidePlaceholder">
                      Sube la imagen en `public/guides` con el nombre
                      <span>{getGuideInfo(form.category, form.cut).src}</span>
                    </div>
                  )}

                  <div className="guideSide">
                    <div className="abcBlock">
                      <div className="abcTitle">Que significan A, B y C</div>
                      <div className="abcText">{ABC_COPY[form.category].a}</div>
                      <div className="abcText">{ABC_COPY[form.category].b}</div>
                      <div className="abcText">{ABC_COPY[form.category].c}</div>
                    </div>
                    {/* Nota de uso para el usuario */}
                    <div className="abcBlock">
                      <div className="abcTitle">Nota</div>
                      <div className="abcText">
                        NOTA: Esto es solo una aproximación detallada, para obtener tu talla con mas exactitud ,
                        puedes medirte manualmente y obtener la talla exacta a través de la tabla de tallas.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <button className="ghost" type="button" onClick={() => setActiveTab("form")}>
                    Volver al formulario
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : null}
    </div>
  );
}
