/**
 * @fileoverview File Saver Tool
 * This module provides functionality to save content to local files with configurable encoding.
 * @module file-saver
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { BaseTool, ToolDefinition } from "./base-tool";

/**
 * @class FileSaverTool
 * @extends BaseTool
 * @description A tool for saving content to local files with configurable encoding options.
 * Automatically creates parent directories if they don't exist.
 * 
 * @example
 * const saver = new FileSaverTool();
 * await saver.execute({
 *   path: './nested/dir/output.txt',
 *   content: 'Hello, World!',
 *   encoding: 'utf-8'
 * });
 */
export class FileSaverTool extends BaseTool {
  /**
   * @constructor
   * @param {Record<string, any>} [config={}] - Tool configuration options
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   * @description Provides the tool's definition including input/output specifications
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'fileSaver',
      description: 'Saves content to local file, creating directories if needed',
      input: {
        path: { 
          type: 'string', 
          required: true, 
          description: 'File path' 
        },
        content: { 
          type: 'string', 
          required: true, 
          description: 'Content to save' 
        },
        encoding: { 
          type: 'string', 
          required: false, 
          description: 'File encoding' 
        }
      },
      output: { 
        type: 'string', 
        description: 'Saved file path' 
      }
    };
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @param {string} inputs.path - Target file path
   * @param {string} inputs.content - Content to write to file
   * @param {string} [inputs.encoding='utf-8'] - File encoding
   * @returns {Promise<string>} Path of the saved file
   * @throws {Error} If file writing fails
   * 
   * @example
   * const result = await fileSaver.execute({
   *   path: './nested/dir/data.txt',
   *   content: 'Sample content',
   *   encoding: 'utf-8'
   * });
   */
  async execute(inputs: Record<string, any>) {
    try {
      // Get the directory path
      const dirPath = path.dirname(inputs.path);

      // Create directory if it doesn't exist
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Write the file
      await writeFile(inputs.path, inputs.content, inputs.encoding || 'utf-8');
      return inputs.path;
    } catch (error) {
      throw new Error(`Failed to save file ${inputs.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}