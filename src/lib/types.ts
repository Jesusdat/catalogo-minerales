export type Localidad = { nombre: string; region: string; lat: number; lon: number };

export type Imagen = {
  src: string;
  autor: string;
  licencia: string;
  licencia_url: string;
  fuente: string;
};

export type Habito =
  | "cubo"
  | "octaedro"
  | "tetraedro"
  | "romboedro"
  | "prisma-hexagonal"
  | "prisma-hexagonal-plano"
  | "tabular-hexagonal"
  | "bipiramide-hexagonal"
  | "bipiramide"
  | "prisma-tetragonal"
  | "prisma-ortorrombico"
  | "tabular-ortorrombico"
  | "prisma-monoclinico";

export type RayaGrupo = "blanca" | "negra" | "gris" | "roja" | "verde" | "azul" | "amarilla" | "marron" | "ninguna";

export type Mineral = {
  id: string;
  nombre: string;
  formula: string;
  clase: string;
  dureza_min: number;
  dureza_max: number;
  densidad: number | null;
  sistema: string;
  habito: Habito;
  brillo: string;
  color: string;
  raya: string;
  raya_grupo: RayaGrupo;
  exfoliacion: string;
  fractura: string;
  magnetico: boolean;
  efervescencia: boolean;
  fluorescencia: boolean;
  color_hex: string;
  usos: string;
  descripcion: string;
  localidades: Localidad[];
  imagen: Imagen;
  wikipedia: string;
};

export const SISTEMAS = ["Cúbico", "Tetragonal", "Hexagonal", "Trigonal", "Ortorrómbico", "Monoclínico", "Triclínico", "Amorfo"];
export const CLASES = ["Elementos nativos", "Sulfuros", "Haluros", "Óxidos", "Carbonatos", "Sulfatos", "Fosfatos", "Silicatos"];
export const BRILLOS = ["Metálico", "Submetálico", "Adamantino", "Vítreo", "Resinoso", "Nacarado", "Sedoso", "Graso", "Terroso"];
export const BRILLOS_METALICOS = new Set(["Metálico", "Submetálico"]);
export const RAYAS: { id: RayaGrupo; label: string; hex: string }[] = [
  { id: "blanca", label: "Blanca o incolora", hex: "#F4F2EC" },
  { id: "gris", label: "Gris", hex: "#8A8F96" },
  { id: "negra", label: "Negra o negra verdosa", hex: "#26282B" },
  { id: "roja", label: "Roja o rojo pardo", hex: "#8E3B32" },
  { id: "marron", label: "Marrón", hex: "#7A5A3E" },
  { id: "amarilla", label: "Amarilla o dorada", hex: "#D7AE3E" },
  { id: "verde", label: "Verde", hex: "#5FA77A" },
  { id: "azul", label: "Azul", hex: "#6C93C9" },
  { id: "ninguna", label: "No deja raya", hex: "transparent" },
];
export const HABITOS: { id: Habito; label: string }[] = [
  { id: "cubo", label: "Cubo" },
  { id: "octaedro", label: "Octaedro" },
  { id: "tetraedro", label: "Tetraedro" },
  { id: "romboedro", label: "Romboedro" },
  { id: "prisma-hexagonal", label: "Prisma hexagonal con pirámide" },
  { id: "prisma-hexagonal-plano", label: "Prisma hexagonal" },
  { id: "tabular-hexagonal", label: "Tabular hexagonal" },
  { id: "bipiramide-hexagonal", label: "Bipirámide hexagonal" },
  { id: "bipiramide", label: "Bipirámide rómbica" },
  { id: "prisma-tetragonal", label: "Prisma tetragonal" },
  { id: "prisma-ortorrombico", label: "Prisma ortorrómbico" },
  { id: "tabular-ortorrombico", label: "Tabular ortorrómbico" },
  { id: "prisma-monoclinico", label: "Prisma monoclínico" },
];
export const ESCALA_MOHS = [
  { grado: 1, id: "talco", nombre: "Talco" },
  { grado: 2, id: "yeso", nombre: "Yeso" },
  { grado: 3, id: "calcita", nombre: "Calcita" },
  { grado: 4, id: "fluorita", nombre: "Fluorita" },
  { grado: 5, id: "apatito", nombre: "Apatito" },
  { grado: 6, id: "ortoclasa", nombre: "Ortoclasa" },
  { grado: 7, id: "cuarzo", nombre: "Cuarzo" },
  { grado: 8, id: "topacio", nombre: "Topacio" },
  { grado: 9, id: "corindon", nombre: "Corindón" },
  { grado: 10, id: "diamante", nombre: "Diamante" },
];
