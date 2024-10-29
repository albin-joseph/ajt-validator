export class ajtValidator {
    private pattern: string; // Holds the regex pattern
    private flags: string;   // Regex flags

    constructor() {
        this.pattern = ''; // Initialize the pattern
        this.flags = 'g';  // Default regex flags
    }

    // Set the input type (string validation)
    isString(): this {
        this.pattern += '^.*$'; // Accept any string by default
        return this;
    }

    // Set maximum length
    maxLen(max: number): this {
        this.pattern = this.pattern.replace(/\$$/, ''); // Remove end-anchor temporarily
        this.pattern += `.{0,${max}}$`; // Enforce max length
        return this;
    }

    // Set minimum length
    minLen(min: number): this {
        this.pattern = this.pattern.replace(/\$$/, ''); // Remove end-anchor temporarily
        this.pattern += `.{${min},}`; // Enforce min length
        return this;
    }

    // Allow specific character types (e.g., alphanumeric, digits, etc.)
    isAllow(type: 'alphanumeric' | 'digits' | 'letters' | 'special'): this {
        switch (type) {
            case 'alphanumeric':
                this.pattern = this.pattern.replace(/\^.*\$/, '[a-zA-Z0-9]*');
                break;
            case 'digits':
                this.pattern = this.pattern.replace(/\^.*\$/, '\\d*');
                break;
            case 'letters':
                this.pattern = this.pattern.replace(/\^.*\$/, '[a-zA-Z]*');
                break;
            case 'special':
                this.pattern = this.pattern.replace(/\^.*\$/, '[!@#$%^&*]*');
                break;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
        return this;
    }

    // Set case-insensitive flag (optional)
    caseInsensitive(): this {
        this.flags += 'i';
        return this;
    }

    // Build and return the regex pattern
    build(): RegExp {
        return new RegExp(this.pattern, this.flags);
    }

    // Validate a given input string
    validate(input: string): boolean {
        const regex = this.build();
        return regex.test(input);
    }
}
