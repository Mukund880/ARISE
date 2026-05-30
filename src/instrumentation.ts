export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Dynatrace OneAgent automatically reads configuration from standard DT_* env variables
      const oneagent = require('@dynatrace/oneagent');
      oneagent.initialize();
      console.log("=== Dynatrace OneAgent Telemetry Registered ===");
    } catch (e) {
      console.warn("Dynatrace OneAgent SDK failed to load. If this is local development, you can ignore this warning.", e);
    }
  }
}
