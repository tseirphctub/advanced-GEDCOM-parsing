class GedcomParser {
    constructor() {
        this.data = {};
        this.currentPath = [];
        this.levelStack = [];
    }

    parse(fileContent) {
        const lines = fileContent.split('\n');
        for (let line of lines) {
            this._processLine(line.trim());
        }
    }

    _processLine(line) {
        const match = line.match(/^(\d+)\s+(@[^@]+@|)\s*(\w+)\s*(.*)/);
        if (!match) {
            console.warn(`Warning: Could not parse line: ${line}`);
            return;
        }

        const [, level, pointer, tag, value] = match;
        const intLevel = parseInt(level, 10);
        const trimmedValue = value.trim();

        // Manage the level stack
        while (this.levelStack.length > 0 && this.levelStack[this.levelStack.length - 1] >= intLevel) {
            this.levelStack.pop();
            if (this.currentPath.length > 0) {
                this.currentPath.pop();
            }
        }

        // New record if level 0 with a pointer
        if (intLevel === 0 && pointer) {
            this.currentPath = [pointer];
            this.levelStack = [intLevel];
            if (pointer.startsWith('@I')) {
                this.data[pointer] = { type: 'INDI', details: {} };
            } else if (pointer.startsWith('@F')) {
                this.data[pointer] = { type: 'FAM', details: {} };
            } else {
                this.data[pointer] = { type: 'OTHER', details: {} };
            }
        } else {
            // Push level to stack and update path for nested structures
            if (intLevel > 0) {
                this.levelStack.push(intLevel);
                this.currentPath.push(tag);
            }

            // Store data at current path
            let current = this.data;
            for (let i = 0; i < this.currentPath.length - 1; i++) {
                if (!current[this.currentPath[i]]) {
                    current[this.currentPath[i]] = {};
                }
                current = current[this.currentPath[i]];
            }

            if (!current[tag]) {
                current[tag] = trimmedValue || [];
            } else if (Array.isArray(current[tag])) {
                current[tag].push(trimmedValue || {});
            } else {
                if (trimmedValue) {
                    current[tag] = [current[tag], trimmedValue];
                } else {
                    current[tag] = [current[tag], {}];
                }
            }
        }
    }

    getData() {
        return this.data;
    }
}

// Example usage with Node.js (you would need to read the file content in Node.js environment)
if (typeof require !== 'undefined' && require.main === module) {
    const fs = require('fs');
    
    const fileContent = fs.readFileSync('example.ged', 'utf-8');
    const parser = new GedcomParser();
    parser.parse(fileContent);
    
    // Log structure (simplified, actual output could be very large)
    for (let record in parser.getData()) {
        console.log(`Record Type: ${parser.getData()[record].type}`);
        console.log(`Details:`, JSON.stringify(parser.getData()[record].details, null, 2));
        console.log('\n');
    }
}
