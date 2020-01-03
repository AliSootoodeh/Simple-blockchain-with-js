const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const uuid = require("uuid/v1");
const Blockchain = require("./blockchain");
const Port = process.argv[2];
const rp = require("request-promise");

const nodeAddress = uuid()
  .split("-")
  .join("");

const Bitcoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/blockchain", function(req, res) {
  res.send(Bitcoin);
});

app.post("/transaction", function(req, res) {
  const newTransaction = req.body;
  const blockIndex = Bitcoin.addTransactionToPendingTransaction(newTransaction);
  res.json({
    note: `Transaction will be added in block ${blockIndex}.`
  });
});

app.post("/transaction/broadcast", function(req, res) {
  const newTransaction = Bitcoin.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  Bitcoin.addTransactionToPendingTransaction(newTransaction);
  const requestPromises = [];
  Bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then(data => {
      res.json({
        note: "Transaction created an broadcast successfully"
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/mine", function(req, res) {
  const lastBlock = Bitcoin.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: Bitcoin.pendingTransactions,
    index: lastBlock["index"] + 1
  };
  const nonce = Bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const hash = Bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = Bitcoin.createNewBlock(nonce, previousBlockHash, hash);

  const requestPromises = [];
  Bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: { newBlock: newBlock },
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then(data => {
      const requestOptions = {
        uri: Bitcoin.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          recipient: nodeAddress
        },
        json: true
      };
      return rp(requestOptions);
    })
    .then(data => {
      res.json({
        note: "New block mined & broadcast successfully.",
        block: newBlock
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.post("/receive-new-block", function(req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = Bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    Bitcoin.chain.push(newBlock);
    Bitcoin.pendingTransactions = [];
    res.json({
      note: "new Block received and accepted",
      newBlock: newBlock
    });
  } else {
    res.json({
      note: "New Block Rejected",
      newBlock: newBlock
    });
  }
});

// register a new node and broadcast it the network

app.post("/register-and-broadcast-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (Bitcoin.networkNodes.indexOf(newNodeUrl) === -1) {
    Bitcoin.networkNodes.push(newNodeUrl);
  }
  const regNodePromises = [];
  Bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true
    };
    regNodePromises.push(rp(requestOptions));
  });

  Promise.all(regNodePromises)
    .then(data => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...Bitcoin.networkNodes, Bitcoin.currentNodeUrl]
        },
        json: true
      };
      return rp(bulkRegisterOptions);
    })
    .then(data => {
      res.json({
        note: "New node registered with network successfully."
      });
    })
    .catch(err => {
      console.log(err);
    });
});

// register a node with network
app.post("/register-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = Bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = Bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    Bitcoin.networkNodes.push(newNodeUrl);
  }
  res.json({
    note: "New Node registered successfully."
  });
});

// register multiple nodes at once
app.post("/register-nodes-bulk", function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent =
      Bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = Bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
      Bitcoin.networkNodes.push(networkNodeUrl);
    }
  });
  res.json({
    note: "Bulk registration successful."
  });
});

app.get("/consensus", function(req, res) {
  const requestPromises = [];
  Bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then(blockchains => {
      const currentChainLength = Bitcoin.chain.length;
      let maxChainLength = currentChainLength;
      let newLongestChain = null;
      let newPendingTransactions = null 
      blockchains.forEach(blockchain => {
        if(blockchain.chain.length  > maxChainLength ){
          maxChainLength = blockchain.chain.length;
          newLongestChain = blockchain.chain;
          newPendingTransactions = blockchain.pendingTransactions;
        }
      })
      if(!newLongestChain || (newLongestChain && !Bitcoin.chainIsValid(newLongestChain))){
        res.json({
          note : 'Current chain has not replaced',
          chain : Bitcoin.chain
        })
      }
      else if(newLongestChain && Bitcoin.chainIsValid(newLongestChain)){
        Bitcoin.chain = newLongestChain;
        Bitcoin.pendingTransactions = newPendingTransactions;
        res.json({
          note : 'This chain has been replaced',
          chain : Bitcoin.chain
        })
      }
    })
    .catch(err => {
      console.log(err);
    });
});



app.get('/block/:blockHash',function(req , res){
  const blockHash =req.params.blockHash;
  const correctBlock = Bitcoin.getBlock(blockHash);
     res.json({
      block : correctBlock
    })
  
})

app.get('/transaction/:transactionId', function(req , res){
  const transactionId = req.params.transactionId;
  const transactionData = Bitcoin.getTransaction(transactionId);
  res.json({
    transaction : transactionData.transaction,
    block :transactionData.block
  })
})


app.get('/address/:address', function(req ,res){
  const address = req.params.address;
  const addressData = Bitcoin.getAddressData(address)
  res.json({
    addressData : addressData
  })
})


app.get('/block-explorer',function(req , res){
  res.sendFile('./block-explorer/index.html', {root : __dirname})
})



app.listen(Port, () => {
  console.log(`Server is running on ${Port}`);
});
