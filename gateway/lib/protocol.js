const db = require('./db');

// Every field name below is transcribed directly from Hunan Yunshu's own
// "interface design (V2.5)" document (Hunan Yunshu Information Technology
// Co., Ltd. — www.herevend.com), obtained directly from their support contact.
// Field spellings — including the inconsistent "Err" vs "Er" between message
// types — are kept exactly as documented. That inconsistency is the vendor's,
// not a typo introduced here. Verify against real captured traffic
// (GET /admin/events) before assuming something here is wrong.

// FunCode 1000 — the machine reports its own product/slot data.
// Fires automatically: on restart, after any slot edit (local or remote),
// and after a successful sale. This is the machine keeping us in sync,
// unprompted.
function handleProductUpload(body) {
  db.upsertSlot(body.MachineID, body.SlotNo, {
    productId: body.ProductID,
    name: body.Name,
    price: body.Price,
    type: body.Type,
    introduction: body.Introduction,
    quantity: body.Quantity,
    stock: body.Stock,
    capacity: body.Capacity,
    keyNum: body.KeyNum,
    conveyorStatus: body.Status,
  });
  return {
    Status: '0',
    SlotNo: body.SlotNo,
    TradeNo: body.TradeNo,
    Err: 'success',
  };
}

// FunCode 2000 — customer entered a pickup code (or scanned a QR / swiped an
// IC card). This is the hook for vouchers, free-item codes, and discounts:
// whatever decides what a code is worth happens here.
function handlePickupCode(body) {
  const redemption = db.redeemCode(body.SessionCode);
  if (!redemption) {
    return {
      Status: '1', // any non-zero Status means failure, per the doc
      SlotNo: '-1',
      ProductID: '',
      TradeNo: body.TradeNo,
      Er: 'Invalid or expired code',
    };
  }
  return {
    Status: '0',
    SlotNo: redemption.slotNo,
    ProductID: redemption.productId,
    TradeNo: body.TradeNo,
    Er: 'Success', // this interface's success key is "Er", not "Err" — per the vendor doc
  };
}

// FunCode 4000 — the heartbeat. The machine calls this on its own timer
// (vendor doc says default 3s; their own support contact confirmed "every
// 3S" independently). This is where MCOS actually gives instructions:
// dispense right now (MsgType 0), or update a slot's price/name/image
// (MsgType 1).
function handlePolling(body) {
  const cmd = db.nextCommandFor(body.MachineID);
  if (!cmd) {
    // The doc doesn't show an explicit "nothing to do" example — this is our
    // best-guess idle response. Confirm on the test machine that a bare
    // {"Status":"0"} doesn't cause any odd behavior; adjust here if it does.
    return { Status: '0' };
  }

  if (cmd.msgType === 0) {
    return {
      Status: '0',
      MsgType: '0',
      TradeNo: cmd.tradeNo,
      SlotNo: cmd.slotNo,
      ProductID: cmd.productId,
      Err: 'Success',
    };
  }

  // MsgType 1 — remote product/slot update. ImageUrl / ImageDetailUrl here
  // is the actual mechanism for pushing a product image remotely.
  return {
    Status: '0',
    MsgType: '1',
    SlotNo: cmd.slotNo,
    TradeNo: cmd.tradeNo,
    Capacity: cmd.capacity,
    Quantity: cmd.quantity,
    ProductID: cmd.productId,
    Name: cmd.name,
    Price: cmd.price,
    Type: cmd.type,
    Introduction: cmd.introduction,
    ImageUrl: cmd.imageUrl,
    ImageDetailUrl: cmd.imageDetailUrl,
    GoodsAdUrl: cmd.goodsAdUrl,
    Er: 'Success', // the doc's own example uses "Er" + the literal Chinese "成功" here
  };
}

// FunCode 5000 — machine reports a completed (or failed) sale.
function handleShipmentResult(body) {
  db.logEvent(body.MachineID, '5000-sale', 'record', {
    payType: body.PayType,
    tradeNo: body.TradeNo,
    slotNo: body.SlotNo,
    status: body.Status, // 0 success, 1 failed, -1 unknown (e.g. power loss mid-vend)
    time: body.Time,
    amount: body.Amount,
    productId: body.ProductID,
    name: body.Name,
    type: body.Type,
  });
  return {
    Status: '0',
    TradeNo: body.TradeNo,
    SlotNo: body.SlotNo,
    Err: 'Success',
  };
}

// FunCode 5001 — confirms whether a remote MsgType-1 update actually took.
function handleRemoteLoadResult(body) {
  db.logEvent(body.MachineID, '5001-load-result', 'record', {
    slotNo: body.SlotNo,
    status: body.Status,
  });
  return {
    Status: '0',
    SlotNo: body.SlotNo,
    TradeNo: body.TradeNo || '',
    Err: 'Success',
  };
}

module.exports = {
  handleProductUpload,
  handlePickupCode,
  handlePolling,
  handleShipmentResult,
  handleRemoteLoadResult,
};
