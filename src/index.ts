import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  mouse,
  keyboard,
  screen,
  clipboard,
  straightTo,
  up,
  down,
  left,
  right,
  centerOf,
  randomPointIn,
  sleep,
  Point,
  Region,
  Button,
  Key,
  FileType,
} from "@nut-tree-fork/nut-js";
import { runScenario } from "./scenario";

const server = new McpServer({
  name: "nut-js-mcp-server",
  version: "1.0.0",
});

// --- Mouse Tools ---

server.tool(
  "mouse_move",
  "Move the mouse cursor to absolute coordinates",
  { x: z.number().describe("X coordinate"), y: z.number().describe("Y coordinate") },
  async ({ x, y }) => {
    await mouse.move(straightTo(new Point(x, y)));
    return { content: [{ type: "text", text: `Moved mouse to (${x}, ${y})` }] };
  }
);

server.tool(
  "mouse_set_position",
  "Instantly set mouse position without animation",
  { x: z.number(), y: z.number() },
  async ({ x, y }) => {
    await mouse.setPosition(new Point(x, y));
    return { content: [{ type: "text", text: `Set mouse position to (${x}, ${y})` }] };
  }
);

server.tool(
  "mouse_get_position",
  "Get the current mouse cursor position",
  {},
  async () => {
    const pos = await mouse.getPosition();
    return { content: [{ type: "text", text: JSON.stringify({ x: pos.x, y: pos.y }) }] };
  }
);

server.tool(
  "mouse_click",
  "Click a mouse button",
  {
    button: z.enum(["left", "right", "middle"]).default("left").describe("Mouse button"),
    double: z.boolean().default(false).describe("Double click"),
  },
  async ({ button, double }) => {
    const btn = button === "right" ? Button.RIGHT : button === "middle" ? Button.MIDDLE : Button.LEFT;
    if (double) {
      await mouse.doubleClick(btn);
    } else {
      await mouse.click(btn);
    }
    return { content: [{ type: "text", text: `${double ? "Double-" : ""}Clicked ${button} button` }] };
  }
);

server.tool(
  "mouse_press",
  "Press and hold a mouse button",
  { button: z.enum(["left", "right", "middle"]).default("left") },
  async ({ button }) => {
    const btn = button === "right" ? Button.RIGHT : button === "middle" ? Button.MIDDLE : Button.LEFT;
    await mouse.pressButton(btn);
    return { content: [{ type: "text", text: `Pressed ${button} button` }] };
  }
);

server.tool(
  "mouse_release",
  "Release a held mouse button",
  { button: z.enum(["left", "right", "middle"]).default("left") },
  async ({ button }) => {
    const btn = button === "right" ? Button.RIGHT : button === "middle" ? Button.MIDDLE : Button.LEFT;
    await mouse.releaseButton(btn);
    return { content: [{ type: "text", text: `Released ${button} button` }] };
  }
);

server.tool(
  "mouse_scroll",
  "Scroll the mouse wheel",
  {
    direction: z.enum(["up", "down", "left", "right"]).describe("Scroll direction"),
    amount: z.number().positive().describe("Scroll amount in steps"),
  },
  async ({ direction, amount }) => {
    switch (direction) {
      case "up": await mouse.scrollUp(amount); break;
      case "down": await mouse.scrollDown(amount); break;
      case "left": await mouse.scrollLeft(amount); break;
      case "right": await mouse.scrollRight(amount); break;
    }
    return { content: [{ type: "text", text: `Scrolled ${direction} by ${amount}` }] };
  }
);

server.tool(
  "mouse_drag",
  "Drag from current position to target coordinates",
  { x: z.number(), y: z.number() },
  async ({ x, y }) => {
    await mouse.drag(straightTo(new Point(x, y)));
    return { content: [{ type: "text", text: `Dragged to (${x}, ${y})` }] };
  }
);

// --- Keyboard Tools ---

server.tool(
  "keyboard_type",
  "Type text string using the keyboard",
  { text: z.string().describe("Text to type") },
  async ({ text }) => {
    await keyboard.type(text);
    return { content: [{ type: "text", text: `Typed: "${text}"` }] };
  }
);

server.tool(
  "keyboard_press_key",
  "Press one or more keys (supports modifiers). Key names from nut-js Key enum.",
  { keys: z.array(z.string()).describe("Key names, e.g. ['LeftControl', 'C']") },
  async ({ keys }) => {
    const resolved = keys.map((k) => {
      const key = (Key as any)[k];
      if (key === undefined) throw new Error(`Unknown key: ${k}`);
      return key;
    });
    await keyboard.pressKey(...resolved);
    await keyboard.releaseKey(...resolved);
    return { content: [{ type: "text", text: `Pressed keys: ${keys.join(" + ")}` }] };
  }
);

server.tool(
  "keyboard_hold_key",
  "Press and hold keys without releasing",
  { keys: z.array(z.string()) },
  async ({ keys }) => {
    const resolved = keys.map((k) => {
      const key = (Key as any)[k];
      if (key === undefined) throw new Error(`Unknown key: ${k}`);
      return key;
    });
    await keyboard.pressKey(...resolved);
    return { content: [{ type: "text", text: `Holding keys: ${keys.join(" + ")}` }] };
  }
);

server.tool(
  "keyboard_release_key",
  "Release previously held keys",
  { keys: z.array(z.string()) },
  async ({ keys }) => {
    const resolved = keys.map((k) => {
      const key = (Key as any)[k];
      if (key === undefined) throw new Error(`Unknown key: ${k}`);
      return key;
    });
    await keyboard.releaseKey(...resolved);
    return { content: [{ type: "text", text: `Released keys: ${keys.join(" + ")}` }] };
  }
);

// --- Screen Tools ---

server.tool(
  "screen_size",
  "Get the screen dimensions",
  {},
  async () => {
    const w = await screen.width();
    const h = await screen.height();
    return { content: [{ type: "text", text: JSON.stringify({ width: w, height: h }) }] };
  }
);

server.tool(
  "screen_capture",
  "Take a screenshot and save to file. Returns the file path.",
  {
    filename: z.string().default("screenshot").describe("File name without extension"),
    format: z.enum(["png", "jpg"]).default("png"),
    directory: z.string().optional().describe("Directory to save in (default: cwd)"),
    region: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional().describe("Optional region to capture"),
  },
  async ({ filename, format, directory, region }) => {
    const fileType = format === "jpg" ? FileType.JPG : FileType.PNG;
    const dir = directory || process.cwd();
    let filePath: string;
    if (region) {
      const r = new Region(region.x, region.y, region.width, region.height);
      filePath = await screen.captureRegion(filename, r, fileType, dir);
    } else {
      filePath = await screen.capture(filename, fileType, dir);
    }
    return { content: [{ type: "text", text: `Screenshot saved: ${filePath}` }] };
  }
);

server.tool(
  "screen_capture_base64",
  "Take a screenshot and return as base64-encoded image data",
  {
    region: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional().describe("Optional region to capture"),
  },
  async ({ region }) => {
    let image;
    if (region) {
      image = await screen.grabRegion(new Region(region.x, region.y, region.width, region.height));
    } else {
      image = await screen.grab();
    }
    const base64 = image.data.toString("base64");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            width: image.width,
            height: image.height,
            channels: image.channels,
            dataLength: image.data.length,
          }),
        },
        { type: "image", data: base64, mimeType: "image/png" },
      ],
    };
  }
);

server.tool(
  "screen_color_at",
  "Get the pixel color at a specific point",
  { x: z.number(), y: z.number() },
  async ({ x, y }) => {
    const color = await screen.colorAt(new Point(x, y));
    return { content: [{ type: "text", text: JSON.stringify({ r: color.R, g: color.G, b: color.B, a: color.A }) }] };
  }
);

// --- Clipboard Tools ---

server.tool(
  "clipboard_get",
  "Get current clipboard text content",
  {},
  async () => {
    const content = await clipboard.getContent();
    return { content: [{ type: "text", text: content }] };
  }
);

server.tool(
  "clipboard_set",
  "Set clipboard text content",
  { text: z.string() },
  async ({ text }) => {
    await clipboard.setContent(text);
    return { content: [{ type: "text", text: `Clipboard set to: "${text}"` }] };
  }
);

// --- Configuration Tools ---

server.tool(
  "configure_mouse_speed",
  "Set mouse movement speed in pixels per second",
  { speed: z.number().positive() },
  async ({ speed }) => {
    mouse.config.mouseSpeed = speed;
    return { content: [{ type: "text", text: `Mouse speed set to ${speed} px/s` }] };
  }
);

server.tool(
  "configure_mouse_delay",
  "Set delay between mouse actions in milliseconds",
  { delayMs: z.number().min(0) },
  async ({ delayMs }) => {
    mouse.config.autoDelayMs = delayMs;
    return { content: [{ type: "text", text: `Mouse auto-delay set to ${delayMs}ms` }] };
  }
);

server.tool(
  "configure_keyboard_delay",
  "Set delay between keyboard actions in milliseconds",
  { delayMs: z.number().min(0) },
  async ({ delayMs }) => {
    keyboard.config.autoDelayMs = delayMs;
    return { content: [{ type: "text", text: `Keyboard auto-delay set to ${delayMs}ms` }] };
  }
);

// --- Utility Tools ---

server.tool(
  "wait",
  "Wait for a specified duration",
  { ms: z.number().positive().describe("Milliseconds to wait") },
  async ({ ms }) => {
    await sleep(ms);
    return { content: [{ type: "text", text: `Waited ${ms}ms` }] };
  }
);

server.tool(
  "list_keys",
  "List all available key names for keyboard operations",
  {},
  async () => {
    const keys = Object.keys(Key).filter((k) => isNaN(Number(k)));
    return { content: [{ type: "text", text: JSON.stringify(keys) }] };
  }
);

// --- Scenario Tool ---

server.tool(
  "run_scenario",
  "Run a YAML-based automation scenario. The YAML defines a sequence of steps.",
  {
    yaml: z.string().describe("YAML scenario content (string)"),
  },
  async ({ yaml: yamlContent }) => {
    const results = await runScenario(yamlContent);
    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

server.tool(
  "run_scenario_file",
  "Run a YAML-based automation scenario from a file path",
  {
    path: z.string().describe("Absolute path to the YAML scenario file"),
  },
  async ({ path }) => {
    const fs = await import("fs/promises");
    const yamlContent = await fs.readFile(path, "utf-8");
    const results = await runScenario(yamlContent);
    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
