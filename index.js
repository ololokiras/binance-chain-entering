const BnbApiClient = require('@binance-chain/javascript-sdk');
const crypto = BnbApiClient.crypto;
const fs = require('fs');
const WebSocket = require('ws');
const { serverUrl, wsAddr } = require('./config');

const bnbClient = new BnbApiClient(serverUrl);

async function registration() {
  // create account with mnemonic
  const accountWithMnemonic = await bnbClient.createAccountWithMneomnic();
  console.log(accountWithMnemonic);
  fs.appendFile('accounts', 'mnemonicAccount:\n' + JSON.stringify(accountWithMnemonic) + '\n', err => {
    if (err)
      console.log(err);
  });

  // create account with password
  const testPass = '1234567890';
  const accountWithPassword = await bnbClient.createAccountWithKeystore(testPass);
  console.log(accountWithPassword);
  fs.appendFile('accounts', 'passwordAccount:\n' + JSON.stringify(accountWithPassword) + '\n', err => {
    if (err)
      console.log(err);
  });

  // create account simple
  const accountSimple = await bnbClient.createAccount();
  console.log(accountSimple);
  fs.appendFile('accounts', 'simpleAccount:\n' + JSON.stringify(accountSimple) + '\n', err => {
    if (err)
      console.log(err);
  });
}

async function getInfo(address) {
  // getting balance
  const balance = await bnbClient.getBalance(address);
  console.log(balance);

  // getting user
  const user = await bnbClient.getAccount(address);
  console.log(user);
  const balanceFromUser = user.result.balances;
  console.log(balanceFromUser);

  // checking address exist
  const isAddressExist = await bnbClient.checkAddress(address);
  console.log(isAddressExist);
}

function parseOrderMsg(data) {
  const reports = data.map(report => {
    const symbol = report.s;
    let side = report.S;
    if (Number.isInteger(side)) {
      side = side === 1 ? 'BUY' : 'SELL';
    }
    const quantity = report.q;
    const price = report.p;
    const executionType = report.x;
    const orderStatus = report.X;
    const orderId = report.i;
    const lastExecutedQuantity = report.l;
    const lastCumulativeFilledQuantity = report.z;
    const lastExecutedPrice = report.Z;
    const commissionAmount = report.n; // format of value: 123BNB
    const transactionTime = report.T;
    const orderCreationTime = report.O;
    const tradeId = report.t;
    let orderType = report.o;
    if (Number.isInteger(orderType )) {
      if (parseInt(orderType) === 2) {
        orderType = 'LIMIT';
      }
    }
    return humanReadable = {
      symbol,
      side,
      quantity,
      price,
      executionType, orderStatus,
      orderId,
      lastExecutedQuantity,
      lastCumulativeFilledQuantity,
      lastExecutedPrice,
      commissionAmount,
      transactionTime,
      orderCreationTime,
      tradeId,
      orderType
    }
  });

  console.log(reports);
}

function parseAccountMsg(data) {
  console.log(data);
}

function parseTransferMsg(data) {
  console.log(data);
  fs.appendFile('tranferlog', JSON.stringify(data), err => {
    if (err)
      console.log(err);
  });
}

function parseMsg(msg) {
  const data = JSON.parse(msg.data);
  // console.log(data);
  switch (data.stream) {
    case 'orders':
      parseOrderMsg(data.data);
      break;
    case 'accounts':
      parseAccountMsg(data.data);
      break;
    case 'transfers':
      parseTransferMsg(data.data);
      break;
    default:
      break;
  }
}


// this part of code without stable connection with keepAlive
async function subscribe(address) {
  const accountAndOrderAndTransfers = new WebSocket(wsAddr + address);
  accountAndOrderAndTransfers.onopen = (evt) => {
    console.log('onopen');
  };
  accountAndOrderAndTransfers.onclose = (evt) => {
    console.log('onclose');
  };
  accountAndOrderAndTransfers.onerror = (evt) => {
    console.log('onerror');
    console.log(evt);
  };
  accountAndOrderAndTransfers.onmessage = (msg) => {
    console.log('onmessage');
    parseMsg(msg);
  };
}

async function main() {
  await bnbClient.initChain();

    await registration();

  const addressForInfo = 'tbnb14760hpkxz067y2d44yzyrw9uupa3rn0am6zux7';
  await getInfo(addressForInfo);

  await subscribe(addressForInfo);
}

main();
