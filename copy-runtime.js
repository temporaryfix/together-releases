import { FluentBundle, FluentResource } from "./vendor/fluent-bundle.js";

/** A formatter with no DOM or network dependencies. Invalid catalog use fails in tests. */
export function createCopy(source) {
  const bundle = new FluentBundle("en", { useIsolating: false });
  const errors = bundle.addResource(new FluentResource(source));
  if (errors.length) throw new AggregateError(errors, "Invalid Together catalog");
  return (id, args) => {
    const message = bundle.getMessage(id);
    if (!message?.value) throw new Error(`Missing Together message: ${id}`);
    const errors = [];
    const value = bundle.formatPattern(message.value, args, errors);
    if (errors.length) throw new AggregateError(errors, `Invalid arguments for ${id}`);
    return value;
  };
}
