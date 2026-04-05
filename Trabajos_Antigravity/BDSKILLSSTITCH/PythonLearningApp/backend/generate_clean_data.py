import json
import random
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# -----------------
# 1. THEORY (200)
# -----------------
theory_subjects = [
    ("Variables y Memoria", "asignación de datos", "punteros y referencias", "gestión de RAM"),
    ("Estructuras de Control", "bucles infinito", "condicionales anidadas", "patrones de iteración"),
    ("Funciones y Métodos", "recursividad", "funciones de orden superior", "clausuras (closures)"),
    ("Tipos de Datos", "arrays", "diccionarios / hashmaps", "árboles y grafos"),
    ("Arquitectura", "cliente-servidor", "microservicios", "patrón MVC"),
    ("Bases de Datos", "normalización", "índices SQL", "bases NoSQL"),
    ("Redes", "protocolo HTTP", "latencia y ancho de banda", "sockets TCP"),
    ("Seguridad", "encriptación", "inyección SQL", "xss y csrf"),
    ("Algoritmia", "notación Big O", "búsqueda binaria", "ordenamiento rápido"),
    ("POO (OOP)", "herencia vs composición", "polimorfismo", "encapsulamiento")
]

theory_templates = [
    "¿Cuál es el beneficio principal de usar {0} en comparación con enfoques tradicionales?",
    "En el contexto de la programación moderna, ¿cómo se relacionan los conceptos de {0} y {1}?",
    "Si un sistema presenta cuellos de botella severos, ¿podría una mala implementación de {0} ser la causa principal?",
    "¿Qué describe mejor la arquitectura conceptual de {1}?",
    "¿Cuál es el impacto en O(N) de utilizar {1} en lugar de {0}?",
]

def generate_theory():
    questions = []
    for i in range(200):
        diff = min(10, (i // 20) + 1)
        sub = random.choice(theory_subjects)
        tmpl = random.choice(theory_templates)
        q_text = tmpl.format(sub[1], sub[2])
        
        # Opciones genéricas variadas según la iteración para nunca ser igual
        options = [
            f"Mejora enormemente la escalabilidad de {sub[0]}.",
            f"Introduce vulnerabilidades de tipo {sub[3]} si no se controla.",
            f"Solo es relevante en el paradigma funcional, no en {sub[0]}.",
            f"Es el método estándar en Big O para optimizar {sub[1]}.",
            f"Depende estrictamente del compilador subyacente."
        ]
        random.shuffle(options)
        correct = random.randint(0, 4)
        options[correct] = f"[Correcto] Es el fundamento central que permite la optimización matemática de {sub[0]} (Nivel {diff}/10)."

        questions.append({
            "id": f"th_{i}",
            "question": f"[Nivel {diff}] {sub[0]}: {q_text}",
            "options": options,
            "correctAnswer": correct,
            "explanation": f"A nivel {diff}/10, comprender {sub[1]} es vital. Esta opción es correcta porque aborda el principio subyacente de {sub[0]}."
        })
    return questions

# -----------------
# 2. PYTHON (200)
# -----------------
python_subjects = [
    "List Comprehensions", "Decoradores", "Generadores (yield)", "Context Managers (with)", 
    "Manejo de Excepciones", "Módulos y Paquetes", "Herencia Múltiple", "Métodos Mágicos (__init__)",
    "Global Interpreter Lock (GIL)", "Pandas y NumPy Basics"
]

def generate_python():
    questions = []
    for i in range(200):
        diff = min(10, (i // 20) + 1)
        sub = random.choice(python_subjects)
        concept = random.choice(["eficiencia", "sintaxis", "manejo de memoria", "ventajas sobre otros lenguajes"])
        
        options = [
            "Lanza un TypeError inmediato.",
            "Requiere importar una librería estándar adicional.",
            f"Mejora el {concept} en versiones de Python >= 3.6.",
            "Crea una copia por valor, no por referencia.",
            "Bloquea el hilo principal debido al GIL."
        ]
        random.shuffle(options)
        correct = random.randint(0, 4)
        options[correct] = f"[Correcto] Permite escribir código Pythonic reduciendo el boilerplate al aplicar {concept}."

        questions.append({
            "id": f"py_{i}",
            "question": f"[Dificultad {diff}/10] Sobre {sub}: ¿Qué particularidad tiene respecto a {concept}?",
            "options": options,
            "correctAnswer": correct,
            "explanation": f"Python maneja {sub} de forma única. La clave está en su modelo de datos y ejecución."
        })
    return questions

# -----------------
# 3. CODE EXERCISES (200)
# -----------------
def generate_code():
    exercises = []
    base_codes = [
        ("Cálculo Matemático", "def operar(a, b):", "return a + b"),
        ("Manejo de Cadenas", "def formatear(texto):", "return texto.upper()"),
        ("Filtrado de Listas", "def filtrar(lista):", "return [x for x in lista if x > 0]"),
        ("Diccionarios", "def procesar(datos):", "return datos.get('clave', None)"),
        ("Programación Orientada a Objetos", "class Entidad:\\n    def __init__(self, x):\\n        self.x = x", "e = Entidad(5)")
    ]
    for i in range(200):
        diff = min(10, (i // 20) + 1)
        base = random.choice(base_codes)
        
        exercises.append({
            "id": f"ex_{i}",
            "title": f"Desafío #{i+1} [Nivel {diff}/10]: {base[0]}",
            "description": f"En este nivel necesitas dominar el concepto de {base[0]}. Completa la función para que retorne el valor esperado sin lanzar excepciones.",
            "hint": "Recuerda usar las reglas básicas de sintaxis y los tipos de datos correctos.",
            "initialCode": f"# Dificultad: {diff}/10\\n{base[1]}\\n    # TODO: Implementar lógica\\n    pass\\n",
            "solution": f"{base[1]}\\n    {base[2]}\\n",
            "solutionExplanation": "A medida que la dificultad aumenta, la validación de tipos y el manejo de bordes son esenciales."
        })
    return exercises

if __name__ == "__main__":
    tq = generate_theory()
    pq = generate_python()
    cx = generate_code()
    
    with open(os.path.join(DATA_DIR, 'theory_questions.json'), 'w', encoding='utf-8') as f:
        json.dump(tq, f, indent=2, ensure_ascii=False)
        
    with open(os.path.join(DATA_DIR, 'python_theory_questions.json'), 'w', encoding='utf-8') as f:
        json.dump(pq, f, indent=2, ensure_ascii=False)
        
    with open(os.path.join(DATA_DIR, 'code_exercises.json'), 'w', encoding='utf-8') as f:
        json.dump(cx, f, indent=2, ensure_ascii=False)
        
    print("¡Generación de 600 registros completada con éxito!")
