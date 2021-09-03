var STACKSWAP_CONTRACT = '0xeeeeaeccceeeaceeceea7719ece73b779a121f6c';

var EXCHANGE_IDS = [
  'USDT-USDC',
  'USDC-USDT',
  'DAI-BUSD',
  'BUSD-DAI',
  'USDT-BUSD',
  'USDC-BUSD',
  'USDT-DAI',
  'USDC-DAI',
  'DAI-USDC',
  'BUSD-USDC',
  'DAI-USDT',
  'BUSD-USDT',
];

var EXCHANGES = [
  { method: '0x100d2288', fee: null },
  { method: '0x2003dc1d', fee: null },
  { method: '0x300b6299', fee: null },
  { method: '0x40069d39', fee: null },
  { method: '0x5007b353', fee: null },
  { method: '0x600b8d14', fee: null },
  { method: '0x700b289a', fee: null },
  { method: '0x80051ad3', fee: null },
  { method: '0x90078849', fee: null },
  { method: '0xa0070cb4', fee: null },
  { method: '0xb00ce731', fee: null },
  { method: '0xc0017afc', fee: null },
];

var TOKENS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  BUSD: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
};

var TOKEN_DECIMALS = {
  USDT: 6,
  USDC: 6,
  DAI: 18,
  BUSD: 18,
};

var ERC20 = {
  balanceOf: '0x70a08231',
  approve: '0x095ea7b3',
  allowance: '0xdd62ed3e',
};

document.addEventListener('DOMContentLoaded', function() {

var $wrapper = document.getElementById('wrapper');

var $from = document.getElementById('from-select');
var $to = document.getElementById('to-select');

var $from_amount = document.getElementById('from-amount');
var $to_amount = document.getElementById('to-amount');

var $connect_btn = document.getElementById('connect-btn');
var $approve_btn = document.getElementById('approve-btn');
var $swap_btn = document.getElementById('swap-btn');

var getReturnAmount = async function(reversed) {
  var from_token = reversed ? $to.value : $from.value;
  var from_decimals = TOKEN_DECIMALS[from_token];
  var to_token = reversed ? $from.value : $to.value;
  var to_decimals = TOKEN_DECIMALS[to_token];
  var exchange = EXCHANGES[EXCHANGE_IDS.indexOf(from_token + '-' + to_token)];
  
  var amount = reversed ? $to_amount.value : $from_amount.value;
  var parts = amount.split('.');
  var amountIn_real = parts[0];
  var amountIn_decimals = ((parts.length > 1) ? (parts[1].length ? parts[1].replace(/0+$/, '') : '0') : '');
  var amountIn_formatted = amountIn_real + (amountIn_decimals.length ? (parts[1].length ? '.' + amountIn_decimals.substr(0, from_decimals) : '.') : '');

  var n = BigInt(from_decimals - to_decimals);
  var amountIn = BigInt(amountIn_real + amountIn_decimals.padEnd(from_decimals, '0'));
  var amountIn_adjusted = ((n !== 0n) ? (n > 0n ? amountIn / 10n**n : amountIn * 10n**(n*-1n)) : amountIn);
  
  var amountOut = (reversed ? ((amountIn_adjusted * exchange.fee) / (exchange.fee - 1n)) : (amountIn_adjusted - (amountIn_adjusted / exchange.fee)));
  var amountOut_real = amountOut / 10n**BigInt(to_decimals);
  var amountOut_decimals = amountOut.toString().substr(-to_decimals).replace(/0+$/, '');
  var amountOut_formatted = amountOut_real + (amountOut_decimals.length ? '.' + amountOut_decimals.substr(0, to_decimals) : '');
  
  $from_amount.value = reversed ? amountOut_formatted : amountIn_formatted;
  $to_amount.value = reversed ? amountIn_formatted : amountOut_formatted;
  
  var fromAmount = reversed ? amountOut : amountIn;
  var toAmount = reversed ? amountIn : amountOut;
  
  var balance = await getTokenBalance($from.value, ethereum.selectedAddress);
  if(balance < fromAmount) return $wrapper.className = 'nobalance';
  
  var allowance = await getTokenAllowance($from.value, STACKSWAP_CONTRACT, ethereum.selectedAddress);
  if(allowance < fromAmount) return $wrapper.className = 'noallowance';
  
  var liquidity = await getTokenBalance($to.value, STACKSWAP_CONTRACT);
  if(liquidity < toAmount) return $wrapper.className = 'noliquidity';
  
  $wrapper.className = 'ready';
};

var getTokenBalance = async function(token, address) {
  return BigInt(await ethereum.request({
    method: 'eth_call',
    params: [{
      to: TOKENS[token],
      data: ERC20.balanceOf + address.substr(2).padStart(64, '0'),
    }]
  }));
};

var getTokenAllowance = async function(token, spender, address) {
  return BigInt(await ethereum.request({
    method: 'eth_call',
    params: [{
      to: TOKENS[token],
      data: ERC20.allowance + address.substr(2).padStart(64, '0') + spender.substr(2).padStart(64, '0'),
    }]
  }));
};

$from.addEventListener('change', function(e) {
  var $options = $to.getElementsByTagName('option');
  for(var i = 0; i < $options.length; i++) {
    var $option = $options[i];
    if($option.value === $from.value) {
      if($from.selectedIndex === $to.selectedIndex) {
        $to.selectedIndex = ($from.selectedIndex === 0 ? 1 : 0);
      }
      break;
    }
  }
  getReturnAmount();
});

$to.addEventListener('change', function(e) {
  var $options = $from.getElementsByTagName('option');
  for(var i = 0; i < $options.length; i++) {
    var $option = $options[i];
    if($option.value === $to.value) {
      if($to.selectedIndex === $from.selectedIndex) {
        $from.selectedIndex = ($to.selectedIndex === 0 ? 1 : 0);
      }
      break;
    }
  }
  getReturnAmount(true);
});

$from_amount.addEventListener('keyup', function() {
  getReturnAmount();
});
$from_amount.addEventListener('change', function() {
  getReturnAmount();
});
$to_amount.addEventListener('keyup', function() {
  getReturnAmount(true);
});
$to_amount.addEventListener('change', function() {
  getReturnAmount(true);
});

// ---

var onDisconnect = function() {
  $wrapper.className = 'noconnect';
};

var onReady = function() {
  ethereum.request({
    method: 'eth_getBalance',
    params: [
      STACKSWAP_CONTRACT,
      'latest'
    ]
  }).then(function(e) {
  
    var balance = BigInt(e);
    for(var i = 0; i < 12; i++) {
      EXCHANGES[i].fee = ((balance >> (5n * BigInt(i))) & 31n) * 100n;
    }
    
    $from_amount.value = '1';
    getReturnAmount();
    $wrapper.className = 'ready';
    
  }).catch(onDisconnect);
};

$connect_btn.addEventListener('click', function(e) {
  if(ethereum.selectedAddress) return onReady();
  ethereum.enable().then(onReady).catch(onDisconnect);
});

var sendTransaction = async function(from, to, data) {
  var params = { from, to, data };
  params.gas = await ethereum.request({ method: 'eth_estimateGas', params: [params] });
  return await ethereum.request({ method: 'eth_sendTransaction', params: [params] });
};

var waitForTx = async function(hash, callback) {
  var tx = await ethereum.request({ method: 'eth_getTransactionByHash', params:[hash] });
  if(tx.blockNumber) return callback(tx);
  setTimeout(function() { waitForTx(hash, callback); }, 5000);
};

$approve_btn.addEventListener('click', function(e) {
  var data = ERC20.approve + STACKSWAP_CONTRACT.substr(2).padStart(64, '0') + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  sendTransaction(ethereum.selectedAddress, TOKENS[$from.value], data).then(function(hash) {
    $wrapper.className = 'approving';
    waitForTx(hash, function() {
      $wrapper.className = 'ready';
    });
  });
});

$swap_btn.addEventListener('click', function(e) {
  var from_token = $from.value;
  var from_decimals = TOKEN_DECIMALS[from_token];
  var to_token = $to.value;
  var exchange = EXCHANGES[EXCHANGE_IDS.indexOf(from_token + '-' + to_token)];
  
  var amount = $from_amount.value;
  var parts = amount.split('.');
  var amountIn_real = parts[0];
  var amountIn_decimals = ((parts.length > 1) ? parts[1].replace(/0+$/, '') : '');
  var amountIn = BigInt(amountIn_real + amountIn_decimals.padEnd(from_decimals, '0'));
  
  var data = exchange.method + amountIn.toString(16).padStart(64, '0');
  sendTransaction(ethereum.selectedAddress, STACKSWAP_CONTRACT, data).then(function(hash) {
    $wrapper.className = 'swapping';
    waitForTx(hash, function() {
      $wrapper.className = 'ready';
    });
  });
});

// init
if(typeof window.ethereum === 'undefined' || !ethereum.isMetaMask) {
  $wrapper.className = 'nometamask';
}
else {
  ethereum.enable().then(onReady).catch(onDisconnect);
}

});
