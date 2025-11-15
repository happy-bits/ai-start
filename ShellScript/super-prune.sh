#!/bin/bash

# Script to permanently remove all branches except protected ones
# Protected branches: main, student, userstories, solution

# Protected branches that should not be deleted
PROTECTED_BRANCHES=("main" "student" "userstories" "solution")

# Settings
DELETE_REMOTE_BRANCHES=false  # Also delete remote branches 
ASK_FOR_CONFIRMATION=true      # Ask before deletion 

# Check if "yolo" parameter is set to true
for arg in "$@"; do
    if [[ "$arg" == "yolo=true" ]] || [[ "$arg" == "yolo" ]]; then
        DELETE_REMOTE_BRANCHES=true
        ASK_FOR_CONFIRMATION=false
        break
    fi
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Branch Cleanup Script"
echo "=========================================="
echo ""

# Check that we are in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: This is not a Git repository.${NC}"
    exit 1
fi

# Remove all worktrees (except the primary one)
echo "Cleaning worktrees..."
WORKTREE_LIST=$(git worktree list)
PRIMARY_WORKTREE=$(git rev-parse --show-toplevel)

# Collect worktrees to be deleted
WORKTREES_TO_DELETE=()
if [ -n "$WORKTREE_LIST" ]; then
    while IFS= read -r line; do
        # Extract path from worktree list (first column)
        WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
        
        # Skip the primary worktree
        if [ "$WORKTREE_PATH" != "$PRIMARY_WORKTREE" ] && [ -n "$WORKTREE_PATH" ]; then
            WORKTREES_TO_DELETE+=("$WORKTREE_PATH")
        fi
    done <<< "$WORKTREE_LIST"
fi

# Show what will be deleted
if [ ${#WORKTREES_TO_DELETE[@]} -gt 0 ]; then
    echo "Worktrees that will be deleted:"
    for worktree_path in "${WORKTREES_TO_DELETE[@]}"; do
        echo -e "  ${RED}✗${NC} $worktree_path"
    done
    echo ""
    
    # Confirmation for worktrees
    if [ "$ASK_FOR_CONFIRMATION" = true ]; then
        read -p "Do you want to continue deleting these worktrees? (yes/no): " CONFIRM_WORKTREES
        if [[ ! "$CONFIRM_WORKTREES" =~ ^[Yy][Ee][Ss]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
    fi
    
    echo ""
    echo "Deleting worktrees..."
    
    # Delete worktrees
    DELETED_WORKTREES=0
    FAILED_WORKTREES=0
    for worktree_path in "${WORKTREES_TO_DELETE[@]}"; do
        if git worktree remove --force "$worktree_path" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Deleted worktree: $worktree_path"
            ((DELETED_WORKTREES++))
        else
            echo -e "${RED}✗${NC} Could not delete worktree: $worktree_path"
            ((FAILED_WORKTREES++))
        fi
    done
    
    if [ $DELETED_WORKTREES -gt 0 ] || [ $FAILED_WORKTREES -gt 0 ]; then
        echo -e "${GREEN}Worktrees deleted:${NC} $DELETED_WORKTREES"
        if [ $FAILED_WORKTREES -gt 0 ]; then
            echo -e "${RED}Worktrees failed:${NC} $FAILED_WORKTREES"
        fi
        echo ""
    fi
else
    echo -e "${GREEN}No extra worktrees to delete.${NC}"
    echo ""
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# If we are on a branch that will be deleted, abort the script
if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${CURRENT_BRANCH} " ]]; then
    echo -e "${RED}Error: You are on branch '$CURRENT_BRANCH' which will be deleted.${NC}"
    echo "Switch to a protected branch (main, student, userstories, or solution) before running the script."
    exit 1
fi

# Get all local branches (excludes HEAD and remote branches)
LOCAL_BRANCHES=$(git branch --format='%(refname:short)' | grep -v 'HEAD')

# Get all remote branches (filter out 'origin' which is not a branch)
REMOTE_BRANCHES=$(git branch -r --format='%(refname:short)' | sed 's|origin/||' | grep -v 'HEAD' | grep -v '^origin$')

# Filter out protected branches from local branches
BRANCHES_TO_DELETE_LOCAL=()
for branch in $LOCAL_BRANCHES; do
    if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
        BRANCHES_TO_DELETE_LOCAL+=("$branch")
    fi
done

# Filter out protected branches from remote branches (only if DELETE_REMOTE_BRANCHES is true)
BRANCHES_TO_DELETE_REMOTE=()
if [ "$DELETE_REMOTE_BRANCHES" = true ]; then
    for branch in $REMOTE_BRANCHES; do
        if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
            BRANCHES_TO_DELETE_REMOTE+=("$branch")
        fi
    done
fi

# Show what will be deleted
echo "Protected branches (kept):"
for branch in "${PROTECTED_BRANCHES[@]}"; do
    echo -e "  ${GREEN}✓${NC} $branch"
done
echo ""

if [ ${#BRANCHES_TO_DELETE_LOCAL[@]} -eq 0 ] && [ ${#BRANCHES_TO_DELETE_REMOTE[@]} -eq 0 ]; then
    echo -e "${GREEN}No branches to delete.${NC}"
    exit 0
fi

if [ ${#BRANCHES_TO_DELETE_LOCAL[@]} -gt 0 ]; then
    echo "Local branches that will be deleted:"
    for branch in "${BRANCHES_TO_DELETE_LOCAL[@]}"; do
        echo -e "  ${RED}✗${NC} $branch"
    done
    echo ""
fi

if [ ${#BRANCHES_TO_DELETE_REMOTE[@]} -gt 0 ]; then
    echo "Remote branches that will be deleted:"
    for branch in "${BRANCHES_TO_DELETE_REMOTE[@]}"; do
        echo -e "  ${RED}✗${NC} origin/$branch"
    done
    echo ""
fi

# Confirmation
if [ "$ASK_FOR_CONFIRMATION" = true ]; then
    read -p "Do you want to continue deleting these branches? (yes/no): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
echo "Deleting branches..."

# Delete local branches
DELETED_LOCAL=0
FAILED_LOCAL=0
for branch in "${BRANCHES_TO_DELETE_LOCAL[@]}"; do
    if git branch -D "$branch" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Deleted local branch: $branch"
        ((DELETED_LOCAL++))
    else
        echo -e "${RED}✗${NC} Could not delete local branch: $branch"
        ((FAILED_LOCAL++))
    fi
done

# Delete remote branches (only if DELETE_REMOTE_BRANCHES is true)
DELETED_REMOTE=0
FAILED_REMOTE=0
CLEANED_TRACKING=0
if [ "$DELETE_REMOTE_BRANCHES" = true ]; then
    for branch in "${BRANCHES_TO_DELETE_REMOTE[@]}"; do
        # Check if branch actually exists on remote (check output, not just exit code)
        REMOTE_CHECK=$(git ls-remote --heads origin "$branch" 2>/dev/null)
        if [ -n "$REMOTE_CHECK" ]; then
            # Branch exists on remote, try to delete it
            if git push origin --delete "$branch" 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Deleted remote branch: origin/$branch"
                ((DELETED_REMOTE++))
            else
                echo -e "${RED}✗${NC} Could not delete remote branch: origin/$branch (push failed)"
                ((FAILED_REMOTE++))
            fi
        else
            # Branch does not exist on remote, clean local tracking branch
            echo -e "${YELLOW}⚠${NC} Remote branch no longer exists: origin/$branch (local tracking branch)"
            if git branch -d -r "origin/$branch" 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Cleaned local tracking branch: origin/$branch"
                ((CLEANED_TRACKING++))
            else
                echo -e "${RED}✗${NC} Could not clean local tracking branch: origin/$branch"
            fi
        fi
    done
fi

# Summary
echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="
echo -e "${GREEN}Local branches deleted:${NC} $DELETED_LOCAL"
if [ $FAILED_LOCAL -gt 0 ]; then
    echo -e "${RED}Local branches failed:${NC} $FAILED_LOCAL"
fi
echo -e "${GREEN}Remote branches deleted:${NC} $DELETED_REMOTE"
if [ $FAILED_REMOTE -gt 0 ]; then
    echo -e "${RED}Remote branches failed:${NC} $FAILED_REMOTE"
fi
if [ $CLEANED_TRACKING -gt 0 ]; then
    echo -e "${GREEN}Local tracking branches cleaned:${NC} $CLEANED_TRACKING"
fi
echo ""
echo "Done!"

