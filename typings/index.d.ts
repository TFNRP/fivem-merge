import { PathLike } from 'fs';

export function merge(paths: string | string[], options: VMergeOptions): Promise<boolean>;

export class Manifest {
  public constructor(data: object);
  public get file(): string|string[]|undefined;
  public get data_file(): string|string[]|undefined;
  public get client_script(): string|string[]|undefined;
  public get server_script(): string|string[]|undefined;
}

export class Util extends null {
  public static parseManifest(src: string): object;
  public static parseMeta(path: PathLike): object;
  public static unparseMeta(object: object, options: UnparseMetaOptions): string;
  public static mergeMeta(meta0: object, meta1: object): object;
  public static mergeManifest(options: MergeManifestOptions): string;
  public static arrayAt(array: unknown[], n: number): unknown;
  public static copyRecursive(source: PathLike, destination: PathLike): void;
  public static removeRecursive(source: PathLike): void;
}

export interface VMergeOptions {
  outputPath: string;
  tempPath?: string;
  verbose?: boolean;
  lintOutput?: boolean;
  paths?: string|string[];
}

export interface UnparseMetaOptions {
  lint?: boolean;
}

export interface MergeManifestOptions {
  path?: PathLike;
  files: string[];
  data_files: string[];
}
