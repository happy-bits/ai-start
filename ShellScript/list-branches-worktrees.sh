#!/bin/bash

# Script to list all branches (local and remote) and worktrees in a nice format

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Check if we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: This is not a Git repository.${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
PRIMARY_WORKTREE=$(git rev-parse --show-toplevel)

# List local branches
echo "=========================================="
echo -e "${BOLD}Local Branches${NC}"
echo "=========================================="

LOCAL_BRANCHES=$(git branch --format='%(refname:short)' | grep -v 'HEAD')
if [ -z "$LOCAL_BRANCHES" ]; then
    echo -e "${YELLOW}No local branches found.${NC}"
else
    while IFS= read -r branch; do
        if [ "$branch" = "$CURRENT_BRANCH" ]; then
            echo -e "  ${GREEN}●${NC} ${BOLD}$branch${NC} ${GREEN}(current)${NC}"
        else
            echo -e "  ${BLUE}○${NC} $branch"
        fi
    done <<< "$LOCAL_BRANCHES"
fi

echo ""

# List remote branches
echo "=========================================="
echo -e "${BOLD}Remote Branches${NC}"
echo "=========================================="

REMOTE_BRANCHES=$(git branch -r --format='%(refname:short)' | grep -v 'HEAD' | grep -v '^origin$' | sort)
if [ -z "$REMOTE_BRANCHES" ]; then
    echo -e "${YELLOW}No remote branches found.${NC}"
else
    # Group by remote (portable solution without associative arrays)
    PREVIOUS_REMOTE=""
    while IFS= read -r branch; do
        # Extract remote name and branch name using sed (portable)
        REMOTE_NAME=$(echo "$branch" | sed 's|/.*||')
        BRANCH_NAME=$(echo "$branch" | sed 's|^[^/]*/||')
        
        # If this is a new remote, print header
        if [ "$REMOTE_NAME" != "$PREVIOUS_REMOTE" ]; then
            if [ -n "$PREVIOUS_REMOTE" ]; then
                echo ""
            fi
            echo -e "${CYAN}Remote: ${BOLD}$REMOTE_NAME${NC}"
            PREVIOUS_REMOTE="$REMOTE_NAME"
        fi
        
        echo -e "  ${BLUE}○${NC} $BRANCH_NAME"
    done <<< "$REMOTE_BRANCHES"
    echo ""
fi

# List worktrees
echo "=========================================="
echo -e "${BOLD}Worktrees${NC}"
echo "=========================================="

WORKTREE_LIST=$(git worktree list)
if [ -z "$WORKTREE_LIST" ]; then
    echo -e "${YELLOW}No worktrees found.${NC}"
else
    WORKTREE_COUNT=0
    while IFS= read -r line; do
        ((WORKTREE_COUNT++))
        # Extract information from worktree list
        # Format: /path/to/worktree [branch-name] (detached HEAD abc1234)
        WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
        WORKTREE_BRANCH=$(echo "$line" | awk '{print $2}' | sed 's/\[//;s/\]//')
        WORKTREE_STATUS=$(echo "$line" | awk '{for(i=3;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/ $//')
        
        if [ "$WORKTREE_PATH" = "$PRIMARY_WORKTREE" ]; then
            echo -e "  ${GREEN}●${NC} ${BOLD}$WORKTREE_PATH${NC}"
            echo -e "     Branch: ${GREEN}${BOLD}$WORKTREE_BRANCH${NC} ${GREEN}(primary)${NC}"
        else
            echo -e "  ${BLUE}○${NC} $WORKTREE_PATH"
            if [[ "$WORKTREE_STATUS" =~ "detached" ]]; then
                echo -e "     Status: ${YELLOW}$WORKTREE_STATUS${NC}"
            else
                echo -e "     Branch: $WORKTREE_BRANCH"
            fi
        fi
        echo ""
    done <<< "$WORKTREE_LIST"
    
    echo -e "${CYAN}Total worktrees:${NC} $WORKTREE_COUNT"
fi

echo ""
echo "=========================================="
echo ""

