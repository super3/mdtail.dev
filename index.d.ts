/**
 * mdtail - Terminal markdown viewer with live refresh
 */

declare module 'mdtail' {
  /**
   * Display class for handling terminal UI operations
   */
  export class Display {
    constructor();
    clearScreen(): void;
    hideCursor(): void;
    showCursor(): void;
    getTerminalWidth(): number;
    renderTabs(files: string[], currentIndex: number): string;
    formatContent(content: string, filename: string): string;
    renderNavigation(currentIndex: number, totalFiles: number): string;
    render(content: string, filename: string, files: string[], currentIndex: number): void;
    showFileList(fileCount: number): void;
  }

  /**
   * FileManager class for handling file operations
   */
  export class FileManager {
    files: string[];
    watchInterval: number;
    defaultFile: string;
    
    constructor();
    expandFiles(args: string[], currentDir?: string): Promise<string[]>;
    validateFiles(files: string[]): boolean;
    readFile(filePath: string): Promise<string>;
    startWatching(files: string[], onFileChange: (index: number) => void): void;
    stopWatching(files: string[]): void;
    getFiles(): string[];
  }

  /**
   * Main MdTail class
   */
  export class MdTail {
    display: Display;
    fileManager: FileManager;
    files: string[];
    currentTabIndex: number;
    
    constructor();
    parseArguments(args: string[]): { showHelp: boolean };
    expandFiles(args: string[], currentDir?: string): Promise<string[]>;
    validateFiles(files: string[]): boolean;
    clearScreen(): void;
    hideCursor(): void;
    showCursor(): void;
    renderTabs(files: string[], currentIndex: number, width?: number): string;
    formatContent(content: string, filename: string, width?: number): string;
    displayCurrentFile(): Promise<void>;
    getHelpText(): string;
    navigateTab(direction: 'left' | 'right'): boolean;
    setupKeyboardNavigation(): void;
    startWatching(): Promise<void>;
    stopWatching(): void;
    cleanup(): Promise<void>;
    run(args: string[]): Promise<void>;
  }

  export = MdTail;
}