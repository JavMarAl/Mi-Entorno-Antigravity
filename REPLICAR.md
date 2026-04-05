# 🚀 Guía de Replicación de Entorno Antigravity

Esta guía contiene todo lo necesario para reconstruir tu entorno de trabajo completo en una nueva instalación.

## 📦 Componentes del Respaldo
El repositorio contiene:
1.  **Metaanalista**: El núcleo de tu proyecto actual.
2.  **Trabajos_Antigravity**: Todos tus proyectos anteriores y sub-módulos.
3.  **Skills (80+)**: Localizadas en `Metaanalista/skills/`.

## 🛠️ Requisitos Previos
Antes de restaurar, asegúrate de tener instalado:
-   **Git**: [git-scm.com](https://git-scm.com/)
-   **Python 3.10+**: [python.org](https://www.python.org/)
-   **Node.js**: [nodejs.org](https://nodejs.org/)
-   **Google Antigravity**: Tu asistente de confianza.

## 📂 Pasos para Restaurar
1.  **Clonar el Repositorio**:
    ```bash
    git clone https://github.com/TU_USUARIO/NOMBRE_REPO.git
    cd NOMBRE_REPO
    ```
2.  **Restaurar Secretos**:
    Debes recrear manualmente los archivos `.env` con tus claves API. Mira los archivos `.env.example` si existen, o recupera tus claves de tus fuentes seguras.
3.  **Instalar Dependencias de Python**:
    ```bash
    pip install -r Metaanalista/requirements.txt
    ```
4.  **Importar Habilidades**:
    Copia la carpeta `Metaanalista/skills/` a la ubicación que requiera tu nueva instalación de Google Antigravity.

## 💾 Nota sobre Apps de Windows
El archivo `apps_backup.json` en la raíz contiene la lista de tus programas de Windows. Puedes reinstalarlos usando:
```powershell
winget import -i apps_backup.json
```

---
*Mantenido por el asistente de Antigravity.*
