// app/tracing.js
'use strict'

// NodeSDK wires together the exporter, instrumentation, and resource detection.
const { NodeSDK }                    = require('@opentelemetry/sdk-node')
// Patches popular libraries (Express, pg, http) to emit spans automatically.
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
// Sends span data over HTTP using the OpenTelemetry Protocol (OTLP).
const { OTLPTraceExporter }          = require('@opentelemetry/exporter-trace-otlp-http')
// Used in traceContext() to read the currently active span's IDs.
const { trace }                      = require('@opentelemetry/api')

// --- SDK ---
// Resource attributes (service name, version, environment) come from env vars
// in docker-compose rather than code, the Resources API changed between OTel
// versions and env vars sidestep that churn. The SDK's envDetector picks them
// up automatically from OTEL_SERVICE_NAME and OTEL_RESOURCE_ATTRIBUTES.
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    // 'tempo' resolves inside Docker only when the app is on the monitoring network.
    // Override at runtime with OTEL_EXPORTER_OTLP_TRACES_ENDPOINT.
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://tempo:4318/v1/traces',
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg':      { enabled: true },
      '@opentelemetry/instrumentation-http':    { enabled: true },
      '@opentelemetry/instrumentation-fs':      { enabled: false }, // too noisy
    }),
  ],
})

// Must start before any instrumented library is imported, hence --require.
sdk.start()

// Flush buffered spans before the process exits.
process.on('SIGTERM', () => sdk.shutdown())
process.on('SIGINT',  () => sdk.shutdown())

// --- Log <-> trace correlation ---
// Returns { trace_id, span_id } for the active span so log lines can be
// linked to traces in Grafana. The field name 'trace_id' matches the regex
// in datasources.yml, which turns it into a clickable Tempo link in Loki.
//
// Usage:
//   pino mixin:   const logger = pino({ mixin: traceContext })
//   manual:       logger.info({ ...traceContext(), event: 'payment.processed' })
//   middleware:   app.use((req, _res, next) => { req.log = traceContext(); next() })

function traceContext() {
  const span = trace.getActiveSpan()
  if (!span) return {}

  const ctx = span.spanContext()
  // All-zero ID means OTel has no real active trace (e.g. request not sampled).
  if (ctx.traceId === '00000000000000000000000000000000') return {}

  return {
    trace_id: ctx.traceId,
    span_id:  ctx.spanId,
  }
}

module.exports = { traceContext }