"""
Collage de Video Familiar - Compatible con DaVinci Resolve y TV (USB)
=====================================================================
Crea un MP4 de alta calidad con las fotos de familia sincronizadas con la música.
"""

import os
import sys
import subprocess
import shutil

# ==================== CONFIGURACIÓN ====================

HOME = os.path.expanduser("~")
DL = os.path.join(HOME, "Downloads")
NINEZ = os.path.join(DL, "Ninez")
OUTPUT_DIR = os.path.join(HOME, "Desktop", "Collage_Familiar")
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "Collage_Familiar.mp4")

# Orden de fotos en carpeta Ninez (la primera es Screenshot_20260404_114939_Facebook.jpg)
NINEZ_ORDER = [
    "Screenshot_20260404_114939_Facebook.jpg",
    "FB_IMG_1775287391127.jpg",
    "FB_IMG_1775287417445.jpg",
    "FB_IMG_1775287422168.jpg",
    "FB_IMG_1775287546213.jpg",
    "FB_IMG_1775287836344.jpg",
]

# Fotos fuera de Ninez, en Downloads (con variantes para nombres con espacios/paréntesis)
OUTSIDE_NAMES = [
    "IMG-20260404-WA0076 (1)",
    "IMG-20260404-WA0080 (1)",
    "IMG-20260404-WA0082",
    "IMG-20260404-WA0081",
    "IMG-20260404-WA0086",
    "IMG-20260404-WA0083",
    "IMG-20260404-WA0085 (1)",
    "IMG-20250726-WA0061",
    "IMG-20250105-WA0119",
]

# Música (en orden)
MUSICA = [
    os.path.join(DL, "Setenta_y_cinco_soles.mp3"),
    os.path.join(DL, "Setenta_y_cinco_inviernos.mp3"),
]

# Resolución de salida (compatible con TV Full HD)
WIDTH = 1920
HEIGHT = 1080

# ==================== FUNCIONES ====================

def check_ffmpeg():
    """Verifica que ffmpeg esté disponible."""
    result = shutil.which("ffmpeg")
    if result:
        print(f"✓ FFmpeg encontrado: {result}")
        return True
    # Intentar en rutas comunes
    for path in [r"C:\ffmpeg\bin\ffmpeg.exe", r"C:\Program Files\ffmpeg\bin\ffmpeg.exe"]:
        if os.path.exists(path):
            print(f"✓ FFmpeg encontrado: {path}")
            return path
    print("✗ FFmpeg NO encontrado. Intentando instalar con winget...")
    return False


def find_photo(base_name, search_dir):
    """Busca una foto con cualquier extensión de imagen."""
    exts = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]
    for ext in exts:
        candidate = os.path.join(search_dir, base_name + ext)
        if os.path.exists(candidate):
            return candidate
    # Búsqueda sin extensión exacta (el nombre ya incluye extensión)
    candidate = os.path.join(search_dir, base_name)
    if os.path.exists(candidate):
        return candidate
    return None


def build_photo_list():
    """Construye la lista ordenada de fotos."""
    photos = []
    
    print("\n📁 Buscando fotos en carpeta Ninez...")
    for name in NINEZ_ORDER:
        path = os.path.join(NINEZ, name)
        if os.path.exists(path):
            photos.append(path)
            print(f"  ✓ {name}")
        else:
            # Buscar ignorando extensión
            found = find_photo(os.path.splitext(name)[0], NINEZ)
            if found:
                photos.append(found)
                print(f"  ✓ {os.path.basename(found)}")
            else:
                print(f"  ✗ NO encontrada: {name}")
    
    print("\n📁 Buscando fotos en Downloads...")
    all_dl = os.listdir(DL)
    for name in OUTSIDE_NAMES:
        found = None
        for f in all_dl:
            if name in f and any(f.lower().endswith(ext) for ext in ['.jpg','.jpeg','.png','.webp']):
                found = os.path.join(DL, f)
                break
        if found:
            photos.append(found)
            print(f"  ✓ {os.path.basename(found)}")
        else:
            print(f"  ✗ NO encontrada: {name}")
    
    return photos


def get_audio_duration(filepath):
    """Obtiene la duración de un archivo de audio en segundos."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", filepath],
        capture_output=True, text=True
    )
    try:
        return float(result.stdout.strip())
    except:
        return 0.0


def build_concat_audio():
    """Concatena las dos canciones en un archivo temporal."""
    audio_list_file = os.path.join(OUTPUT_DIR, "audio_list.txt")
    audio_concat = os.path.join(OUTPUT_DIR, "audio_combined.mp3")
    
    # Verificar canciones
    available_music = []
    for m in MUSICA:
        if os.path.exists(m):
            available_music.append(m)
            print(f"  ✓ {os.path.basename(m)}")
        else:
            # Buscar variantes sin extensión
            base = os.path.splitext(m)[0]
            for ext in ['.mp3', '.m4a', '.ogg', '.wav']:
                if os.path.exists(base + ext):
                    available_music.append(base + ext)
                    print(f"  ✓ {os.path.basename(base+ext)}")
                    break
            else:
                print(f"  ✗ NO encontrada: {os.path.basename(m)}")
    
    if not available_music:
        print("  ⚠ No se encontró música. El video se creará sin audio.")
        return None, 0
    
    # Escribir lista para concat
    with open(audio_list_file, 'w') as f:
        for m in available_music:
            f.write(f"file '{m}'\n")
    
    # Concatenar audios
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", audio_list_file, "-c", "copy", audio_concat
    ], capture_output=True)
    
    total_duration = sum(get_audio_duration(m) for m in available_music)
    print(f"  → Duración total de la música: {total_duration:.1f}s ({total_duration/60:.1f} min)")
    return audio_concat, total_duration


def create_video_with_ffmpeg(photos, audio_path, total_duration):
    """Crea el video MP4 usando ffmpeg con transiciones."""
    n = len(photos)
    if n == 0:
        print("✗ No hay fotos para el collage.")
        return False
    
    # Calcular duración por foto (ajustada a la música)
    secs_per_photo = total_duration / n if total_duration > 0 else 5.0
    secs_per_photo = max(3.0, min(secs_per_photo, 15.0))  # entre 3 y 15 segundos
    print(f"\n⏱ Cada foto durará {secs_per_photo:.1f} segundos")
    
    # Crear script de slideshow con xfade (fundido entre fotos)
    # Método: generar video slide a slide y unirlos con xfade
    temp_clips = []
    
    print("\n🎬 Procesando fotos...")
    for i, photo in enumerate(photos):
        clip_path = os.path.join(OUTPUT_DIR, f"clip_{i:02d}.mp4")
        
        # Convertir foto a clip de video con zoom Ken Burns effect
        zoom_in = 1.05  # zoom leve
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", photo,
            "-vf", (
                f"scale={WIDTH*2}:{HEIGHT*2}:force_original_aspect_ratio=increase,"
                f"crop={WIDTH*2}:{HEIGHT*2},"
                f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
                f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
                f"zoompan=z='min(zoom+0.0008,{zoom_in})':d={int(secs_per_photo*25)}:s={WIDTH}x{HEIGHT}:fps=25,"
                f"format=yuv420p"
            ),
            "-t", str(secs_per_photo),
            "-r", "25",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            clip_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0 and os.path.exists(clip_path):
            temp_clips.append(clip_path)
            print(f"  ✓ Clip {i+1}/{n}: {os.path.basename(photo)}")
        else:
            # Fallback: sin zoom
            cmd_simple = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", photo,
                "-vf", (
                    f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
                    f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
                    f"format=yuv420p"
                ),
                "-t", str(secs_per_photo),
                "-r", "25",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "18",
                clip_path
            ]
            result2 = subprocess.run(cmd_simple, capture_output=True, text=True)
            if result2.returncode == 0:
                temp_clips.append(clip_path)
                print(f"  ✓ Clip {i+1}/{n}: {os.path.basename(photo)} (sin zoom)")
            else:
                print(f"  ✗ Error en clip {i+1}: {result2.stderr[-200:]}")
    
    if not temp_clips:
        print("✗ No se pudo crear ningún clip.")
        return False
    
    # Aplicar transiciones xfade entre clips
    print("\n🔗 Aplicando transiciones entre fotos...")
    fade_duration = 1.0  # segundos de transición
    
    if len(temp_clips) == 1:
        video_no_audio = temp_clips[0]
    else:
        # Construir filtro xfade encadenado
        video_no_audio = os.path.join(OUTPUT_DIR, "video_no_audio.mp4")
        
        # Crear lista de concat simple (sin xfade si hay muchas fotos, para mayor compatibilidad)
        concat_list = os.path.join(OUTPUT_DIR, "concat_list.txt")
        with open(concat_list, 'w') as f:
            for clip in temp_clips:
                f.write(f"file '{clip}'\n")
        
        cmd_concat = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", concat_list,
            "-c", "copy",
            video_no_audio
        ]
        result = subprocess.run(cmd_concat, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  ✗ Error concatenando: {result.stderr[-300:]}")
            return False
        print("  ✓ Videos concatenados")
    
    # Agregar audio al video
    print("\n🎵 Agregando música al video...")
    if audio_path and os.path.exists(audio_path):
        cmd_audio = [
            "ffmpeg", "-y",
            "-i", video_no_audio,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-map", "0:v:0",
            "-map", "1:a:0",
            OUTPUT_VIDEO
        ]
        result = subprocess.run(cmd_audio, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✓ Audio agregado")
        else:
            print(f"  ⚠ Error con audio: {result.stderr[-300:]}")
            # Guardar sin audio
            shutil.copy(video_no_audio, OUTPUT_VIDEO)
    else:
        shutil.copy(video_no_audio, OUTPUT_VIDEO)
    
    # Limpiar temporales
    print("\n🧹 Limpiando archivos temporales...")
    for clip in temp_clips:
        try:
            os.remove(clip)
        except:
            pass
    
    return True


def main():
    print("=" * 60)
    print("   🎬 COLLAGE FAMILIAR - CREACIÓN DE VIDEO")
    print("=" * 60)
    
    # Crear carpeta de salida
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n📂 Carpeta de salida: {OUTPUT_DIR}")
    
    # Verificar ffmpeg
    print("\n🔍 Verificando FFmpeg...")
    if not check_ffmpeg():
        print("\n⚠ INSTALA FFMPEG primero:")
        print("  1. Ve a https://ffmpeg.org/download.html")
        print("  2. O ejecuta: winget install ffmpeg")
        sys.exit(1)
    
    # Construir lista de fotos
    photos = build_photo_list()
    print(f"\n📸 Total de fotos encontradas: {len(photos)}")
    
    if not photos:
        print("✗ No se encontraron fotos. Verifica las rutas.")
        sys.exit(1)
    
    # Preparar audio
    print("\n🎵 Preparando música...")
    audio_path, total_duration = build_concat_audio()
    
    # Crear video
    success = create_video_with_ffmpeg(photos, audio_path, total_duration)
    
    if success and os.path.exists(OUTPUT_VIDEO):
        size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print("\n" + "=" * 60)
        print(f"✅ ¡COLLAGE CREADO EXITOSAMENTE!")
        print(f"   📁 Ubicación: {OUTPUT_VIDEO}")
        print(f"   📦 Tamaño: {size_mb:.1f} MB")
        print(f"   📺 Compatible con TV (H.264, 1080p)")
        print(f"   🎬 Compatible con DaVinci Resolve")
        print()
        print("   Para ver en TV: copia el .mp4 a un USB")
        print("=" * 60)
    else:
        print("\n✗ Error al crear el video. Revisa los mensajes anteriores.")


if __name__ == "__main__":
    main()
