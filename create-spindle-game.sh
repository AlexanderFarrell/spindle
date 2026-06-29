#!/usr/bin/env bash
set -euo pipefail

TEMPLATE_REPO="https://github.com/AlexanderFarrell/spindle-template"

usage() {
    echo "Usage: $0 <project-name> [--tag <spindle-version>]"
    echo ""
    echo "Creates a new Spindle game project."
    echo ""
    echo "Arguments:"
    echo "  project-name          Name for the new project directory and package"
    echo "  --tag <version>       Spindle version tag to check out (e.g. v1.0)"
    echo ""
    echo "Examples:"
    echo "  $0 my-game"
    echo "  $0 my-game --tag v1.0"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

PROJECT_NAME="$1"
shift

SPINDLE_TAG=""
while [ $# -gt 0 ]; do
    case "$1" in
        --tag)
            SPINDLE_TAG="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -d "$PROJECT_NAME" ]; then
    echo "Error: Directory '$PROJECT_NAME' already exists."
    exit 1
fi

echo "Creating Spindle project '$PROJECT_NAME'..."

git clone --recurse-submodules "$TEMPLATE_REPO" "$PROJECT_NAME"
cd "$PROJECT_NAME"

git remote remove origin

if [ -n "$SPINDLE_TAG" ]; then
    echo "Checking out Spindle $SPINDLE_TAG..."
    cd spindle
    git checkout "$SPINDLE_TAG"
    cd ..
fi

# Replace placeholder names with the project name
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_INPLACE=(sed -i '')
else
    SED_INPLACE=(sed -i)
fi
"${SED_INPLACE[@]}" "s/\"name\": \"your-game-here\"/\"name\": \"$PROJECT_NAME\"/" package.json
"${SED_INPLACE[@]}" "s/\"name\": \"game-name-here\"/\"name\": \"$PROJECT_NAME\"/" game/package.json
"${SED_INPLACE[@]}" "s/\"productName\": \"Game Name Here\"/\"productName\": \"$PROJECT_NAME\"/" game/package.json
"${SED_INPLACE[@]}" "s/com\.yourname\.gamenamehere/com.example.$PROJECT_NAME/" game/package.json
"${SED_INPLACE[@]}" "s/<title>Untitled Game<\/title>/<title>$PROJECT_NAME<\/title>/" game/index.html

echo ""
echo "Project '$PROJECT_NAME' created successfully!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm install"
echo "  npm run dev"
