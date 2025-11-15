#!/bin/bash

# Script för att permanent ta bort alla branches förutom de skyddade
# Skyddade branches: main, student, userstories, solution

# Skyddade branches som inte ska tas bort
PROTECTED_BRANCHES=("main" "student" "userstories" "solution")

# Inställningar
DELETE_REMOTE_BRANCHES=false  # Ta även bort remote branches 
ASK_FOR_CONFIRMATION=true      # Fråga innan borttagning 

# Kontrollera om "yolo" parameter är satt till true
for arg in "$@"; do
    if [[ "$arg" == "yolo=true" ]] || [[ "$arg" == "yolo" ]]; then
        DELETE_REMOTE_BRANCHES=true
        ASK_FOR_CONFIRMATION=false
        break
    fi
done

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Branch Cleanup Script"
echo "=========================================="
echo ""

# Kontrollera att vi är i ett Git-repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Fel: Detta är inte ett Git-repository.${NC}"
    exit 1
fi

# Ta bort alla worktrees (förutom den primära)
echo "Rensar worktrees..."
WORKTREE_LIST=$(git worktree list)
PRIMARY_WORKTREE=$(git rev-parse --show-toplevel)

# Samla worktrees som ska tas bort
WORKTREES_TO_DELETE=()
if [ -n "$WORKTREE_LIST" ]; then
    while IFS= read -r line; do
        # Extrahera sökvägen från worktree listan (första kolumnen)
        WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
        
        # Hoppa över den primära worktree
        if [ "$WORKTREE_PATH" != "$PRIMARY_WORKTREE" ] && [ -n "$WORKTREE_PATH" ]; then
            WORKTREES_TO_DELETE+=("$WORKTREE_PATH")
        fi
    done <<< "$WORKTREE_LIST"
fi

# Visa vad som kommer att tas bort
if [ ${#WORKTREES_TO_DELETE[@]} -gt 0 ]; then
    echo "Worktrees som kommer att tas bort:"
    for worktree_path in "${WORKTREES_TO_DELETE[@]}"; do
        echo -e "  ${RED}✗${NC} $worktree_path"
    done
    echo ""
    
    # Bekräftelse för worktrees
    if [ "$ASK_FOR_CONFIRMATION" = true ]; then
        read -p "Vill du fortsätta med att ta bort dessa worktrees? (ja/nej): " CONFIRM_WORKTREES
        if [[ ! "$CONFIRM_WORKTREES" =~ ^[Jj][Aa]$ ]]; then
            echo "Avbrutet."
            exit 0
        fi
    fi
    
    echo ""
    echo "Tar bort worktrees..."
    
    # Ta bort worktrees
    DELETED_WORKTREES=0
    FAILED_WORKTREES=0
    for worktree_path in "${WORKTREES_TO_DELETE[@]}"; do
        if git worktree remove --force "$worktree_path" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Tog bort worktree: $worktree_path"
            ((DELETED_WORKTREES++))
        else
            echo -e "${RED}✗${NC} Kunde inte ta bort worktree: $worktree_path"
            ((FAILED_WORKTREES++))
        fi
    done
    
    if [ $DELETED_WORKTREES -gt 0 ] || [ $FAILED_WORKTREES -gt 0 ]; then
        echo -e "${GREEN}Worktrees borttagna:${NC} $DELETED_WORKTREES"
        if [ $FAILED_WORKTREES -gt 0 ]; then
            echo -e "${RED}Worktrees misslyckades:${NC} $FAILED_WORKTREES"
        fi
        echo ""
    fi
else
    echo -e "${GREEN}Inga extra worktrees att ta bort.${NC}"
    echo ""
fi

# Hämta aktuell branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Aktuell branch: $CURRENT_BRANCH"
echo ""

# Om vi är på en branch som ska tas bort, avbryt scriptet
if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${CURRENT_BRANCH} " ]]; then
    echo -e "${RED}Fel: Du är på branch '$CURRENT_BRANCH' som kommer att tas bort.${NC}"
    echo "Byt till en skyddad branch (main, student, userstories, eller solution) innan du kör scriptet."
    exit 1
fi

# Hämta alla lokala branches (exkluderar HEAD och remote branches)
LOCAL_BRANCHES=$(git branch --format='%(refname:short)' | grep -v 'HEAD')

# Hämta alla remote branches (filtrera bort 'origin' som inte är en branch)
REMOTE_BRANCHES=$(git branch -r --format='%(refname:short)' | sed 's|origin/||' | grep -v 'HEAD' | grep -v '^origin$')

# Filtrera bort skyddade branches från lokala branches
BRANCHES_TO_DELETE_LOCAL=()
for branch in $LOCAL_BRANCHES; do
    if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
        BRANCHES_TO_DELETE_LOCAL+=("$branch")
    fi
done

# Filtrera bort skyddade branches från remote branches (endast om DELETE_REMOTE_BRANCHES är true)
BRANCHES_TO_DELETE_REMOTE=()
if [ "$DELETE_REMOTE_BRANCHES" = true ]; then
    for branch in $REMOTE_BRANCHES; do
        if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
            BRANCHES_TO_DELETE_REMOTE+=("$branch")
        fi
    done
fi

# Visa vad som kommer att tas bort
echo "Skyddade branches (behålls):"
for branch in "${PROTECTED_BRANCHES[@]}"; do
    echo -e "  ${GREEN}✓${NC} $branch"
done
echo ""

if [ ${#BRANCHES_TO_DELETE_LOCAL[@]} -eq 0 ] && [ ${#BRANCHES_TO_DELETE_REMOTE[@]} -eq 0 ]; then
    echo -e "${GREEN}Inga branches att ta bort.${NC}"
    exit 0
fi

if [ ${#BRANCHES_TO_DELETE_LOCAL[@]} -gt 0 ]; then
    echo "Lokala branches som kommer att tas bort:"
    for branch in "${BRANCHES_TO_DELETE_LOCAL[@]}"; do
        echo -e "  ${RED}✗${NC} $branch"
    done
    echo ""
fi

if [ ${#BRANCHES_TO_DELETE_REMOTE[@]} -gt 0 ]; then
    echo "Remote branches som kommer att tas bort:"
    for branch in "${BRANCHES_TO_DELETE_REMOTE[@]}"; do
        echo -e "  ${RED}✗${NC} origin/$branch"
    done
    echo ""
fi

# Bekräftelse
if [ "$ASK_FOR_CONFIRMATION" = true ]; then
    read -p "Vill du fortsätta med att ta bort dessa branches? (ja/nej): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Jj][Aa]$ ]]; then
        echo "Avbrutet."
        exit 0
    fi
fi

echo ""
echo "Tar bort branches..."

# Ta bort lokala branches
DELETED_LOCAL=0
FAILED_LOCAL=0
for branch in "${BRANCHES_TO_DELETE_LOCAL[@]}"; do
    if git branch -D "$branch" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Tog bort lokal branch: $branch"
        ((DELETED_LOCAL++))
    else
        echo -e "${RED}✗${NC} Kunde inte ta bort lokal branch: $branch"
        ((FAILED_LOCAL++))
    fi
done

# Ta bort remote branches (endast om DELETE_REMOTE_BRANCHES är true)
DELETED_REMOTE=0
FAILED_REMOTE=0
CLEANED_TRACKING=0
if [ "$DELETE_REMOTE_BRANCHES" = true ]; then
    for branch in "${BRANCHES_TO_DELETE_REMOTE[@]}"; do
        # Kontrollera om branchen faktiskt finns på remote (kontrollera output, inte bara exit code)
        REMOTE_CHECK=$(git ls-remote --heads origin "$branch" 2>/dev/null)
        if [ -n "$REMOTE_CHECK" ]; then
            # Branchen finns på remote, försök ta bort den
            if git push origin --delete "$branch" 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Tog bort remote branch: origin/$branch"
                ((DELETED_REMOTE++))
            else
                echo -e "${RED}✗${NC} Kunde inte ta bort remote branch: origin/$branch (push misslyckades)"
                ((FAILED_REMOTE++))
            fi
        else
            # Branchen finns inte på remote, rensa lokalt tracking branch
            echo -e "${YELLOW}⚠${NC} Remote branch finns inte längre: origin/$branch (lokalt tracking branch)"
            if git branch -d -r "origin/$branch" 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Rensade lokalt tracking branch: origin/$branch"
                ((CLEANED_TRACKING++))
            else
                echo -e "${RED}✗${NC} Kunde inte rensa lokalt tracking branch: origin/$branch"
            fi
        fi
    done
fi

# Sammanfattning
echo ""
echo "=========================================="
echo "Sammanfattning:"
echo "=========================================="
echo -e "${GREEN}Lokala branches borttagna:${NC} $DELETED_LOCAL"
if [ $FAILED_LOCAL -gt 0 ]; then
    echo -e "${RED}Lokala branches misslyckades:${NC} $FAILED_LOCAL"
fi
echo -e "${GREEN}Remote branches borttagna:${NC} $DELETED_REMOTE"
if [ $FAILED_REMOTE -gt 0 ]; then
    echo -e "${RED}Remote branches misslyckades:${NC} $FAILED_REMOTE"
fi
if [ $CLEANED_TRACKING -gt 0 ]; then
    echo -e "${GREEN}Lokala tracking branches rensade:${NC} $CLEANED_TRACKING"
fi
echo ""
echo "Klart!"

