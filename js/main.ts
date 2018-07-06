// tslint:disable-next-line:no-reference
/// <reference path="deno.d.ts" />
import * as ts from "typescript";

import { flatbuffers } from "flatbuffers";
import { deno as fbs } from "./msg_generated";
import { assert } from "./util";

import * as runtime from "./runtime";

const globalEval = eval;
const window = globalEval("this");

function startMsg(): ArrayBuffer {
  const builder = new flatbuffers.Builder();
  const msg = fbs.Start.createStart(builder, 0);
  fbs.Base.startBase(builder);
  fbs.Base.addMsg(builder, msg);
  builder.finish(fbs.Base.endBase(builder));
  return typedArrayToArrayBuffer(builder.asUint8Array());
}

window["denoMain"] = () => {
  deno.print(`ts.version: ${ts.version}`);
  const res = deno.send("start", startMsg());
  // deno.print(`after`);
  const resUi8 = new Uint8Array(res);

  const bb = new flatbuffers.ByteBuffer(resUi8);
  const base = fbs.Base.getRootAsBase(bb);

  assert(fbs.Any.StartRes === base.msgType());
  const startResMsg = new fbs.StartRes();
  assert(base.msg(startResMsg) != null);

  // startDebugFlag: debugFlag,
  // startMainJs: mainJs,
  // startMainMap: mainMap
  const cwd = startResMsg.cwd();
  deno.print(`cwd: ${cwd}`);

  const argv: string[] = [];
  for (let i = 0; i < startResMsg.argvLength(); i++) {
    const arg = startResMsg.argv(i);
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
