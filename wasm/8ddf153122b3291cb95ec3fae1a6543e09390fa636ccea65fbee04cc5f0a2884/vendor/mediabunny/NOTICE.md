# Together media core

This is a Together-specific source build of Mediabunny 1.59.0, upstream commit `2e9f24085d2d1c37e41a254dac745657db98ac3e`, with AAC roll recovery and the private managed stream adapter. It is distributed under MPL-2.0; retain LICENSE and bundle copyright notices.

Corresponding source is in `source/` in the Together source distribution. The build is `web/build-media-fork.ts`, using the exact compiler dependencies in `web/package-lock.json`. `SOURCE_PROVENANCE.json` records unchanged, modified and added files. Release distributions must include this corresponding-source archive and build inputs alongside the binaries; an upstream unmodified source URL alone does not supply the modifications.

Only the browser core is assembled. Optional upstream codecs, server, website, docs and their build/test workspaces are not claimed as rebuilt. The private companion and main entry share one Input/Source registry. The native binding remains an application-root module using the actual generated Session/StreamLease.
