const express = require('express');
const db = require('./lib/db');
const protocol = require('./lib/protocol');

const app = express();
const PORT = process.env.PORT || 4150;

// The vendor doc says the machine sends "HTTP POST ... key-value pairs,"
// but some firmware builds send JSON instead. Accept both so we never drop
// a real request over a Content-Type mismatch.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Admin endpoints: how MCOS actually issues instructions ----
// There's no dashboard yet, so these are the raw levers, usable directly
// with curl/Postman today. The real MCOS-V2 UI calls these same functions
// once it exists — nothing here changes when that UI is built.

app.post('/admin/command', (req, res) => {
  res.json({ queued: db.queueCommand(req.body) });
});

app.post('/admin/redeem-code', (req, res) => {
  res.json({ created: db.createRedeemCode(req.body) });
});

app.get('/admin/events', (req, res) => {
  res.json(db.getEvents(req.query.machineId, Number(req.query.limit) || 50));
});

app.get('/admin/slots', (req, res) => {
  res.json(db.getSlots(req.query.machineId));
});

// ---- The actual machine protocol ----
// The vendor doc never specifies the exact URL path the machine posts to
// (only the IP and port are configurable in the machine's settings screen),
// so this catches EVERY POST that isn't one of the /admin routes above.
// That's deliberate: better to answer on whatever path shows up than to
// 404 the machine and trigger the "keeps calling back" failure mode.
app.post(/.*/, (req, res) => {
  const body = req.body || {};
  const funCode = String(body.FunCode || '').trim();
  const machineId = body.MachineID || 'unknown';

  db.logEvent(machineId, funCode || `unrecognized:${req.path}`, 'in', body);

  let response;
  try {
    switch (funCode) {
      case '1000':
        response = protocol.handleProductUpload(body);
        break;
      case '2000':
        response = protocol.handlePickupCode(body);
        break;
      case '4000':
        response = protocol.handlePolling(body);
        break;
      case '5000':
        response = protocol.handleShipmentResult(body);
        break;
      case '5001':
        response = protocol.handleRemoteLoadResult(body);
        break;
      default:
        // Unknown FunCode (or no body at all, e.g. a stray health check
        // hitting this path). Per the doc, an unanswered call gets retried
        // indefinitely — so we always send something back, even here.
        response = { Status: '0' };
    }
  } catch (err) {
    console.error('Handler error for FunCode', funCode, err);
    response = { Status: '0' };
  }

  db.logEvent(machineId, funCode, 'out', response);
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`MCOS TCN gateway listening on port ${PORT}`);
});
