/**
 * URLValidatorOptions interface
 * Defines the configuration options for the URL validator
 */
interface URLValidatorOptions {
    // Protocol options
    requireProtocol?: boolean;
    allowedProtocols?: string[];
    
    // Domain options
    allowedDomains?: string[] | null;
    allowedTLDs?: string[] | null;
    allowSubdomains?: boolean;
    allowIPAddresses?: boolean;
    
    // Port options
    requireSpecificPort?: boolean;
    allowedPorts?: number[] | null;
    disallowPorts?: number[] | null;
    
    // Path options
    requirePath?: boolean;
    pathPattern?: RegExp | null;
    maxPathSegments?: number | null;
    
    // Query and fragment options
    allowQuery?: boolean;
    requiredQueryParams?: string[] | null;
    allowedQueryParams?: string[] | null;
    allowFragment?: boolean;
    
    // Authentication options
    allowAuth?: boolean;
    
    // General options
    maxLength?: number;
    
    // Error message
    errorMessage?: string;
  }
  
  /**
   * Parsed URL components interface
   */
  interface ParsedURLComponents {
    protocol: string;
    hostname: string;
    port: string;
    path: string;
    query: string;
    fragment: string;
    username: string;
    password: string;
    isIPAddress: boolean;
    queryParams: [string, string][];
  }
  
  /**
   * URL Validator
   * A comprehensive URL validation class with extensive options for validating various URL components
   */
  class URLValidator {
    private options: Required<URLValidatorOptions>;
    private lastError: string;
  
    constructor(options: URLValidatorOptions = {}) {
      // Initialize with default options that can be overridden
      this.options = {
        // Protocol options
        requireProtocol: options.requireProtocol !== false, // Default to true
        allowedProtocols: options.allowedProtocols || ['http:', 'https:'],
        
        // Domain options
        allowedDomains: options.allowedDomains || null, // Optional domain restriction
        allowedTLDs: options.allowedTLDs || null, // Optional TLD restriction (e.g., ['.com', '.org'])
        allowSubdomains: options.allowSubdomains !== false, // Default to true
        allowIPAddresses: options.allowIPAddresses || false, // Default to false
        
        // Port options
        requireSpecificPort: options.requireSpecificPort || false,
        allowedPorts: options.allowedPorts || null, // Optional port restrictions
        disallowPorts: options.disallowPorts || null, // Optional disallowed ports
        
        // Path options
        requirePath: options.requirePath || false,
        pathPattern: options.pathPattern || null, // Optional regex for path validation
        maxPathSegments: options.maxPathSegments || null,
        
        // Query and fragment options
        allowQuery: options.allowQuery !== false, // Default to true
        requiredQueryParams: options.requiredQueryParams || null,
        allowedQueryParams: options.allowedQueryParams || null,
        allowFragment: options.allowFragment !== false, // Default to true
        
        // Authentication options
        allowAuth: options.allowAuth || false, // Default to false (username/password in URL)
        
        // General options
        maxLength: options.maxLength || 2083, // IE max URL length
        
        // Error message
        errorMessage: options.errorMessage || 'Invalid URL'
      };
      
      this.lastError = this.options.errorMessage;
    }
  
    /**
     * Validates if a value is a valid URL with the specified constraints
     * @param value - The URL to validate
     * @returns Whether the validation passed
     */
    public validate(value: string): boolean {
      if (typeof value !== 'string') {
        this.lastError = 'URL must be a string';
        return false;
      }
      
      // Check max length
      if (value.length > this.options.maxLength) {
        this.lastError = `URL exceeds maximum length of ${this.options.maxLength} characters`;
        return false;
      }
      
      let url: URL;
      try {
        url = new URL(value);
      } catch (e) {
        // If protocol is required but not present, special error
        if (this.options.requireProtocol && !value.includes('://')) {
          this.lastError = 'URL must include a protocol (e.g., http://, https://)';
        } else {
          this.lastError = 'Invalid URL format';
        }
        return false;
      }
      
      // Validate protocol
      if (!this._validateProtocol(url)) {
        return false;
      }
      
      // Validate domain
      if (!this._validateDomain(url)) {
        return false;
      }
      
      // Validate port
      if (!this._validatePort(url)) {
        return false;
      }
      
      // Validate path
      if (!this._validatePath(url)) {
        return false;
      }
      
      // Validate query parameters
      if (!this._validateQuery(url)) {
        return false;
      }
      
      // Validate fragment
      if (!this._validateFragment(url)) {
        return false;
      }
      
      // Validate authentication
      if (!this._validateAuth(url)) {
        return false;
      }
      
      return true;
    }
    
    /**
     * Get the last validation error message
     * @returns The error message
     */
    public getErrorMessage(): string {
      return this.lastError;
    }
    
    /**
     * Reset the error message to the default
     */
    public resetError(): void {
      this.lastError = this.options.errorMessage;
    }
    
    /**
     * Validate the URL protocol
     * @param url - The URL object to validate
     * @returns Whether the protocol is valid
     * @private
     */
    private _validateProtocol(url: URL): boolean {
      const protocol = url.protocol;
      
      if (this.options.requireProtocol && !protocol) {
        this.lastError = 'URL must include a protocol';
        return false;
      }
      
      if (protocol && this.options.allowedProtocols && 
          !this.options.allowedProtocols.includes(protocol)) {
        this.lastError = `URL protocol must be one of: ${this.options.allowedProtocols.join(', ')}`;
        return false;
      }
      
      return true;
    }
    
    /**
     * Validate the URL domain
     * @param url - The URL object to validate
     * @returns Whether the domain is valid
     * @private
     */
    private _validateDomain(url: URL): boolean {
      const hostname = url.hostname;
      
      // Check if it's an IP address
      const isIPAddress = this._isIPAddress(hostname);
      
      if (isIPAddress && !this.options.allowIPAddresses) {
        this.lastError = 'IP addresses are not allowed in URLs';
        return false;
      }
      
      // Check allowed domains
      if (!isIPAddress && this.options.allowedDomains) {
        const domainValid = this.options.allowedDomains.some(domain => {
          // Check exact match
          if (hostname === domain) {
            return true;
          }
          
          // Check subdomain match if allowed
          if (this.options.allowSubdomains && hostname.endsWith(`.${domain}`)) {
            return true;
          }
          
          return false;
        });
        
        if (!domainValid) {
          this.lastError = `URL domain must be one of: ${this.options.allowedDomains.join(', ')}`;
          if (this.options.allowSubdomains) {
            this.lastError += ' or their subdomains';
          }
          return false;
        }
      }
      
      // Check allowed TLDs
      if (!isIPAddress && this.options.allowedTLDs) {
        const tldValid = this.options.allowedTLDs.some(tld => 
          hostname.endsWith(tld)
        );
        
        if (!tldValid) {
          this.lastError = `URL must end with one of these TLDs: ${this.options.allowedTLDs.join(', ')}`;
          return false;
        }
      }
      
      return true;
    }
    
    /**
     * Validate the URL port
     * @param url - The URL object to validate
     * @returns Whether the port is valid
     * @private
     */
    private _validatePort(url: URL): boolean {
      const port = url.port;
      
      // If specific port is required but not present
      if (this.options.requireSpecificPort && !port) {
        this.lastError = 'URL must specify a port';
        return false;
      }
      
      // If port is present, check if it's in the allowed list
      if (port && this.options.allowedPorts) {
        const portNumber = parseInt(port, 10);
        if (!this.options.allowedPorts.includes(portNumber)) {
          this.lastError = `URL port must be one of: ${this.options.allowedPorts.join(', ')}`;
          return false;
        }
      }
      
      // Check if port is in the disallowed list
      if (port && this.options.disallowPorts) {
        const portNumber = parseInt(port, 10);
        if (this.options.disallowPorts.includes(portNumber)) {
          this.lastError = `URL port cannot be one of: ${this.options.disallowPorts.join(', ')}`;
          return false;
        }
      }
      
      return true;
    }
    
    /**
     * Validate the URL path
     * @param url - The URL object to validate
     * @returns Whether the path is valid
     * @private
     */
    private _validatePath(url: URL): boolean {
      const path = url.pathname;
      
      // If path is required but not present or just '/'
      if (this.options.requirePath && (path === '/' || path === '')) {
        this.lastError = 'URL must include a path';
        return false;
      }
      
      // Check path against pattern if specified
      if (this.options.pathPattern && path !== '/') {
        if (!this.options.pathPattern.test(path)) {
          this.lastError = 'URL path does not match the required pattern';
          return false;
        }
      }
      
      // Check maximum number of path segments
      if (this.options.maxPathSegments !== null) {
        // Count path segments (excluding empty segments)
        const segments = path.split('/').filter(segment => segment.length > 0);
        if (segments.length > this.options.maxPathSegments) {
          this.lastError = `URL path exceeds maximum of ${this.options.maxPathSegments} segments`;
          return false;
        }
      }
      
      return true;
    }
    
    /**
     * Validate the URL query parameters
     * @param url - The URL object to validate
     * @returns Whether the query is valid
     * @private
     */
    private _validateQuery(url: URL): boolean {
      const hasQuery = url.search.length > 0;
      
      // If query parameters are not allowed but present
      if (!this.options.allowQuery && hasQuery) {
        this.lastError = 'Query parameters are not allowed in the URL';
        return false;
      }
      
      if (hasQuery) {
        const params = url.searchParams;
        
        // Check for required query parameters
        if (this.options.requiredQueryParams) {
          for (const requiredParam of this.options.requiredQueryParams) {
            if (!params.has(requiredParam)) {
              this.lastError = `URL must include the required query parameter: ${requiredParam}`;
              return false;
            }
          }
        }
        
        // Check that all query parameters are in the allowed list
        if (this.options.allowedQueryParams) {
          // Use forEach instead of for...of iteration to avoid Symbol.iterator issues
          const paramNames: string[] = [];
          params.forEach((_, key) => {
            paramNames.push(key);
          });
          
          for (const param of paramNames) {
            if (!this.options.allowedQueryParams.includes(param)) {
              this.lastError = `Query parameter '${param}' is not allowed. Allowed parameters are: ${this.options.allowedQueryParams.join(', ')}`;
              return false;
            }
          }
        }
      }
      
      return true;
    }
    
    /**
     * Validate the URL fragment
     * @param url - The URL object to validate
     * @returns Whether the fragment is valid
     * @private
     */
    private _validateFragment(url: URL): boolean {
      const hasFragment = url.hash.length > 0;
      
      // If fragments are not allowed but present
      if (!this.options.allowFragment && hasFragment) {
        this.lastError = 'Fragments (hash) are not allowed in the URL';
        return false;
      }
      
      return true;
    }
    
    /**
     * Validate the URL authentication
     * @param url - The URL object to validate
     * @returns Whether the authentication is valid
     * @private
     */
    private _validateAuth(url: URL): boolean {
      const hasAuth = url.username || url.password;
      
      // If auth is not allowed but present
      if (!this.options.allowAuth && hasAuth) {
        this.lastError = 'Authentication credentials are not allowed in the URL';
        return false;
      }
      
      return true;
    }
    
    /**
     * Check if a hostname is an IP address
     * @param hostname - The hostname to check
     * @returns Whether the hostname is an IP address
     * @private
     */
    private _isIPAddress(hostname: string): boolean {
      // Simple IPv4 check
      const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      if (ipv4Pattern.test(hostname)) {
        const parts = hostname.split('.');
        return parts.every(part => parseInt(part, 10) <= 255);
      }
      
      // Simple IPv6 check
      const ipv6Pattern = /^(\[[0-9a-fA-F:]+\])$/;
      return ipv6Pattern.test(hostname);
    }
    
    /**
     * Parse a URL into its components for analysis
     * @param url - The URL to parse
     * @returns The parsed URL components or null if invalid
     */
    public parseURL(url: string): ParsedURLComponents | null {
      try {
        const parsedURL = new URL(url);
        
        // Create queryParams in a way that's compatible with all TypeScript targets
        const queryParams: [string, string][] = [];
        parsedURL.searchParams.forEach((value, key) => {
          queryParams.push([key, value]);
        });
        
        return {
          protocol: parsedURL.protocol,
          hostname: parsedURL.hostname,
          port: parsedURL.port || this._getDefaultPort(parsedURL.protocol),
          path: parsedURL.pathname,
          query: parsedURL.search,
          fragment: parsedURL.hash,
          username: parsedURL.username,
          password: parsedURL.password,
          isIPAddress: this._isIPAddress(parsedURL.hostname),
          queryParams
        };
      } catch (e) {
        return null;
      }
    }
    
    /**
     * Get the default port for a protocol
     * @param protocol - The protocol
     * @returns The default port
     * @private
     */
    private _getDefaultPort(protocol: string): string {
      const defaultPorts: Record<string, string> = {
        'http:': '80',
        'https:': '443',
        'ftp:': '21',
        'ssh:': '22',
        'telnet:': '23',
        'smtp:': '25',
        'pop3:': '110',
        'imap:': '143',
        'ldap:': '389'
      };
      
      return defaultPorts[protocol] || '';
    }
    
    /**
     * Normalize a URL by removing default ports, trailing slashes, etc.
     * @param url - The URL to normalize
     * @returns The normalized URL or null if invalid
     */
    public normalizeURL(url: string): string | null {
      try {
        const parsedURL = new URL(url);
        
        // Remove default ports
        const defaultPort = this._getDefaultPort(parsedURL.protocol);
        if (parsedURL.port === defaultPort) {
          parsedURL.port = '';
        }
        
        // Lowercase hostname
        parsedURL.hostname = parsedURL.hostname.toLowerCase();
        
        // Remove trailing slash from path if it's just a single slash
        if (parsedURL.pathname === '/') {
          parsedURL.pathname = '';
        }
        
        return parsedURL.toString();
      } catch (e) {
        return null;
      }
    }
  }
  
  // Export the validator
  export { URLValidator, URLValidatorOptions, ParsedURLComponents };