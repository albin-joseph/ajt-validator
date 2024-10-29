export const ajtValidator = (input: string) => {
    let pattern = '^'; // Start with beginning anchor for regex
    let flags = 'g'; // Default regex flags
  
    return {
      // Validate if the input is a string
      isString() {
        if (typeof input !== 'string') {
          throw new Error('Input is not a string');
        }
        return this;
      },
  
      // Set the maximum length constraint
      maxLen(max:number) {
        pattern += `.{0,${max}}$`; // Ends with a max length constraint
        return this;
      },
  
      // Set the minimum length constraint
      minLen(min:number) {
        pattern = pattern.replace(/\^/, `^.{${min},`); // Start with min length constraint
        return this;
      },
  
      // Allow specific character types (e.g., alphanumeric, digits, special characters)
      isAllow(type:string) {
        let charClass = '';
        switch (type) {
          case 'alphanumeric':
            charClass = '[a-zA-Z0-9]';
            break;
          case 'digits':
            charClass = '\\d';
            break;
          case 'letters':
            charClass = '[a-zA-Z]';
            break;
          case 'special':
            charClass = '[!@#$%^&*]';
            break;
          default:
            throw new Error(`Unsupported type: ${type}`);
        }
        pattern = pattern.replace(/\$/, `${charClass}*$`); // Append allowed characters
        return this;
      },
  
      // Make the regex case-insensitive
      caseInsensitive() {
        flags += 'i';
        return this;
      },
  
      // Build and test the final regex pattern
      validate() {
        const regex = new RegExp(pattern, flags);
        return regex.test(input);
      }
    };
  };
  
  