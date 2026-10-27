// Tabla periódica: símbolo y nombre en español, ordenados por número atómico.
const LISTA: [string, string][] = [
  ["H", "Hidrógeno"],
  ["He", "Helio"],
  ["Li", "Litio"],
  ["Be", "Berilio"],
  ["B", "Boro"],
  ["C", "Carbono"],
  ["N", "Nitrógeno"],
  ["O", "Oxígeno"],
  ["F", "Flúor"],
  ["Ne", "Neón"],
  ["Na", "Sodio"],
  ["Mg", "Magnesio"],
  ["Al", "Aluminio"],
  ["Si", "Silicio"],
  ["P", "Fósforo"],
  ["S", "Azufre"],
  ["Cl", "Cloro"],
  ["Ar", "Argón"],
  ["K", "Potasio"],
  ["Ca", "Calcio"],
  ["Sc", "Escandio"],
  ["Ti", "Titanio"],
  ["V", "Vanadio"],
  ["Cr", "Cromo"],
  ["Mn", "Manganeso"],
  ["Fe", "Hierro"],
  ["Co", "Cobalto"],
  ["Ni", "Níquel"],
  ["Cu", "Cobre"],
  ["Zn", "Zinc"],
  ["Ga", "Galio"],
  ["Ge", "Germanio"],
  ["As", "Arsénico"],
  ["Se", "Selenio"],
  ["Br", "Bromo"],
  ["Kr", "Kriptón"],
  ["Rb", "Rubidio"],
  ["Sr", "Estroncio"],
  ["Y", "Itrio"],
  ["Zr", "Circonio"],
  ["Nb", "Niobio"],
  ["Mo", "Molibdeno"],
  ["Tc", "Tecnecio"],
  ["Ru", "Rutenio"],
  ["Rh", "Rodio"],
  ["Pd", "Paladio"],
  ["Ag", "Plata"],
  ["Cd", "Cadmio"],
  ["In", "Indio"],
  ["Sn", "Estaño"],
  ["Sb", "Antimonio"],
  ["Te", "Telurio"],
  ["I", "Yodo"],
  ["Xe", "Xenón"],
  ["Cs", "Cesio"],
  ["Ba", "Bario"],
  ["La", "Lantano"],
  ["Ce", "Cerio"],
  ["Pr", "Praseodimio"],
  ["Nd", "Neodimio"],
  ["Pm", "Prometio"],
  ["Sm", "Samario"],
  ["Eu", "Europio"],
  ["Gd", "Gadolinio"],
  ["Tb", "Terbio"],
  ["Dy", "Disprosio"],
  ["Ho", "Holmio"],
  ["Er", "Erbio"],
  ["Tm", "Tulio"],
  ["Yb", "Iterbio"],
  ["Lu", "Lutecio"],
  ["Hf", "Hafnio"],
  ["Ta", "Tantalio"],
  ["W", "Wolframio"],
  ["Re", "Renio"],
  ["Os", "Osmio"],
  ["Ir", "Iridio"],
  ["Pt", "Platino"],
  ["Au", "Oro"],
  ["Hg", "Mercurio"],
  ["Tl", "Talio"],
  ["Pb", "Plomo"],
  ["Bi", "Bismuto"],
  ["Po", "Polonio"],
  ["At", "Astato"],
  ["Rn", "Radón"],
  ["Fr", "Francio"],
  ["Ra", "Radio"],
  ["Ac", "Actinio"],
  ["Th", "Torio"],
  ["Pa", "Protactinio"],
  ["U", "Uranio"],
  ["Np", "Neptunio"],
  ["Pu", "Plutonio"],
  ["Am", "Americio"],
  ["Cm", "Curio"],
  ["Bk", "Berkelio"],
  ["Cf", "Californio"],
  ["Es", "Einstenio"],
  ["Fm", "Fermio"],
  ["Md", "Mendelevio"],
  ["No", "Nobelio"],
  ["Lr", "Laurencio"],
  ["Rf", "Rutherfordio"],
  ["Db", "Dubnio"],
  ["Sg", "Seaborgio"],
  ["Bh", "Bohrio"],
  ["Hs", "Hasio"],
  ["Mt", "Meitnerio"],
  ["Ds", "Darmstatio"],
  ["Rg", "Roentgenio"],
  ["Cn", "Copernicio"],
  ["Nh", "Nihonio"],
  ["Fl", "Flerovio"],
  ["Mc", "Moscovio"],
  ["Lv", "Livermorio"],
  ["Ts", "Teneso"],
  ["Og", "Oganesón"],
];

export type Elemento = { z: number; simbolo: string; nombre: string; fila: number; columna: number };

/** Posición en la cuadrícula estándar de 18 columnas; lantánidos y actínidos en las filas 9 y 10. */
function posicion(z: number): [number, number] {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  const periodos: [number, number, number][] = [
    [3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5], [55, 86, 6], [87, 118, 7],
  ];
  for (const [ini, fin, p] of periodos) {
    if (z < ini || z > fin) continue;
    const i = z - ini;
    if (p <= 3) return [p, i < 2 ? i + 1 : i + 11];
    if (p <= 5) return [p, i + 1];
    // Periodos 6 y 7: bloque f aparte
    if (i < 2) return [p, i + 1];
    if (i < 17) return [p === 6 ? 9 : 10, i + 1];
    return [p, i - 13];
  }
  throw new Error("Z fuera de rango: " + z);
}

export const ELEMENTOS: Elemento[] = LISTA.map(([simbolo, nombre], i) => {
  const [fila, columna] = posicion(i + 1);
  return { z: i + 1, simbolo, nombre, fila, columna };
});

export const SIMBOLOS = new Set(LISTA.map(([s]) => s));
export const POR_SIMBOLO = new Map(ELEMENTOS.map((e) => [e.simbolo, e]));
