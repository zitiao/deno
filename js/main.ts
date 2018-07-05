// tslint:disable-next-line:no-reference
/// <reference path="deno.d.ts" />
import * as ts from "typescript";

import { flatbuffers } from "flatbuffers";
import { deno as fbs } from "./msg_generated";
import { assert } from "./util";

import * as runtime from "./runtime";

const globalEval = eval;
const window = globalEval("this");

window["denoMain"] = () => {
  deno.print(`ts.version: ${ts.version}`);
  const res = deno.send("startDeno2", emptyArrayBuffer());
  // deno.print(`after`);
  const resUi8 = new Uint8Array(res);

  const bb = new flatbuffers.ByteBuffer(resUi8);
  const base = fbs.Base.getRootAsBase(bb);

  assert(fbs.Any.Start === base.msgType());
  const startMsg = new fbs.Start();
  assert(base.msg(startMsg) != null);

  // startDebugFlag: debugFlag,
  // startMainJs: mainJs,
  // startMainMap: mainMap
  const cwd = startMsg.cwd();
  deno.print(`cwd: ${cwd}`);

  const argv: string[] = [];
  for (let i = 0; i < startMsg.argvLength(); i++) {
    const arg = startMsg.argv(i);
    argv.push(arg);
    deno.print(`argv[${i}] ${arg}`);
  }

  const inputFn = argv[0];
  const mod = runtime.resolveModule(inputFn, `${cwd}/`);
  mod.compileAndRun();
};

function typedArrayToArrayBuffer(ta: Uint8Array): ArrayBuffer {
  return ta.buffer.slice(
    ta.byteOffset,
    ta.byteOffset + ta.byteLength
  ) as ArrayBuffer;
}

function emptyArrayBuffer(): ArrayBuffer {
  return typedArrayToArrayBuffer(new Uint8Array([]));
}
