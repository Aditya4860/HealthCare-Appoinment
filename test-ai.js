"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_1 = require("./lib/ai");
async function runTests() {
    console.log("=== Case 1: Low ===");
    const res1 = await (0, ai_1.getPreVisitSummary)("I have had a mild sore throat and runny nose for the past two days. I have been sneezing occasionally and feel slightly tired. I have no difficulty breathing, chest pain, or high fever. I am able to eat, drink, and continue my normal activities.");
    console.log(JSON.stringify(res1, null, 2));
    console.log("\n=== Case 2: Medium ===");
    const res2 = await (0, ai_1.getPreVisitSummary)("I have had a fever for two days, reaching around 38.5°C. I also have body aches, headache, and fatigue. I have been drinking fluids but still feel weak. I do not have difficulty breathing, chest pain, confusion, or severe vomiting.");
    console.log(JSON.stringify(res2, null, 2));
    console.log("\n=== Case 3: High ===");
    const res3 = await (0, ai_1.getPreVisitSummary)("I have developed severe difficulty breathing since this morning. I feel short of breath even while sitting still and have difficulty speaking in complete sentences. I also have chest tightness and feel very weak. The symptoms have been getting worse over the last few hours.");
    console.log(JSON.stringify(res3, null, 2));
}
runTests();
