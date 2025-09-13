#!/bin/bash

# Script för att kopiera ai-start-projektet till en ny mapp
# Exkluderar bin/obj-mappar från kopieringen

# Standardnamn för målmappen
DEFAULT_TARGET="keepwarm"

# Använd första argumentet som målmappens namn, annars använd standard
TARGET_NAME="${1:-$DEFAULT_TARGET}"

# Få absolut sökväg till ai-start-mappen (scriptets överordnade mapp)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"
PARENT_DIR="$(dirname "$SOURCE_DIR")"
TARGET_DIR="$PARENT_DIR/$TARGET_NAME"

echo "Kopierar från: $SOURCE_DIR"
echo "Till: $TARGET_DIR"

# Kontrollera om målmappen redan finns
if [ -d "$TARGET_DIR" ]; then
    echo "Varning: Målmappen '$TARGET_DIR' finns redan."
    read -p "Vill du fortsätta och skriva över? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Avbryter kopieringen."
        exit 1
    fi
    rm -rf "$TARGET_DIR"
fi

# Skapa målmappen
mkdir -p "$TARGET_DIR"

# Kopiera alla filer och mappar, exklusive bin/obj-mappar
echo "Kopierar filer (exkluderar bin/obj-mappar)..."

# Använd rsync för att kopiera med exkluderingar
rsync -av \
    --exclude='*/bin/' \
    --exclude='*/obj/' \
    --exclude='bin/' \
    --exclude='obj/' \
    "$SOURCE_DIR/" \
    "$TARGET_DIR/"

echo "Kopieringen slutförd!"
echo "Projektet har kopierats till: $TARGET_DIR"

# Visa en sammanfattning av vad som kopierats
echo ""
echo "Sammanfattning:"
echo "- Källa: $(basename "$SOURCE_DIR")"
echo "- Mål: $(basename "$TARGET_DIR")"
echo "- Exkluderade mappar: bin/, obj/"
echo "- Antal filer kopierade: $(find "$TARGET_DIR" -type f | wc -l)"
