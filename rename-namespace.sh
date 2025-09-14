#!/bin/bash

# Script för att byta namn på CustomerManagement-projektet i aktuell mapp
# Byter namn på mappar, filer och namespace-referenser på plats

# Standardnamn för det nya projektnamnet
DEFAULT_TARGET="KeepWarm"

# Använd första argumentet som det nya projektnamnet, annars använd standard
TARGET_NAME="${1:-$DEFAULT_TARGET}"

# Aktuell mapp som arbetskatalog
CURRENT_DIR="$(pwd)"

echo "Byter namn på projekt i: $CURRENT_DIR"
echo "Nytt projektnamn: $TARGET_NAME"

# Kontrollera om en mapp med målnamnet redan finns
if [ -d "$CURRENT_DIR/$TARGET_NAME" ] || [ -d "$CURRENT_DIR/$TARGET_NAME.Tests" ]; then
    echo "Fel: En mapp med namnet '$TARGET_NAME' eller '$TARGET_NAME.Tests' finns redan."
    echo "Välj ett annat namn eller ta bort befintliga mappar först."
    exit 1
fi

# Kontrollera att CustomerManagement-mapparna finns
if [ ! -d "$CURRENT_DIR/CustomerManagement" ]; then
    echo "Fel: CustomerManagement-mappen finns inte i aktuell katalog."
    echo "Kontrollera att du kör scriptet från rätt mapp."
    exit 1
fi

# Byt namn på CustomerManagement-mapparna
echo "Byter namn på projektmappar..."

if [ -d "$CURRENT_DIR/CustomerManagement" ]; then
    mv "$CURRENT_DIR/CustomerManagement" "$CURRENT_DIR/$TARGET_NAME"
    echo "- Bytte namn på CustomerManagement till $TARGET_NAME"
fi

if [ -d "$CURRENT_DIR/CustomerManagement.Tests" ]; then
    mv "$CURRENT_DIR/CustomerManagement.Tests" "$CURRENT_DIR/$TARGET_NAME.Tests"
    echo "- Bytte namn på CustomerManagement.Tests till $TARGET_NAME.Tests"
fi

# Byt namn på solution-filen
if [ -f "$CURRENT_DIR/ai-start.sln" ]; then
    mv "$CURRENT_DIR/ai-start.sln" "$CURRENT_DIR/$TARGET_NAME.sln"
    echo "- Bytte namn på ai-start.sln till $TARGET_NAME.sln"
fi

# Byt namn på projektfiler (.csproj)
if [ -f "$CURRENT_DIR/$TARGET_NAME/CustomerManagement.csproj" ]; then
    mv "$CURRENT_DIR/$TARGET_NAME/CustomerManagement.csproj" "$CURRENT_DIR/$TARGET_NAME/$TARGET_NAME.csproj"
    echo "- Bytte namn på CustomerManagement.csproj till $TARGET_NAME.csproj"
fi

if [ -f "$CURRENT_DIR/$TARGET_NAME.Tests/CustomerManagement.Tests.csproj" ]; then
    mv "$CURRENT_DIR/$TARGET_NAME.Tests/CustomerManagement.Tests.csproj" "$CURRENT_DIR/$TARGET_NAME.Tests/$TARGET_NAME.Tests.csproj"
    echo "- Bytte namn på CustomerManagement.Tests.csproj till $TARGET_NAME.Tests.csproj"
fi

# Ersätt alla förekomster av "CustomerManagement" med det nya namnet
echo "Ersätter namespace och referenser..."

# Hitta alla textfiler och ersätt CustomerManagement
find "$CURRENT_DIR" -type f \( \
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
echo "Projektet har döpts om till: $TARGET_NAME"

# Visa en sammanfattning av vad som gjorts
echo ""
echo "Sammanfattning:"
echo "- Arbetskatalog: $(basename "$CURRENT_DIR")"
echo "- Projektmappar omdöpta: CustomerManagement → $TARGET_NAME, CustomerManagement.Tests → $TARGET_NAME.Tests"
echo "- Solution-fil omdöpt: ai-start.sln → $TARGET_NAME.sln"
echo "- Projektfiler omdöpta: CustomerManagement.csproj → $TARGET_NAME.csproj, CustomerManagement.Tests.csproj → $TARGET_NAME.Tests.csproj"
echo "- Namespace ersatt: CustomerManagement → $TARGET_NAME"
echo "- Totalt antal filer i projektet: $(find "$CURRENT_DIR" -type f | wc -l)"
