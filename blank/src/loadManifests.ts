import { parseManifestsOrThrow, type Manifest } from "@aotterclam/mantle/spec";
import exampleYaml from "../manifests/example.yaml";

export function loadManifests(): readonly Manifest[] {
  return parseManifestsOrThrow([exampleYaml], { context: "starters/blank" });
}
