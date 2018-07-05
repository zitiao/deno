// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.
import { ModuleInfo } from "./types";
import { deno as fbs } from "./msg_generated";
import { assert, typedArrayToArrayBuffer  } from "./util";

export function exit(exitCode = 0): void {
  assert(false, "Not Implemented");
  /*
  pubInternal("os", {
    command: fbs.Command.EXIT,
    exitCode
  });
  */
}

export function codeFetch(
  moduleSpecifier: string,
  containingFile: string
): ModuleInfo {
  assert(false, "Not Implemented");
  return null;
  /*
  const res = pubInternal("os", {
    command: fbs.Command.CODE_FETCH,
    codeFetchModuleSpecifier: moduleSpecifier,
    codeFetchContainingFile: containingFile
  });
  assert(res.command === fbs.Command.CODE_FETCH_RES);
  return {
    moduleName: res.codeFetchResModuleName,
    filename: res.codeFetchResFilename,
    sourceCode: res.codeFetchResSourceCode,
    outputCode: res.codeFetchResOutputCode
  };
  */
}

export function codeCache(
  filename: string,
  sourceCode: string,
  outputCode: string
): void {
  const builder = new flatbuffers.Builder(512);

  const filename_ = builder.createString(filename);
  const sourceCode_ = builder.createString(sourceCode);
  const outputCode_ = builder.createString(outputCode);

  fbs.CodeCache.startCodeCache(builder);
  fbs.CodeCache.addFilename(builder, filename_);
  fbs.CodeCache.addSourceCode(builder, sourceCode_);
  fbs.CodeCache.addOutputCode(builder, outputCode_);
  const msg = fbs.CodeCache.endCodeCache(builder);

  fbs.Base.startBase(builder);
  fbs.Base.addMsg(builder, msg);
  const base = fbs.Base.endBase(builder);

  // Maybe need to do another step?
  // Base.finishBaseBuffer(builder, base);

	const payload = typedArrayToArrayBuffer(builder.asUint8Array());
  const resBuf = deno.send("x", payload);
  assert(resBuf === null);
}

export function readFileSync(filename: string): Uint8Array {
  assert(false, "Not Implemented");
  return null;
	/*
  const res = pubInternal("os", {
    command: fbs.Command.READ_FILE_SYNC,
    readFileSyncFilename: filename
  });
  return res.readFileSyncData;
	*/
}

export function writeFileSync(
  filename: string,
  data: Uint8Array,
  perm: number
): void {
  assert(false, "Not Implemented");
	/*
  pubInternal("os", {
    command: fbs.Command.WRITE_FILE_SYNC,
    writeFileSyncFilename: filename,
    writeFileSyncData: data,
    writeFileSyncPerm: perm
  });
  */
}
