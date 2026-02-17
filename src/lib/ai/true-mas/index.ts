/**
 * True MAS exports
 */

export { messageBus, type TrueMASMessage } from "./message-bus";
export { generalistAgent } from "./generalist-agent";
export { initializeSpecialists } from "./specialist-agents";
export { trueMASOrchestrator } from "./mas-orchestrator";
export type { MASAdventureState } from "./mas-orchestrator";

console.log("✨ True Multi-Agent System module loaded");
