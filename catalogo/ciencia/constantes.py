"""Vocabulario controlado del catálogo."""

CLASES = ["Elementos nativos", "Sulfuros", "Haluros", "Óxidos", "Carbonatos", "Sulfatos", "Fosfatos", "Silicatos"]
SISTEMAS = ["Cúbico", "Tetragonal", "Hexagonal", "Trigonal", "Ortorrómbico", "Monoclínico", "Triclínico", "Amorfo"]
BRILLOS = ["Metálico", "Submetálico", "Adamantino", "Vítreo", "Resinoso", "Nacarado", "Sedoso", "Graso", "Terroso"]
BRILLOS_METALICOS = {"Metálico", "Submetálico"}

RAYAS = [
    ("blanca", "Blanca o incolora", "#F4F2EC"),
    ("gris", "Gris", "#8A8F96"),
    ("negra", "Negra o negra verdosa", "#26282B"),
    ("roja", "Roja o rojo pardo", "#8E3B32"),
    ("marron", "Marrón", "#7A5A3E"),
    ("amarilla", "Amarilla o dorada", "#D7AE3E"),
    ("verde", "Verde", "#5FA77A"),
    ("azul", "Azul", "#6C93C9"),
    ("ninguna", "No deja raya", "transparent"),
]

HABITOS = [
    ("cubo", "Cubo"),
    ("octaedro", "Octaedro"),
    ("tetraedro", "Tetraedro"),
    ("romboedro", "Romboedro"),
    ("prisma-hexagonal", "Prisma hexagonal con pirámide"),
    ("prisma-hexagonal-plano", "Prisma hexagonal"),
    ("tabular-hexagonal", "Tabular hexagonal"),
    ("bipiramide-hexagonal", "Bipirámide hexagonal"),
    ("bipiramide", "Bipirámide rómbica"),
    ("prisma-tetragonal", "Prisma tetragonal"),
    ("prisma-ortorrombico", "Prisma ortorrómbico"),
    ("tabular-ortorrombico", "Tabular ortorrómbico"),
    ("prisma-monoclinico", "Prisma monoclínico"),
]

ESCALA_MOHS = [
    (1, "talco", "Talco"),
    (2, "yeso", "Yeso"),
    (3, "calcita", "Calcita"),
    (4, "fluorita", "Fluorita"),
    (5, "apatito", "Apatito"),
    (6, "ortoclasa", "Ortoclasa"),
    (7, "cuarzo", "Cuarzo"),
    (8, "topacio", "Topacio"),
    (9, "corindon", "Corindón"),
    (10, "diamante", "Diamante"),
]
