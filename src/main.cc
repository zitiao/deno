// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.
#include <stdio.h>
#include <stdlib.h>
#include <string>

#ifdef _WIN32
#include <direct.h>
#else
#include <unistd.h>
#endif

#include "flatbuffers/flatbuffers.h"
#include "include/deno.h"
#include "src/msg_generated.h"
#include "third_party/v8/src/base/logging.h"

static char** global_argv;
static int global_argc;

// Sends StartRes message
void HandleStart(Deno* d) {
  flatbuffers::FlatBufferBuilder builder;

  char cwdbuf[1024];
  // TODO(piscisaureus): support unicode on windows.
  getcwd(cwdbuf, sizeof(cwdbuf));
  auto start_cwd = builder.CreateString(cwdbuf);

  std::vector<flatbuffers::Offset<flatbuffers::String>> args;
  for (int i = 0; i < global_argc; ++i) {
    args.push_back(builder.CreateString(global_argv[i]));
  }

  auto start_argv = builder.CreateVector(args);
  auto start_msg = deno::CreateStartRes(builder, start_cwd, start_argv);
  auto base =
      deno::CreateBase(builder, 0, deno::Any_StartRes, start_msg.Union());
  builder.Finish(base);
  deno_buf bufout{reinterpret_cast<const char*>(builder.GetBufferPointer()),
                  builder.GetSize()};
  deno_set_response(d, bufout);
}

void MessagesFromJS(Deno* d, const char* channel, deno_buf buf) {
  flatbuffers::Verifier verifier(reinterpret_cast<const uint8_t*>(buf.data),
                                 buf.len);
  DCHECK(verifier.VerifyBuffer<deno::Base>());

  auto base = flatbuffers::GetRoot<deno::Base>(buf.data);
  auto msg_type = base->msg_type();
  const char* msg_type_name = deno::EnumNamesAny()[msg_type];
  printf("MessagesFromJS channel %s, msg_type = %d, msg_type_name = %s\n",
      channel, msg_type, msg_type_name);

  HandleStart(d);
}

int main(int argc, char** argv) {
  deno_init();

  deno_set_flags(&argc, argv);
  global_argv = argv;
  global_argc = argc;

  Deno* d = deno_new(NULL, MessagesFromJS);
  bool r = deno_execute(d, "deno_main.js", "denoMain();");
  if (!r) {
    printf("%s\n", deno_last_exception(d));
    exit(1);
  }
  deno_delete(d);
}
