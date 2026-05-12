# nut-js MCP Server

MCP server for desktop automation via `@nut-tree-fork/nut-js`. Exposes mouse, keyboard, screen capture, clipboard, and YAML-based scenario execution.

## Setup

```bash
npm install
npm run build
```

### macOS Permissions
Grant your terminal **Accessibility** and **Screen Recording** permissions in System Settings > Privacy & Security.

## MCP Configuration

```json
{
  "mcpServers": {
    "nut-js": {
      "command": "node",
      "args": ["/path/to/nut-js-mcp-server/dist/index.js"]
    }
  }
}
```

## Tools

### Mouse
- `mouse_move` — Move cursor to (x, y) with animation
- `mouse_set_position` — Instant cursor placement
- `mouse_get_position` — Get cursor coordinates
- `mouse_click` — Click (left/right/middle, single/double)
- `mouse_press` / `mouse_release` — Hold/release buttons
- `mouse_scroll` — Scroll in any direction
- `mouse_drag` — Drag to coordinates

### Keyboard
- `keyboard_type` — Type a text string
- `keyboard_press_key` — Press key combination (e.g., Ctrl+C)
- `keyboard_hold_key` / `keyboard_release_key` — Hold/release keys
- `list_keys` — List all available key names

### Screen
- `screen_size` — Get screen dimensions
- `screen_capture` — Save screenshot to file
- `screen_capture_base64` — Get screenshot as base64
- `screen_color_at` — Get pixel color at point

### Clipboard
- `clipboard_get` / `clipboard_set` — Read/write clipboard

### Configuration
- `configure_mouse_speed` — Set movement speed (px/s)
- `configure_mouse_delay` — Set inter-action delay
- `configure_keyboard_delay` — Set typing delay

### Utility
- `wait` — Pause execution
- `run_scenario` — Execute YAML scenario from string
- `run_scenario_file` — Execute YAML scenario from file

## YAML Scenario Format

```yaml
name: "My Automation"
config:
  mouseSpeed: 1000
  mouseDelay: 100
  keyboardDelay: 50
steps:
  - action: move
    x: 100
    y: 200
  - action: click
    button: left
    double: false
  - action: type
    text: "Hello world"
  - action: hotkey
    keys: [LeftControl, S]
  - action: screenshot
    filename: "result"
  - action: wait
    ms: 1000
  - action: scroll
    direction: down
    amount: 5
  - action: drag
    x: 400
    y: 300
  - action: clipboard_set
    text: "copied text"
  - action: repeat
    count: 3
    steps:
      - action: key
        keys: [Tab]
```

### Available Actions
| Action | Parameters |
|--------|-----------|
| `move` | `x`, `y` |
| `click` | `button` (left/right/middle), `double` (bool) |
| `press` | `button` |
| `release` | `button` |
| `scroll` | `direction` (up/down/left/right), `amount` |
| `drag` | `x`, `y` |
| `type` | `text` |
| `key` | `keys` (array of Key names) |
| `hotkey` | `keys` (array of Key names) |
| `screenshot` | `filename`, `format` (png/jpg), `directory`, `region` ({x,y,width,height}) |
| `clipboard_set` | `text` |
| `clipboard_get` | — |
| `wait` | `ms` |
| `repeat` | `count`, `steps` (nested array) |
