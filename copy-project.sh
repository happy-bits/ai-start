#!/bin/bash

# Script för att kopiera ai-start-projektet till en ny mapp
# Exkluderar bin/obj-mappar från kopieringen
# Byter namn på CustomerManagement till det nya projektnamnet

# Standardnamn för målmappen
DEFAULT_TARGET="KeepWarm"

# Använd första argumentet som målmappens namn, annars använd standard
TARGET_NAME="${1:-$DEFAULT_TARGET}"

# Få absolut sökväg till ai-start-mappen (scriptets överordnade mapp)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"
PARENT_DIR="$(dirname "$SOURCE_DIR")"
TARGET_DIR="$PARENT_DIR/$TARGET_NAME"

echo "Kopierar från: $SOURCE_DIR"
echo "Till: $TARGET_DIR"

# Kontrollera om målmappen redan finns - avbryt direkt utan att fråga
if [ -d "$TARGET_DIR" ]; then
    echo "Fel: Målmappen '$TARGET_DIR' finns redan."
    echo "Ta bort mappen först eller välj ett annat namn."
    exit 1
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

# Byt namn på CustomerManagement-mapparna
echo "Byter namn på projektmappar..."

if [ -d "$TARGET_DIR/CustomerManagement" ]; then
    mv "$TARGET_DIR/CustomerManagement" "$TARGET_DIR/$TARGET_NAME"
    echo "- Bytte namn på CustomerManagement till $TARGET_NAME"
fi

if [ -d "$TARGET_DIR/CustomerManagement.Tests" ]; then
    mv "$TARGET_DIR/CustomerManagement.Tests" "$TARGET_DIR/$TARGET_NAME.Tests"
    echo "- Bytte namn på CustomerManagement.Tests till $TARGET_NAME.Tests"
fi

# Byt namn på solution-filen
if [ -f "$TARGET_DIR/ai-start.sln" ]; then
    mv "$TARGET_DIR/ai-start.sln" "$TARGET_DIR/$TARGET_NAME.sln"
    echo "- Bytte namn på ai-start.sln till $TARGET_NAME.sln"
fi

# Byt namn på projektfiler (.csproj)
if [ -f "$TARGET_DIR/$TARGET_NAME/CustomerManagement.csproj" ]; then
    mv "$TARGET_DIR/$TARGET_NAME/CustomerManagement.csproj" "$TARGET_DIR/$TARGET_NAME/$TARGET_NAME.csproj"
    echo "- Bytte namn på CustomerManagement.csproj till $TARGET_NAME.csproj"
fi

if [ -f "$TARGET_DIR/$TARGET_NAME.Tests/CustomerManagement.Tests.csproj" ]; then
    mv "$TARGET_DIR/$TARGET_NAME.Tests/CustomerManagement.Tests.csproj" "$TARGET_DIR/$TARGET_NAME.Tests/$TARGET_NAME.Tests.csproj"
    echo "- Bytte namn på CustomerManagement.Tests.csproj till $TARGET_NAME.Tests.csproj"
fi

# Ersätt alla förekomster av "CustomerManagement" med det nya namnet
echo "Ersätter namespace och referenser..."

# Hitta alla textfiler och ersätt CustomerManagement
find "$TARGET_DIR" -type f \( \
    -name "*.cs" -o \
    -name "*.csproj" -o \
    -name "*.sln" -o \
    -name "*.json" -o \
    -name "*.cshtml" -o \
    -name "*.md" -o \
    -name "*.txt" \
\) -exec sed -i '' "s/CustomerManagement/$TARGET_NAME/g" {} \;

echo "- Ersatte alla förekomster av 'CustomerManagement' med '$TARGET_NAME'"

echo ""
echo "Projektet har kopierats och anpassats till: $TARGET_DIR"

# Visa en sammanfattning av vad som gjorts
echo ""
echo "Sammanfattning:"
echo "- Källa: $(basename "$SOURCE_DIR")"
echo "- Mål: $(basename "$TARGET_DIR")"
echo "- Exkluderade mappar: bin/, obj/"
echo "- Projektmappar omdöpta: CustomerManagement → $TARGET_NAME, CustomerManagement.Tests → $TARGET_NAME.Tests"
echo "- Solution-fil omdöpt: ai-start.sln → $TARGET_NAME.sln"
echo "- Projektfiler omdöpta: CustomerManagement.csproj → $TARGET_NAME.csproj, CustomerManagement.Tests.csproj → $TARGET_NAME.Tests.csproj"
echo "- Namespace ersatt: CustomerManagement → $TARGET_NAME"
echo "- Antal filer kopierade: $(find "$TARGET_DIR" -type f | wc -l)"
