// tslint:disable-next-line:no-reference
/// <reference path="deno.d.ts" />
import * as ts from "typescript";

import { flatbuffers } from "flatbuffers";
import { deno as fbs } from "./msg_generated";

const globalEval = eval;
const window = globalEval("this");

window["denoMain"] = () => {
  deno.print(`ts.version: ${ts.version}`);
  const res = deno.send("startDeno2", emptyArrayBuffer());
  // deno.print(`after`);
  const resUi8 = new Uint8Array(res);

  const bb = new flatbuffers.ByteBuffer(resUi8);
  const msg = fbs.Msg.getRootAsMsg(bb);

  // startDebugFlag: debugFlag,
  // startMainJs: mainJs,
  // startMainMap: mainMap
  const cwd = msg.startCwd();
  deno.print(`cwd: ${cwd}`);

  const argv: string[] = [];
  for (let i = 0; i < msg.startArgvLength(); i++) {
    const arg = msg.startArgv(i);
    deno.print(`argv[${i}] ${arg}`);
  }

  bench();
};

function bench() {
  const transceive = deno.transceive;
  const ab1 = new ArrayBuffer(3000);
  const ab2 = new ArrayBuffer(4000);
  const ab3 = new ArrayBuffer(4000);

  for (;;) {
    const start = Date.now();
    const count = 25e6;

    for (let i = 0; i < count; i++) {
      transceive(ab1, ab2, ab3);
    }

    const elapsed = (Date.now() - start) / 1000;
    const tput = count / elapsed;
    deno.print(`time: ${elapsed}s, tput: ${tput}t/s`);
  }
}

function typedArrayToArrayBuffer(ta: Uint8Array): ArrayBuffer {
  return ta.buffer.slice(
    ta.byteOffset,
    ta.byteOffset + ta.byteLength
  ) as ArrayBuffer;
}

function emptyArrayBuffer(): ArrayBuffer {
  return typedArrayToArrayBuffer(new Uint8Array([]));
}
