import fs from "fs/promises";
import path from "path";

class CharacterMerger {
  constructor(characterNames, outputName) {
    this.characterNames = characterNames;
    this.outputName = outputName.toLowerCase();
    this.charactersDir = "characters";
    this.mergedDir = "merged-character";
    this.outputFile = path.join(this.mergedDir, `${this.outputName}.json`);
  }

  async loadCharacter(name) {
    try {
      const filePath = path.join(this.charactersDir, `${name}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading character ${name}: ${error.message}`);
      throw error;
    }
  }

  mergeArraysUnique(...arrays) {
    return Array.from(new Set(arrays.flat()));
  }

  mergeStyleRules(...styleArrays) {
    // Remove duplicates and contradicting rules
    return Array.from(new Set(styleArrays.flat())).filter(rule => {
      const normalizedRule = rule.toLowerCase();
      return !styleArrays.flat().some(otherRule => 
        otherRule !== rule && 
        otherRule.toLowerCase().includes(normalizedRule.replace(/don't|never|no/g, ''))
      );
    });
  }

  async mergeCharacters() {
    try {
      // Load all character data
      const characters = await Promise.all(
        this.characterNames.map(name => this.loadCharacter(name))
      );

      // Create merged character data
      const mergedCharacter = {
        name: this.outputName,
        plugins: this.mergeArraysUnique(...characters.map(c => c.plugins || [])),
        clients: this.mergeArraysUnique(...characters.map(c => c.clients || [])),
        modelProvider: characters[0].modelProvider || "anthropic",
        settings: {
          secrets: {},
          voice: characters[0].settings?.voice || {
            model: "en_US-hfc_female-medium",
          },
        },
        system: `Roleplay as ${this.outputName}, combining traits of ${this.characterNames.join(", ")}.`,
        bio: this.mergeArraysUnique(...characters.map(c => c.bio || [])),
        lore: this.mergeArraysUnique(...characters.map(c => c.lore || [])),
        knowledge: this.mergeArraysUnique(...characters.map(c => c.knowledge || [])),
        messageExamples: this.mergeArraysUnique(
          ...characters.map(c => c.messageExamples || [])
        ),
        postExamples: this.mergeArraysUnique(
          ...characters.map(c => c.postExamples || [])
        ),
        adjectives: this.mergeArraysUnique(
          ...characters.map(c => c.adjectives || [])
        ),
        people: this.mergeArraysUnique(...characters.map(c => c.people || [])),
        topics: this.mergeArraysUnique(...characters.map(c => c.topics || [])),
        style: {
          all: this.mergeStyleRules(
            ...characters.map(c => c.style?.all || [])
          ),
          chat: this.mergeStyleRules(
            ...characters.map(c => c.style?.chat || [])
          ),
          post: this.mergeStyleRules(
            ...characters.map(c => c.style?.post || [])
          ),
        },
      };

      // Ensure output directory exists
      await fs.mkdir(this.charactersDir, { recursive: true });
      await fs.mkdir(this.mergedDir, { recursive: true });

      // Save merged character
      await fs.writeFile(
        this.outputFile,
        JSON.stringify(mergedCharacter, null, 2),
        "utf-8"
      );

      console.log(`✅ Successfully merged characters into ${this.outputFile}`);
      console.log(`📝 Combined ${this.characterNames.length} characters`);
      console.log(`📝 Total topics: ${mergedCharacter.topics.length}`);
      console.log(`📝 Total post examples: ${mergedCharacter.postExamples.length}`);

      return mergedCharacter;
    } catch (error) {
      console.error(`Failed to merge characters: ${error.message}`);
      throw error;
    }
  }
}

// Usage
const run = async () => {
  const args = process.argv.slice(2);
//   const outputName = args[0];
//   const characterNames = args.slice(1);

//   if (!outputName || characterNames.length < 2) {
//     console.error(
//       "Please provide an output name and at least two character names to merge"
//     );
//     console.error("Usage: node MergeCharacter.js <outputName> <character1> <character2> ...");
//     process.exit(1);
//   }

  // get all character files in the characters directory
  const characterFiles = await fs.readdir("characters");
  const characterNames = characterFiles.map(file => file.replace(".json", ""));
  const outputName = "merged-character";

  console.log(`Merging characters: ${characterNames.join(", ")} into ${outputName}`);
  const merger = new CharacterMerger(characterNames, outputName);
  await merger.mergeCharacters();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
