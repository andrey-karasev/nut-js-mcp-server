import * as yaml from "js-yaml";
import {
  mouse,
  keyboard,
  screen,
  clipboard,
  straightTo,
  sleep,
  Point,
  Region,
  Button,
  Key,
  FileType,
} from "@nut-tree-fork/nut-js";

interface Step {
  action: string;
  [key: string]: any;
}

interface Scenario {
  name?: string;
  config?: {
    mouseSpeed?: number;
    mouseDelay?: number;
    keyboardDelay?: number;
  };
  steps: Step[];
}

function resolveButton(name: string): Button {
  switch (name?.toLowerCase()) {
    case "right": return Button.RIGHT;
    case "middle": return Button.MIDDLE;
    default: return Button.LEFT;
  }
}

function resolveKeys(keys: string[]): Key[] {
  return keys.map((k) => {
    const resolved = (Key as any)[k];
    if (resolved === undefined) throw new Error(`Unknown key: ${k}`);
    return resolved;
  });
}

async function executeStep(step: Step): Promise<string> {
  switch (step.action) {
    case "move": {
      await mouse.move(straightTo(new Point(step.x, step.y)));
      return `Moved mouse to (${step.x}, ${step.y})`;
    }
    case "click": {
      const btn = resolveButton(step.button);
      if (step.double) {
        await mouse.doubleClick(btn);
      } else {
        await mouse.click(btn);
      }
      return `Clicked ${step.button || "left"}${step.double ? " (double)" : ""}`;
    }
    case "press": {
      await mouse.pressButton(resolveButton(step.button));
      return `Pressed mouse ${step.button || "left"}`;
    }
    case "release": {
      await mouse.releaseButton(resolveButton(step.button));
      return `Released mouse ${step.button || "left"}`;
    }
    case "scroll": {
      const amount = step.amount || 1;
      switch (step.direction) {
        case "up": await mouse.scrollUp(amount); break;
        case "down": await mouse.scrollDown(amount); break;
        case "left": await mouse.scrollLeft(amount); break;
        case "right": await mouse.scrollRight(amount); break;
        default: throw new Error(`Invalid scroll direction: ${step.direction}`);
      }
      return `Scrolled ${step.direction} by ${amount}`;
    }
    case "drag": {
      await mouse.drag(straightTo(new Point(step.x, step.y)));
      return `Dragged to (${step.x}, ${step.y})`;
    }
    case "type": {
      await keyboard.type(step.text);
      return `Typed: "${step.text}"`;
    }
    case "key": {
      const keys = Array.isArray(step.keys) ? step.keys : [step.keys];
      const resolved = resolveKeys(keys);
      await keyboard.pressKey(...resolved);
      await keyboard.releaseKey(...resolved);
      return `Pressed keys: ${keys.join(" + ")}`;
    }
    case "hotkey": {
      const keys = Array.isArray(step.keys) ? step.keys : [step.keys];
      const resolved = resolveKeys(keys);
      await keyboard.pressKey(...resolved);
      await keyboard.releaseKey(...resolved);
      return `Hotkey: ${keys.join(" + ")}`;
    }
    case "screenshot": {
      const format = step.format === "jpg" ? FileType.JPG : FileType.PNG;
      const dir = step.directory || process.cwd();
      const filename = step.filename || "screenshot";
      let filePath: string;
      if (step.region) {
        const r = new Region(step.region.x, step.region.y, step.region.width, step.region.height);
        filePath = await screen.captureRegion(filename, r, format, dir);
      } else {
        filePath = await screen.capture(filename, format, dir);
      }
      return `Screenshot saved: ${filePath}`;
    }
    case "clipboard_set": {
      await clipboard.setContent(step.text);
      return `Clipboard set to: "${step.text}"`;
    }
    case "clipboard_get": {
      const content = await clipboard.getContent();
      return `Clipboard content: "${content}"`;
    }
    case "wait": {
      await sleep(step.ms || 1000);
      return `Waited ${step.ms || 1000}ms`;
    }
    case "repeat": {
      const results: string[] = [];
      const count = step.count || 1;
      for (let i = 0; i < count; i++) {
        for (const subStep of step.steps || []) {
          results.push(await executeStep(subStep));
        }
      }
      return `Repeated ${count} times:\n  ${results.join("\n  ")}`;
    }
    default:
      throw new Error(`Unknown action: ${step.action}`);
  }
}

export async function runScenario(yamlContent: string): Promise<string[]> {
  const scenario = yaml.load(yamlContent) as Scenario;
  const results: string[] = [];

  if (scenario.name) {
    results.push(`Running scenario: ${scenario.name}`);
  }

  if (scenario.config) {
    if (scenario.config.mouseSpeed !== undefined) {
      mouse.config.mouseSpeed = scenario.config.mouseSpeed;
    }
    if (scenario.config.mouseDelay !== undefined) {
      mouse.config.autoDelayMs = scenario.config.mouseDelay;
    }
    if (scenario.config.keyboardDelay !== undefined) {
      keyboard.config.autoDelayMs = scenario.config.keyboardDelay;
    }
    results.push("Applied configuration");
  }

  if (!scenario.steps || !Array.isArray(scenario.steps)) {
    throw new Error("Scenario must have a 'steps' array");
  }

  for (const step of scenario.steps) {
    try {
      const result = await executeStep(step);
      results.push(`✓ ${result}`);
    } catch (err: any) {
      results.push(`✗ Step "${step.action}" failed: ${err.message}`);
      throw err;
    }
  }

  return results;
}
