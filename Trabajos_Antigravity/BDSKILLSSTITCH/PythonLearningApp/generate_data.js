const fs = require('fs');

const dataDir = './backend/data';

// --- Generating Theory Questions (Astalaweb/W3Schools Style) ---
const theoryQuestions = [];
const thData = [
    {
        topic: "Algoritmos",
        correct: "Una secuencia de instrucciones paso a paso para resolver un problema o completar una tarea.",
        distractors: [
            "Un error de sintaxis que impide que el código se ejecute.",
            "Un tipo especial de base de datos para almacenar archivos grandes.",
            "Un lenguaje de programación utilizado exclusivamente para inteligencia artificial.",
            "Una tarjeta gráfica de alto rendimiento."
        ],
        expertExplanation: "Un algoritmo es fundamental en la programación. Básicamente es la 'receta' lógica que le damos a la computadora, detallando el orden exacto de los pasos para que logre un objetivo, como ordenar números o buscar un dato."
    },
    {
        topic: "Variables",
        correct: "Contenedores utilizados para almacenar valores de datos en la memoria de la computadora.",
        distractors: [
            "Módulos preinstalados para crear interfaces gráficas.",
            "Errores que ocurren cuando el programa se queda sin memoria RAM.",
            "Palabras reservadas del lenguaje que no pueden ser modificadas.",
            "Funciones que se ejecutan automáticamente al iniciar un programa."
        ],
        expertExplanation: "Las variables son como cajas etiquetadas donde guardas información (números, texto, listas) para usarla o modificarla más adelante en tu código. Por ejemplo, `edad = 25` crea una variable llamada 'edad'."
    },
    {
        topic: "Bucles (Loops)",
        correct: "Estructuras de control que permiten ejecutar un bloque de código repetidamente mientras se cumpla una condición.",
        distractors: [
            "Sentencias que detienen la ejecución de un programa si ocurre un error.",
            "Funciones que convierten texto a números de forma automática.",
            "Estructuras de datos diseñadas para almacenar datos en forma de tabla.",
            "Comandos exclusivos para conectarse a servidores web externos."
        ],
        expertExplanation: "Los bucles (`for`, `while`) automatizan tareas repetitivas. En lugar de escribir 100 veces el mismo comando, usas un bucle que le dice a la computadora 'ejecuta esto 100 veces' o 'ejecuta esto hasta llegar al final de la lista'."
    },
    {
        topic: "Condicionales",
        correct: "Estructuras que dirigen el flujo del programa ejecutando diferentes bloques de código según si una evaluación es verdadera o falsa.",
        distractors: [
            "Operadores matemáticos que realizan cálculos complejos rápidamente.",
            "Tipos de datos que solo pueden almacenar texto plano.",
            "Librerías que previenen que el código sea copiado por terceros.",
            "Ciclos infinitos utilizados para mantener servidores encendidos."
        ],
        expertExplanation: "Las sentencias condicionales (`if`, `elif`, `else`) son la forma en que los programas toman decisiones. Si la nota del alumno es mayor a 50, imprime 'Aprobado'; de lo contrario, 'Reprobado'."
    },
    {
        topic: "Funciones",
        correct: "Bloques de código reutilizables que solo se ejecutan cuando son llamados, y que pueden recibir parámetros y devolver resultados.",
        distractors: [
            "Variables globales que pueden ser accedidas desde cualquier archivo del sistema.",
            "Errores comunes provocados por usar demasiada memoria caché.",
            "Comandos de la terminal para instalar nuevos paquetes o librerías.",
            "Elementos visuales como botones y menús desplegables."
        ],
        expertExplanation: "Una función empaqueta código para que lo puedas usar múltiples veces sin reescribirlo. Ayuda a organizar, hacer el código más legible y seguir el principio DRY (Don't Repeat Yourself)."
    },
    {
        topic: "Estructuras de Datos",
        correct: "Formatos especializados para organizar, procesar, recuperar y almacenar datos en la memoria para que puedan ser usados eficientemente.",
        distractors: [
            "Lenguajes de marcas utilizados para estructurar páginas web como HTML.",
            "Protocolos de seguridad para encriptar contraseñas en bases de datos.",
            "Componentes de hardware donde se guarda la información permanentemente.",
            "Redes conectadas de computadoras que comparten información en la nube."
        ],
        expertExplanation: "Estructuras como Listas, Diccionarios y Tuplas te permiten almacenar y agrupar datos según tus necesidades. Usas una Lista para datos en orden, o un Diccionario si quieres asociar una llave (como 'nombre') a un valor (como 'Juan')."
    }
];

for (let i = 1; i <= 55; i++) {
    const dataObj = thData[i % thData.length];
    const correctIdx = i % 5;
    let options = [...dataObj.distractors];
    options.splice(correctIdx, 0, dataObj.correct);

    while (options.length < 5) {
        options.push("Un concepto experimental sin uso en programación moderna.");
    }

    options = options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        return `${letter}) ${opt}`;
    });

    theoryQuestions.push({
        id: `th_${i}`,
        question: `Conceptos Generales #${i}: ¿Cuál es la definición correcta de ${dataObj.topic}?`,
        options: options,
        correctAnswer: correctIdx,
        explanation: dataObj.expertExplanation
    });
}
fs.writeFileSync(`${dataDir}/theory_questions.json`, JSON.stringify(theoryQuestions, null, 2));


// --- Generating Python Theory Questions (Astalaweb/W3Schools Style) ---
const pythonTheoryQuestions = [];
const pyData = [
    {
        topic: "Sintaxis de Impresión",
        correct: "print('Hola Mundo')",
        distractors: [
            "echo 'Hola Mundo';",
            "console.log('Hola Mundo');",
            "System.out.println('Hola Mundo');",
            "printf('Hola Mundo')"
        ],
        expertExplanation: "En Python, la función construida (built-in function) para mostrar texto o variables en la pantalla (consola) es `print()`. Recuerda siempre usar comillas para los textos literales."
    },
    {
        topic: "Comentarios",
        correct: "# Este es un comentario en Python",
        distractors: [
            "// Este es un comentario en Python",
            "/* Este es un comentario en Python */",
            "<!-- Este es un comentario en Python -->",
            "' Este es un comentario en Python"
        ],
        expertExplanation: "El símbolo de numeral o almohadilla (`#`) indica al intérprete de Python que ignore todo el texto que sigue en esa línea. Sirven para explicar el código a otros desarrolladores (o a ti mismo en el futuro)."
    },
    {
        topic: "Creación de Variables",
        correct: "x = 5",
        distractors: [
            "int x = 5;",
            "var x = 5",
            "let x = 5;",
            "x : 5"
        ],
        expertExplanation: "En Python no necesitas declarar el tipo de variable ni usar palabras clave como `var` o `int`. Simplemente asignas el valor usando el signo igual (`=`)."
    },
    {
        topic: "Bloques de Código e Indentación",
        correct: "Mediante el uso de espacios en blanco al inicio de la línea (Indentación).",
        distractors: [
            "Usando llaves { } envolviendo el bloque.",
            "Usando la instrucción 'begin' y 'end'.",
            "El inicio de una nueva línea o punto y coma ;.",
            "Usando paréntesis ( ) alrededor del código."
        ],
        expertExplanation: "A diferencia de muchos otros lenguajes (C++, Java, JS) que usan llaves `{}`, Python obliga a estructurar visualmente el código aplicando una sangría (generalmente 4 espacios) dentro de condicionales, funciones y bucles."
    },
    {
        topic: "Tipo de Dato String",
        correct: "Representa cadenas de texto y puede crearse rodeando el texto en comillas simples ('hola') o dobles (\"hola\").",
        distractors: [
            "Representa números decimales y fraccionarios exclusivamente.",
            "Es un tipo de dato lógico que solo puede ser Verdadero o Falso.",
            "Es una colección de elementos que no puede ser alterada tras su creación.",
            "Representa únicamente números enteros sin decimales."
        ],
        expertExplanation: "Un String (str) almacena texto temporal. Python es muy flexible y te deja usar comillas simples o dobles indistintamente, lo cual es muy útil si necesitas incluir otro tipo de comillas dentro de tu texto."
    },
    {
        topic: "Listas en Python",
        correct: "Son colecciones ordenadas, modificables (mutables) y que permiten elementos duplicados. Se escriben con corchetes [ ].",
        distractors: [
            "Son colecciones desordenadas e inmutables. Se escriben con llaves { }.",
            "Son pares de clave-valor donde cada llave debe ser única e inmutable.",
            "Son herramientas matemáticas utilizadas solo para sumar matrices.",
            "Son colecciones ordenadas e inmutables. Se escriben con paréntesis ( )."
        ],
        expertExplanation: "Una Lista es una de las estructuras más usadas en Python. Al usar `[` y `]` puedes guardar números, strings, u otros objetos en un orden determinado, e incluso mezclarlos, como `['Juan', 25, True]`."
    },
    {
        topic: "Extracción de un Elemento (Listas)",
        correct: "mi_lista[1]",
        distractors: [
            "mi_lista[2]",
            "mi_lista.get(1)",
            "mi_lista(2)",
            "mi_lista{1}"
        ],
        expertExplanation: "En Python, los índices empiezan en 0 (Zero-indexed). Para acceder al *segundo* elemento de una lista, debes apuntar al índice 1 usando sintaxis de corchetes."
    }
];

for (let i = 1; i <= 55; i++) {
    const dataObj = pyData[i % pyData.length];
    const correctIdx = (i + 3) % 5;
    let options = [...dataObj.distractors];
    options.splice(correctIdx, 0, dataObj.correct);

    while (options.length < 5) {
        options.push("Un comando obsoleto en las últimas versiones de Python 3.");
    }

    options = options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        return `${letter}) ${opt}`;
    });

    pythonTheoryQuestions.push({
        id: `pyth_${i}`,
        question: `Sintaxis Python #${i}: En relación con ${dataObj.topic}, ¿cuál es la respuesta o sintaxis correcta?`,
        options: options,
        correctAnswer: correctIdx,
        explanation: dataObj.expertExplanation
    });
}
fs.writeFileSync(`${dataDir}/python_theory_questions.json`, JSON.stringify(pythonTheoryQuestions, null, 2));


// --- Generating Python Code Exercises (Astalaweb/W3Schools Style) ---
const codeExercises = [];
const themes = [
    {
        title: "Variables Basicas",
        desc: "El siguiente código debería imprimir el nombre 'Juan'. Asigna el valor del texto 'Juan' a la variable `nombreUsuario`.",
        initialCode: "nombreUsuario =\n\nprint(nombreUsuario)",
        solution: "nombreUsuario = 'Juan'\n\nprint(nombreUsuario)",
        solutionExplanation: "Simplemente usamos el signo igual `=` y aseguramos rodear el texto 'Juan' con comillas ('') para declarar un string."
    },
    {
        title: "Operadores Matemáticos",
        desc: "Multiplica el valor `10` por `5`, y guarda el resultado e imprímelo utilizando la variable provista.",
        initialCode: "resultado = \nprint(resultado)",
        solution: "resultado = 10 * 5\nprint(resultado)",
        solutionExplanation: "El operador para multiplicación en Python es el asterisco `*`."
    },
    {
        title: "Condicionales Lógicos (If)",
        desc: "Escribe la condición If correcta para comprobar si e imprimir '¡Sí, x es más grande!' si `x` es mayor que `y`.",
        initialCode: "x = 50\ny = 10\n\n  x   y:\n  print('¡Sí, x es más grande!')",
        solution: "x = 50\ny = 10\n\nif x > y:\n  print('¡Sí, x es más grande!')",
        solutionExplanation: "Usamos la palabra clave `if`, seguida de la comparación lógica matematica `x > y`, y ¡no olvides los dos puntos `:` al final de la línea!"
    },
    {
        title: "Condicionales, Rutas Alternativas (Else)",
        desc: "Completa el bloque de control añadiendo la cláusula requerida para que imprima 'No.' cuando la primera condición sea estrictamente falsa.",
        initialCode: "a = 50\nb = 50\n\nif a != b:\n  print('Son diferentes')\n        :\n  print('No.')",
        solution: "a = 50\nb = 50\n\nif a != b:\n  print('Son diferentes')\nelse:\n  print('No.')",
        solutionExplanation: "La palabra clave `else` permite ejecutar un bloque de código alternativo si todas las condiciones `if` / `elif` previas fallaron."
    },
    {
        title: "Listas: Añadir Elementos",
        desc: "Utiliza el método de listas adecuado para añadir el objeto 'manzana' al FINAL de la lista llamada frutas.",
        initialCode: "frutas = ['platano', 'cereza', 'kiwi']\n\n\nprint(frutas)",
        solution: "frutas = ['platano', 'cereza', 'kiwi']\nfrutas.append('manzana')\nprint(frutas)",
        solutionExplanation: "El método `.append(valor)` se utiliza para agregar rápidamente un elemento al término de una lista existente."
    },
    {
        title: "Diccionarios: Acceder al Valor",
        desc: "Utiliza la clave adecuada para extraer el valor 'Ford' e imprimirlo en pantalla desde el diccionario vehiculo.",
        initialCode: "vehiculo = {\n  'marca': 'Ford',\n  'modelo': 'Mach-E',\n  'año': 2023\n}\n\nmi_marca = \nprint(mi_marca)",
        solution: "vehiculo = {\n  'marca': 'Ford',\n  'modelo': 'Mach-E',\n  'año': 2023\n}\n\nmi_marca = vehiculo['marca']\nprint(mi_marca)",
        solutionExplanation: "Extráes valores de diccionarios referenciando entre corchetes la clave deseada como string: `diccionario['clave']`."
    },
    {
        title: "Diccionarios: Cambiar Valores",
        desc: "Cambia el valor la clave 'año' permanentemente en el diccionario para reflejar el modelo en 2024.",
        initialCode: "vehiculo = {\n  'marca': 'Ford',\n  'modelo': 'Mach-E',\n  'año': 2023\n}\n\n\n\nprint(vehiculo)",
        solution: "vehiculo = {\n  'marca': 'Ford',\n  'modelo': 'Mach-E',\n  'año': 2023\n}\n\nvehiculo['año'] = 2024\nprint(vehiculo)",
        solutionExplanation: "Para reasignar el valor, llamas la clave de diccionario existente, y aplicas operador un simple operador `=` con tu nuevo valor entero."
    },
    {
        title: "Bucles Iterativos (While)",
        desc: "Crea y cierra un bucle `while` para que la variable i se imprima numéricamente siempre y cuando resulte ser estrictamente menor que 6.",
        initialCode: "i = 1\n       i < 6  \n  print(i)\n  i += 1",
        solution: "i = 1\nwhile i < 6:\n  print(i)\n  i += 1",
        solutionExplanation: "Usaste la palabra reservada `while` seguido de dos puntos. Fíjate cómo la variable `i` se aumenta en 1 obligatoriamente `i+=1` para evitar un bucle infinito."
    },
    {
        title: "Bucles de Pasos (For)",
        desc: "Usa un ciclo programado `for` para iterar, recorrer secuencialmente, imprimir individualmente los ítems de esta lista en consola.",
        initialCode: "frutas = ['manzana', 'platano', 'cereza']\n\n   x   frutas \n  print(x)",
        solution: "frutas = ['manzana', 'platano', 'cereza']\nfor x in frutas:\n  print(x)",
        solutionExplanation: "El bucle `for item in coleccion:` toma transitoriamente cada ítem a una variable por iteración para aplicarle una operación a todas las celdas."
    },
    {
        title: "Creación de Funciones",
        desc: "Define (crea) correctamente y llama a la ejecución una la función de nombre `mi_funcion`.",
        initialCode: "         mi_funcion():\n  print('¡Hola desde una función!')\n\n",
        solution: "def mi_funcion():\n  print('¡Hola desde una función!')\n\nmi_funcion()",
        solutionExplanation: "Para definir se utiliza la palabra reservada `def`. Posteriormente, se invoca colocando el nombre que se le registró, y el pare de parentésis obligatorios `()`."
    }
];

for (let i = 1; i <= 105; i++) {
    const theme = themes[(i - 1) % themes.length];

    codeExercises.push({
        id: `ex_${i}`,
        title: `Ejercicio #${i}: ${theme.title}`,
        description: theme.desc,
        hint: `Revisa la sintaxis en la sección de conceptos de Python.`,
        difficulty: "Práctica Básica",
        initialCode: `# Ejercicio Práctico #${i}: ${theme.title}\n# ---------------------------------------------------\n# Tarea: ${theme.desc}\n# Por favor competa el código a continuación:\n# ---------------------------------------------------\n\n${theme.initialCode}\n`,
        solution: theme.solution,
        solutionExplanation: theme.solutionExplanation
    });
}
fs.writeFileSync(`${dataDir}/code_exercises.json`, JSON.stringify(codeExercises, null, 2));

console.log("¡Re-arquitectura Pedagógica (Estilo Directo W3Schools/Astalaweb) Generada con Éxito!");
