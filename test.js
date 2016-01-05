var Promise = require('bluebird');
var Web3    = require('web3');
var solc    = require('solc');
var fs      = require('fs');

var CONTRACT_NAME = 'c1';

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

var readfs  = Promise.promisify(fs.readFile);
var writefs = Promise.promisify(fs.writeFile);
var sendtx  = Promise.promisify(web3.eth.sendTransaction);

var inputs = {};
var results = {};

var mainContract;
var txdata;

console.log('Compiling contracts...');
readfs('c1.sol', 'utf8')
.then(function(data) {
    inputs['c1.sol'] = data;
    return readfs('c2.sol', 'utf8');
})
.then(function(data) {
    inputs['c2.sol'] = data;
    return compile();
})
.then(function(data) {
    results.output = data;
    console.log('Contracts compiled successfully.');
    console.log('Deploying lib contract...');
    return deployLoanLib(data);
})
.then(function(tx) {
    return getTransactionReceipt(tx);
})
.then(function(receipt) {
    results.loanLibAddress = receipt.contractAddress;
    console.log('Loan lib deployed at ' + results.loanLibAddress);
    console.log('Deploying main loan contract...');
    return deployLoanContract(results.output);
})
.then(function(tx) {
    return getTransactionReceipt(tx);
})
.then(function(receipt) {
    console.log('Main contract deployed at ' + receipt.contractAddress);
    results.loanContractAddress = receipt.contractAddress;
    mainContract = web3.eth.contract(results.loanContractABI).at(results.loanContractAddress);
    txdata = {from: web3.eth.coinbase, gas:3141592};
    var setc2 = Promise.promisify(mainContract.setc2);
    return setc2('' + results.loanLibAddress, txdata);
})
.then(function(tx) {
    return getTransactionReceipt(tx);
})
.then(function(receipt) {
    console.log('Lib address set.');
    console.log('Calling setValues...');
    return Promise.promisify(mainContract.setValues)('testando', 12345, ''+results.loanLibAddress, txdata);
})
.then(function(tx) {
    return getTransactionReceipt(tx);
})
.then(function(receipt) {
    console.log('Values set!');
    return Promise.promisify(mainContract._str.call)();
})
.then(function(str) {
    console.log('str=' + str);
    return Promise.promisify(mainContract._value.call)();
})
.then(function(value) {
    console.log('value=' + value);
    return Promise.promisify(mainContract._addr.call)();
})
.then(function(addr) {
    console.log('addr=' + addr);
    return Promise.promisify(mainContract.setStr)('testing', txdata);
})
.then(function(tx) {
    return getTransactionReceipt(tx);
})
.then(function(receipt) {
    return Promise.promisify(mainContract._str.call)();
})
.then(function(str) {
    console.log('str=' + str);
})
.catch(function(err) {
    console.log(err);
    throw err;
});

function compile() {
    return new Promise(function(resolve, reject) {
        var data = solc.compile({sources: inputs}, 0);
        if (data.errors != null) {
            reject(data.errors);
            return;
        }
        resolve(data);
    });
}

function deployLoanLib(data) {
    var transaction = {
        from: web3.eth.coinbase,
        data: data.contracts['c2'].bytecode,
        gas: 3141592,
        gasPrice: Math.pow(10, 12)
    };
    return sendtx(transaction);
}

function deployLoanContract(data) {
    results.loanContractABI = JSON.parse(data.contracts['c1'].interface);
    var transaction = {
        from: web3.eth.coinbase,
        data: data.contracts['c1'].bytecode,
        gas: 3141592,
        gasPrice: Math.pow(10, 12)
    };
    return sendtx(transaction);
}

function callLibAddress() {
    var c = web3.eth.contract(results.loanContractABI).at(results.loanContractAddress);
    console.log(JSON.stringify(results.loanContractABI));
    return Promise.promisify(c._c2Addr.call)();
}

function getTransactionReceipt(hash) {
    var getReceipt = Promise.promisify(web3.eth.getTransactionReceipt);
    return new Promise(function(resolve, reject) {
        var interval = setInterval(function() {
            getReceipt(hash)
            .then(function(receipt) {
                if (receipt != null) {
                    clearInterval(interval);
                    resolve(receipt);
                } else {
                    //console.log('Waiting for the contract to be mined...');
                }
            })
            .catch(function(err) {
                reject(err);
            });
        }, 1000);
    });
}
